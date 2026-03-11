import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';
import { notifyDpwTrainingComplete } from '@/lib/dpw-client';

const MODULE_MAX_STEPS: Record<string, number> = {
  mapper: 7,
  validator: 6,
  mobile_mapping: 4,
  household_survey: 4,
  microtasking1: 3,
  microtasking2: 3,
  microtasking3: 3,
};

/**
 * GET /api/training/progress?module=mapper
 * Returns the authenticated user's training progress from Learn's own DB.
 */
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moduleFilter = searchParams.get('module');

  let query = `SELECT module_type, step_id, completed_at FROM training_progress WHERE user_id = $1`;
  const params: (string | number)[] = [token.userId];

  if (moduleFilter) {
    query += ' AND module_type = $2';
    params.push(moduleFilter);
  }
  query += ' ORDER BY module_type, step_id';

  const result = await Database.query(query, params);

  const progressByModule: Record<string, number[]> = {};
  for (const row of result.rows) {
    if (!progressByModule[row.module_type]) progressByModule[row.module_type] = [];
    progressByModule[row.module_type].push(row.step_id);
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: token.userId,
      progress: progressByModule,
      totalCompleted: result.rows.length,
      details: result.rows,
    },
  });
}

/**
 * POST /api/training/progress
 * Body: { moduleType: string, stepId: number }
 * Records completion of a training step. Enforces sequential ordering.
 */
export async function POST(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  const body = await request.json();
  const { moduleType, stepId } = body;

  if (!moduleType || stepId == null) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'moduleType and stepId are required' } }, { status: 400 });
  }

  const maxStep = MODULE_MAX_STEPS[moduleType];
  if (!maxStep) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: 'Invalid module type' } }, { status: 400 });
  }

  const stepNumber = Number(stepId);
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > maxStep) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION', message: `stepId must be between 1 and ${maxStep}` } }, { status: 400 });
  }

  // Enforce sequential completion
  if (stepNumber > 1) {
    const prev = await Database.query(
      `SELECT step_id FROM training_progress WHERE user_id = $1 AND module_type = $2 AND step_id = $3`,
      [token.userId, moduleType, stepNumber - 1]
    );
    if (prev.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'PREREQUISITE', message: `Complete step ${stepNumber - 1} before step ${stepNumber}` },
      }, { status: 403 });
    }
  }

  await Database.query(
    `INSERT INTO training_progress (user_id, module_type, step_id, completed_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, module_type, step_id) DO NOTHING`,
    [token.userId, moduleType, stepNumber]
  );

  // If this was the final step, notify DPW (Option B webhook — fire-and-forget)
  if (stepNumber === maxStep) {
    notifyDpwTrainingComplete(
      token.userId,
      moduleType,
      new Date().toISOString()
    );
  }

  return NextResponse.json({
    success: true,
    data: { userId: token.userId, moduleType, stepId: stepNumber },
  });
}

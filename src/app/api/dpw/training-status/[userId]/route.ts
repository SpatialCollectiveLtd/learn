import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';

const DPW_API_SECRET = process.env.DPW_API_SECRET || process.env.DPW_MANAGER_API_KEY;

// Training step counts per module
const MODULE_TOTAL_STEPS: Record<string, number> = {
  mapper: 7,
  validator: 6,
  mobile_mapping: 4,
  microtasking: 3,
  qgis_digitization: 6,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Server-to-server auth — DPW calls this with the shared secret
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ') || authHeader.substring(7) !== DPW_API_SECRET) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid authorization' } },
        { status: 401 }
      );
    }

    const { userId } = await params;

    const result = await Database.query(
      `SELECT module_type, step_id, completed_at
       FROM training_progress
       WHERE user_id = $1
       ORDER BY module_type, step_id`,
      [userId]
    );

    // Group by module
    const modules: Record<string, { steps_completed: number; steps_total: number; completed_at: string | null }> = {};

    for (const row of result.rows) {
      if (!modules[row.module_type]) {
        modules[row.module_type] = {
          steps_completed: 0,
          steps_total: MODULE_TOTAL_STEPS[row.module_type] || 0,
          completed_at: null,
        };
      }
      const mod = modules[row.module_type];
      mod.steps_completed++;
      // Track latest completion
      if (!mod.completed_at || row.completed_at > mod.completed_at) {
        mod.completed_at = row.completed_at;
      }
    }

    // Check if all modules are complete
    const moduleList = Object.entries(modules).map(([module_type, data]) => ({
      module_type,
      ...data,
    }));

    const trainingComplete = moduleList.length > 0 && moduleList.every(
      (m) => m.steps_total > 0 && m.steps_completed >= m.steps_total
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        training_complete: trainingComplete,
        modules: moduleList,
      },
    });
  } catch (error) {
    console.error('Training status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch training status' } },
      { status: 500 }
    );
  }
}

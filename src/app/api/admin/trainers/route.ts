import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';
import { getTrainers } from '@/lib/dpw-client';

export interface TrainerRow {
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  settlement: string | null;
  module: string | null;
  youth_count: number;
  is_active: boolean;
  has_password: boolean;
}

// GET /api/admin/trainers — list trainers from DPW, enriched with local Learn password status
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }
  if (!hasRole(token, 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  try {
    // DPW is the authoritative source for the trainer list
    const dpwTrainers = await getTrainers();

    // Check which trainers have a local Learn password set
    let passwordMap: Record<string, boolean> = {};
    if (dpwTrainers.length > 0) {
      const trainerIds = dpwTrainers.map((t) => t.trainer_id);
      const { rows } = await Database.query<{ staff_id: string; has_password: boolean }>(
        `SELECT staff_id, (password_hash IS NOT NULL) AS has_password
         FROM staff_members
         WHERE staff_id = ANY($1)`,
        [trainerIds]
      );
      passwordMap = Object.fromEntries(rows.map((r) => [r.staff_id, r.has_password]));
    }

    const result: TrainerRow[] = dpwTrainers.map((t) => ({
      staff_id: t.trainer_id,
      full_name: t.full_name,
      email: t.email,
      role: 'trainer',
      settlement: t.settlement ?? null,
      module: t.module ?? null,
      youth_count: t.youth_count ?? 0,
      is_active: t.is_active,
      has_password: passwordMap[t.trainer_id] ?? false,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET /api/admin/trainers error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trainers' } }, { status: 500 });
  }
}

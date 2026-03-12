import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

export interface TrainerRow {
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  settlement: string | null;
  is_active: boolean;
  has_password: boolean;
  created_at: string | null;
}

// GET /api/admin/trainers — list all trainer + admin staff accounts (admin only)
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }
  if (!hasRole(token, 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  try {
    const { rows } = await Database.query<TrainerRow>(`
      SELECT
        staff_id,
        full_name,
        email,
        role,
        settlement,
        is_active,
        (password_hash IS NOT NULL) AS has_password,
        created_at
      FROM staff_members
      WHERE role IN ('trainer', 'admin')
      ORDER BY role, full_name
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('GET /api/admin/trainers error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trainers' } }, { status: 500 });
  }
}

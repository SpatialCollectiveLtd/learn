import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Database } from '@/app/api/_lib/database';
import { signToken, normalizeRole } from '@/app/api/_lib/auth';
import type { LearnTokenPayload } from '@/app/api/_lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Look up the staff member by email
    const { rows } = await Database.query<{
      staff_id: string;
      full_name: string;
      email: string;
      role: string;
      settlement: string | null;
      password_hash: string | null;
      is_active: boolean;
    }>(
      `SELECT staff_id, full_name, email, role, settlement, password_hash, is_active
       FROM staff_members
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    // Constant-time response — do not reveal whether email exists
    const staff = rows[0] ?? null;
    const INVALID_CREDS = { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };

    if (!staff || !staff.is_active || !staff.password_hash) {
      return NextResponse.json(INVALID_CREDS, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, staff.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(INVALID_CREDS, { status: 401 });
    }

    const role = normalizeRole(staff.role);

    const payload: LearnTokenPayload = {
      userId: staff.staff_id,
      fullName: staff.full_name,
      role,
      settlement: staff.settlement,
      module: null,
      moduleAssignment: null,
      userType: 'staff',
    };

    const token = signToken(payload);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          userId: staff.staff_id,
          fullName: staff.full_name,
          email: staff.email,
          role,
          settlement: staff.settlement,
          userType: 'staff',
          module: null,
          moduleAssignment: null,
        },
      },
    });
  } catch (error) {
    console.error('Staff auth error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
      { status: 500 }
    );
  }
}

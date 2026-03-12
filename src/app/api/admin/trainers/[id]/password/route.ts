import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

// PATCH /api/admin/trainers/[id]/password — admin sets/resets a trainer's Learn password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }
  if (!hasRole(token, 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Password must be at least 8 characters' } },
        { status: 400 }
      );
    }

    // Confirm the target staff member exists and is a trainer/admin
    const { rows } = await Database.query<{ staff_id: string; full_name: string; role: string }>(
      `SELECT staff_id, full_name, role FROM staff_members WHERE staff_id = $1 AND role IN ('trainer', 'admin')`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } },
        { status: 404 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    await Database.query(
      `UPDATE staff_members SET password_hash = $1 WHERE staff_id = $2`,
      [hash, id]
    );

    return NextResponse.json({
      success: true,
      data: { staff_id: id, full_name: rows[0].full_name, message: 'Password updated successfully' },
    });
  } catch (error) {
    console.error('PATCH /api/admin/trainers/[id]/password error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update password' } }, { status: 500 });
  }
}

// DELETE /api/admin/trainers/[id]/password — clear a trainer's password (revoke email login access)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }
  if (!hasRole(token, 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  const { id } = await params;

  try {
    await Database.query(
      `UPDATE staff_members SET password_hash = NULL WHERE staff_id = $1 AND role IN ('trainer', 'admin')`,
      [id]
    );
    return NextResponse.json({ success: true, data: { message: 'Password cleared — email login revoked' } });
  } catch (error) {
    console.error('DELETE /api/admin/trainers/[id]/password error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clear password' } }, { status: 500 });
  }
}

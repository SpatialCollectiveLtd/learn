import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';
import { getUser } from '@/lib/dpw-client';

// PATCH /api/admin/trainers/[id]/password — admin sets/resets a trainer's Learn password.
// Creates a staff_members record via upsert if the trainer has not previously logged into Learn.
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

    // Fetch trainer from DPW to validate they exist and are staff (not youth)
    let dpwUser: Awaited<ReturnType<typeof getUser>>;
    try {
      dpwUser = await getUser(id);
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trainer not found' } },
        { status: 404 }
      );
    }

    if (dpwUser.role === 'youth') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot set Learn password for youth participants' } },
        { status: 403 }
      );
    }

    const hash = await bcrypt.hash(password, 12);

    // Upsert into staff_members — creates the record on first password set, updates on reset
    await Database.query(
      `INSERT INTO staff_members (staff_id, full_name, email, role, settlement, is_active, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (staff_id) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name     = EXCLUDED.full_name,
         email         = EXCLUDED.email,
         settlement    = EXCLUDED.settlement,
         is_active     = EXCLUDED.is_active`,
      [id, dpwUser.full_name, dpwUser.email, dpwUser.role, dpwUser.settlement, dpwUser.is_active ?? true, hash]
    );

    return NextResponse.json({
      success: true,
      data: { staff_id: id, full_name: dpwUser.full_name, message: 'Password updated successfully' },
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
      `UPDATE staff_members SET password_hash = NULL WHERE staff_id = $1`,
      [id]
    );
    return NextResponse.json({ success: true, data: { message: 'Password cleared — email login revoked' } });
  } catch (error) {
    console.error('DELETE /api/admin/trainers/[id]/password error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clear password' } }, { status: 500 });
  }
}


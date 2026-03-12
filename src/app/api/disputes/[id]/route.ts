import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

// PATCH /api/disputes/[id] — trainer or admin resolves/rejects a dispute
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }
  if (!hasRole(token, 'trainer', 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Trainer or admin access required' } }, { status: 403 });
  }

  const { id } = await params;
  const disputeId = parseInt(id, 10);
  if (isNaN(disputeId)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid dispute ID' } }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, resolution_note } = body;

    if (!status || !['resolved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: "status must be 'resolved' or 'rejected'" } },
        { status: 400 }
      );
    }

    // Confirm dispute exists and is open
    const { rows: existing } = await Database.query<{ id: number; status: string }>(
      `SELECT id, status FROM payment_disputes WHERE id = $1`,
      [disputeId]
    );
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Dispute not found' } }, { status: 404 });
    }
    if (existing[0].status !== 'open') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RESOLVED', message: 'This dispute has already been resolved or rejected' } },
        { status: 409 }
      );
    }

    const { rows } = await Database.query(
      `UPDATE payment_disputes
       SET status = $1,
           resolver_staff_id = $2,
           resolution_note = $3,
           resolved_at = NOW()
       WHERE id = $4
       RETURNING id, status, resolution_note, resolved_at, resolver_staff_id`,
      [status, token.userId, resolution_note?.trim() || null, disputeId]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(`PATCH /api/disputes/${id} error:`, error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update dispute' } }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

const ISSUE_TYPES = ['missed_attendance', 'wrong_volume', 'missing_bonus', 'wrong_module', 'other'] as const;

// POST /api/disputes — youth creates a dispute
// GET  /api/disputes — youth views own; trainer/admin views all (filter: ?youth_id=)
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filterYouthId = searchParams.get('youth_id');
  const filterStatus = searchParams.get('status'); // 'open' | 'resolved' | 'rejected'
  const filterSettlement = searchParams.get('settlement');

  const VALID_STATUSES = ['open', 'resolved', 'rejected'];

  try {
    let query: string;
    let params: unknown[];

    if (token.role === 'youth') {
      // Youth can only see their own disputes
      query = `
        SELECT id, youth_id, dispute_date, module, issue_type, description,
               expected_amount_kes, reported_amount_kes, status,
               resolution_note, created_at, resolved_at
        FROM payment_disputes
        WHERE youth_id = $1
        ORDER BY created_at DESC
      `;
      params = [token.userId];
    } else {
      // Trainer / admin — build dynamic WHERE clause from optional filters
      const conditions: string[] = [];
      params = [];

      if (filterYouthId) {
        params.push(filterYouthId);
        conditions.push(`pd.youth_id = $${params.length}`);
      }

      if (filterStatus && VALID_STATUSES.includes(filterStatus)) {
        params.push(filterStatus);
        conditions.push(`pd.status = $${params.length}`);
      }

      if (filterSettlement) {
        params.push(filterSettlement);
        conditions.push(`yp.settlement = $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      query = `
        SELECT pd.id, pd.youth_id, yp.full_name AS youth_name, yp.settlement,
               pd.dispute_date, pd.module, pd.issue_type, pd.description,
               pd.expected_amount_kes, pd.reported_amount_kes, pd.status,
               pd.resolver_staff_id, pd.resolution_note, pd.created_at, pd.resolved_at
        FROM payment_disputes pd
        JOIN youth_participants yp ON yp.youth_id = pd.youth_id
        ${whereClause}
        ORDER BY pd.created_at DESC
        LIMIT 500
      `;
    }

    const { rows } = await Database.query(query, params as unknown[]);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('GET /api/disputes error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch disputes' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  // Only youth can file disputes
  if (token.role !== 'youth') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only youth participants can file disputes' } }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { dispute_date, module: mod, issue_type, description, expected_amount_kes, reported_amount_kes } = body;

    // Basic validation
    if (!dispute_date || !issue_type) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'dispute_date and issue_type are required' } }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dispute_date)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'dispute_date must be YYYY-MM-DD' } }, { status: 400 });
    }

    if (!ISSUE_TYPES.includes(issue_type)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: `issue_type must be one of: ${ISSUE_TYPES.join(', ')}` } }, { status: 400 });
    }

    // Prevent duplicate open dispute for same youth + date
    const existing = await Database.query(
      `SELECT id FROM payment_disputes WHERE youth_id = $1 AND dispute_date = $2 AND status = 'open'`,
      [token.userId, dispute_date]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: { code: 'CONFLICT', message: 'An open dispute already exists for this date' } }, { status: 409 });
    }

    const { rows } = await Database.query(
      `INSERT INTO payment_disputes
         (youth_id, dispute_date, module, issue_type, description, expected_amount_kes, reported_amount_kes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, youth_id, dispute_date, module, issue_type, description,
                 expected_amount_kes, reported_amount_kes, status, created_at`,
      [
        token.userId,
        dispute_date,
        mod ?? null,
        issue_type,
        description ?? null,
        expected_amount_kes ?? null,
        reported_amount_kes ?? null,
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('POST /api/disputes error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create dispute' } }, { status: 500 });
  }
}

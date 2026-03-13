import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

// GET /api/admin/export?type=youth|disputes&settlement=...&module=...&status=...
// Returns a CSV file download. Admin-only.
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } },
      { status: 401 }
    );
  }

  if (!hasRole(token, 'admin')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    );
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') ?? 'youth';
  const settlement = searchParams.get('settlement') ?? '';
  const module = searchParams.get('module') ?? '';
  const status = searchParams.get('status') ?? '';

  try {
    if (type === 'youth') {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (settlement) {
        params.push(settlement);
        conditions.push(`settlement = $${params.length}`);
      }
      if (module) {
        params.push(module);
        conditions.push(`program_type = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const { rows } = await Database.query(
        `SELECT youth_id, full_name, settlement, program_type AS module, module_assignment,
                osm_username, is_active, created_at
         FROM youth_participants
         ${where}
         ORDER BY settlement, full_name`,
        params
      );

      const header = ['Youth ID', 'Full Name', 'Settlement', 'Module', 'Assignment', 'OSM Username', 'Active', 'Enrolled At'];
      const csvRows = rows.map((r) => [
        r.youth_id,
        csvEscape(r.full_name),
        csvEscape(r.settlement ?? ''),
        r.module ?? '',
        r.module_assignment ?? '',
        r.osm_username ?? '',
        r.is_active ? 'Yes' : 'No',
        r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
      ]);

      const csv = [header, ...csvRows].map((row) => row.join(',')).join('\r\n');
      const filename = `youth-export-${datestamp()}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (type === 'disputes') {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (settlement) {
        params.push(settlement);
        conditions.push(`yp.settlement = $${params.length}`);
      }
      if (status && ['open', 'resolved', 'rejected'].includes(status)) {
        params.push(status);
        conditions.push(`pd.status = $${params.length}`);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const { rows } = await Database.query(
        `SELECT pd.youth_id, yp.full_name AS youth_name, yp.settlement,
                pd.dispute_date, pd.module, pd.issue_type, pd.description,
                pd.expected_amount_kes, pd.reported_amount_kes,
                pd.status, pd.resolution_note, pd.created_at, pd.resolved_at
         FROM payment_disputes pd
         JOIN youth_participants yp ON yp.youth_id = pd.youth_id
         ${where}
         ORDER BY pd.created_at DESC`,
        params
      );

      const header = [
        'Youth ID', 'Full Name', 'Settlement', 'Dispute Date', 'Module',
        'Issue Type', 'Description', 'Expected (KES)', 'Recorded (KES)',
        'Status', 'Resolution Note', 'Filed At', 'Resolved At',
      ];
      const csvRows = rows.map((r) => [
        r.youth_id,
        csvEscape(r.youth_name),
        csvEscape(r.settlement ?? ''),
        r.dispute_date ? new Date(r.dispute_date).toISOString().split('T')[0] : '',
        r.module ?? '',
        r.issue_type,
        csvEscape(r.description ?? ''),
        r.expected_amount_kes ?? '',
        r.reported_amount_kes ?? '',
        r.status,
        csvEscape(r.resolution_note ?? ''),
        r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
        r.resolved_at ? new Date(r.resolved_at).toISOString().split('T')[0] : '',
      ]);

      const csv = [header, ...csvRows].map((row) => row.join(',')).join('\r\n');
      const filename = `disputes-export-${datestamp()}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'type must be "youth" or "disputes"' } },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/admin/export error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Export failed' } },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function datestamp(): string {
  return new Date().toISOString().split('T')[0];
}

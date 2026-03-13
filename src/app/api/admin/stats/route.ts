import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { listUsers } from '@/lib/dpw-client';

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

  try {
    // DPW caps per_page — paginate to collect all youth across all pages
    const firstPage = await listUsers({ role: 'youth', per_page: '200', page: '1' });
    const { total_pages } = firstPage.pagination;

    let users = firstPage.users;

    if (total_pages > 1) {
      const pageRequests = Array.from({ length: total_pages - 1 }, (_, i) =>
        listUsers({ role: 'youth', per_page: '200', page: String(i + 2) })
      );
      const remainingPages = await Promise.all(pageRequests);
      for (const page of remainingPages) {
        users = users.concat(page.users);
      }
    }

    const total = users.length;
    const active = users.filter((u) => u.is_active).length;

    const bySettlement: Record<string, number> = {};
    const byModule: Record<string, number> = {};

    for (const u of users) {
      const s = u.settlement || 'Unknown';
      bySettlement[s] = (bySettlement[s] || 0) + 1;
      const m = u.module || 'unassigned';
      byModule[m] = (byModule[m] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: { total, active, inactive: total - active, bySettlement, byModule },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats';
    return NextResponse.json(
      { success: false, error: { code: 'DPW_ERROR', message } },
      { status: 502 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader, hasRole } from '@/app/api/_lib/auth';
import { listUsers } from '@/lib/dpw-client';

export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  // Only trainers and admins can list users
  if (!hasRole(token, 'trainer', 'admin')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  try {
    const data = await listUsers(params);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users';
    const status = (error as { statusCode?: number }).statusCode || 502;
    return NextResponse.json({ success: false, error: { code: 'DPW_ERROR', message } }, { status });
  }
}

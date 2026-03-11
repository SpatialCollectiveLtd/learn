import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { getUserAttendance } from '@/lib/dpw-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  const { id } = await params;

  // Youth can only view their own attendance
  if (token.role === 'youth' && token.userId !== id) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot view other users\' attendance' } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  try {
    const data = await getUserAttendance(id, from, to);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch attendance';
    const status = (error as { statusCode?: number }).statusCode || 502;
    return NextResponse.json({ success: false, error: { code: 'DPW_ERROR', message } }, { status });
  }
}

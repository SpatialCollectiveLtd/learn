import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { getUserPerformance } from '@/lib/dpw-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  const { id } = await params;

  // Youth can only view their own performance
  if (token.role === 'youth' && token.userId !== id) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot view other users\' performance' } }, { status: 403 });
  }

  try {
    const data = await getUserPerformance(id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch performance';
    const status = (error as { statusCode?: number }).statusCode || 502;
    return NextResponse.json({ success: false, error: { code: 'DPW_ERROR', message } }, { status });
  }
}

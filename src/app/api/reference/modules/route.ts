import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { getModules } from '@/lib/dpw-client';

export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } }, { status: 401 });
  }

  try {
    const data = await getModules();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch modules';
    const status = (error as { statusCode?: number }).statusCode || 502;
    return NextResponse.json({ success: false, error: { code: 'DPW_ERROR', message } }, { status });
  }
}

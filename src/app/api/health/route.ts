import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Spatial Collective API is running',
    timestamp: new Date().toISOString(),
  });
}

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '2.0.0',
    description: 'Learn Platform v2 — DPW-integrated LMS + Comms + Dashboards',
    endpoints: [
      'GET  /api/health',
      'GET  /api/version',
      'POST /api/auth/youth',
      'POST /api/auth/launch',
      'GET  /api/users',
      'GET  /api/users/:id',
      'GET  /api/users/:id/attendance',
      'GET  /api/users/:id/performance',
      'GET  /api/users/:id/payments',
      'GET  /api/reference/settlements',
      'GET  /api/reference/modules',
      'GET  /api/training/progress',
      'POST /api/training/progress',
      'GET  /api/dpw/training-status/:userId',
    ],
  });
}

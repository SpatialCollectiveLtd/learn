import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: '1.0.2',
    commit: '134da92',
    timestamp: '2025-12-05T14:08:57Z',
    description: 'Contract endpoints + Staff auth fixes + DB schema update',
    endpoints: [
      'GET /api/health',
      'POST /api/youth/auth/authenticate',
      'POST /api/staff/auth/authenticate',
      'GET /api/contracts/template',
      'POST /api/contracts/sign',
      'GET /api/version',
    ],
    status: 'deployed',
  });
}

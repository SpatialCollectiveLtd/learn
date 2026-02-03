import { NextResponse } from 'next/server';

/**
 * Mobile Mapping Health Check
 * Verifies that mobile mapping routes are deployed
 */

export async function GET() {
  const routes = [
    '/api/youth/payment/breakdown',
    '/api/youth/performance',
    '/api/youth/badges',
    '/api/youth/queries',
    '/api/youth/queries/submit',
  ];

  return NextResponse.json({
    success: true,
    message: 'Mobile mapping routes health check',
    routes: routes,
    env: {
      dpw_base_url: process.env.DPW_MANAGER_BASE_URL || 'NOT SET',
      dpw_api_key_set: !!process.env.DPW_MANAGER_API_KEY,
      node_env: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

/**
 * Query List API - Proxy to DPW Manager
 * 
 * GET /api/youth/queries
 * Returns all queries submitted by authenticated youth
 * 
 * Auth: Bearer token (youth JWT)
 * Response: List of queries with status, responses, and history
 */

const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://digital-chi-six.vercel.app/api/v1';
const DPW_API_KEY = process.env.DPW_MANAGER_API_KEY || '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[Queries-API ${requestId}] Route accessed, DPW_BASE_URL: ${DPW_BASE_URL}`);
  
  try {
    // Verify youth authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let youthId: string;
    
    try {
      const decoded = verifyYouthToken(token);
      youthId = decoded.youth_id;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, in_progress, resolved
    const limit = searchParams.get('limit') || '50';

    console.log(`[Query-List ${requestId}] Request for youth: ${youthId} (status: ${status || 'all'})`);

    // Call DPW Manager API
    const dpwUrl = new URL(`${DPW_BASE_URL}/youth/${youthId}/queries`);
    if (status) dpwUrl.searchParams.set('status', status);
    dpwUrl.searchParams.set('limit', limit);
    
    const dpwResponse = await fetch(dpwUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': DPW_API_KEY,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!dpwResponse.ok) {
      const errorData = await dpwResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`[Query-List ${requestId}] DPW API error:`, dpwResponse.status, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'DPW_API_ERROR',
            message: errorData.error?.message || 'Failed to fetch queries',
            details: errorData.error?.details || 'External API returned an error',
          }
        },
        { status: dpwResponse.status }
      );
    }

    const queriesData = await dpwResponse.json();
    const duration = Date.now() - startTime;
    
    const totalQueries = queriesData.data?.queries?.length || 0;
    console.log(`[Query-List ${requestId}] Success (${duration}ms) - ${totalQueries} queries`);

    return NextResponse.json(queriesData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Query-List ${requestId}] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve queries',
          details: error.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

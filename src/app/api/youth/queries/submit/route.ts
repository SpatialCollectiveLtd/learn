import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

/**
 * Query Submission API - Proxy to DPW Manager
 * 
 * POST /api/youth/queries/submit
 * Submits a new query/dispute to DPW Manager
 * 
 * Auth: Bearer token (youth JWT)
 * Body: { category, subject, message, priority, attachments? }
 * Response: Query confirmation with query_id
 */

const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://digital-chi-six.vercel.app/api/v1';
const DPW_API_KEY = process.env.DPW_MANAGER_API_KEY || '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
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
    let settlement: string;
    
    try {
      const decoded = verifyYouthToken(token);
      youthId = decoded.youthId;
      settlement = decoded.settlement || 'Unknown';
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { category, subject, message, priority, attachments } = body;

    // Validation
    if (!category || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: category, subject, message' 
          } 
        },
        { status: 400 }
      );
    }

    console.log(`[Query-Submit ${requestId}] ${youthId} - ${category}: ${subject}`);

    // Call DPW Manager API
    const dpwUrl = `${DPW_BASE_URL}/youth/queries/submit`;
    
    const dpwResponse = await fetch(dpwUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': DPW_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        youth_id: youthId,
        settlement,
        category,
        subject,
        message,
        priority: priority || 'medium',
        attachments: attachments || [],
      }),
      signal: AbortSignal.timeout(15000), // 15s for file uploads
    });

    if (!dpwResponse.ok) {
      const errorData = await dpwResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`[Query-Submit ${requestId}] DPW API error:`, dpwResponse.status, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'DPW_API_ERROR',
            message: errorData.error?.message || 'Failed to submit query',
            details: errorData.error?.details || 'External API returned an error',
          }
        },
        { status: dpwResponse.status }
      );
    }

    const queryData = await dpwResponse.json();
    const duration = Date.now() - startTime;
    
    console.log(`[Query-Submit ${requestId}] Success (${duration}ms) - Query ID: ${queryData.data?.query_id}`);

    return NextResponse.json(queryData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Query-Submit ${requestId}] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit query',
          details: error.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

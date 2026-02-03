import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

/**
 * Payment Breakdown API - Proxy to DPW Manager
 * 
 * GET /api/youth/payment/breakdown
 * Returns detailed payment breakdown for authenticated mobile mapper
 * 
 * Auth: Bearer token (youth JWT)
 * Response: Payment data from DPW Work_Ledger
 */

const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://digital-chi-six.vercel.app/api/v1';
const DPW_API_KEY = process.env.DPW_MANAGER_API_KEY || '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[Payment-API ${requestId}] Route accessed, DPW_BASE_URL: ${DPW_BASE_URL}`);
  
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

    console.log(`[Payment-API ${requestId}] Request for youth: ${youthId}`);

    // Call DPW Manager API
    const dpwUrl = `${DPW_BASE_URL}/youth/${youthId}/payment/breakdown`;
    
    const dpwResponse = await fetch(dpwUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': DPW_API_KEY,
        'Content-Type': 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!dpwResponse.ok) {
      const errorData = await dpwResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`[Payment-API ${requestId}] DPW API error:`, dpwResponse.status, errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'DPW_API_ERROR',
            message: errorData.error?.message || 'Failed to fetch payment data',
            details: errorData.error?.details || 'External API returned an error',
          }
        },
        { status: dpwResponse.status }
      );
    }

    const paymentData = await dpwResponse.json();
    const duration = Date.now() - startTime;
    
    console.log(`[Payment-API ${requestId}] Success (${duration}ms) - Work days: ${paymentData.data?.work_days_completed || 0}`);

    return NextResponse.json(paymentData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Payment-API ${requestId}] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve payment breakdown',
          details: error.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

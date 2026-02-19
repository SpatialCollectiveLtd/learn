import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';


const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://app.spatialcollective.com';
const DPW_API_KEY = process.env.DPW_MANAGER_API_KEY || '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  
  try {
    
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
      youthId = decoded.youthId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); 
    const limit = searchParams.get('limit') || '50';

    

    
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
    

    return NextResponse.json(queriesData);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    
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

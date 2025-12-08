import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../_lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const result = await Database.query('SELECT NOW() as current_time, version() as pg_version');
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        timestamp: result.rows[0]?.current_time,
        version: result.rows[0]?.pg_version,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasLearnDbUrl: !!process.env.learn_DATABASE_URL,
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error?.message,
        code: error?.code,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasLearnDbUrl: !!process.env.learn_DATABASE_URL,
        }
      },
      { status: 500 }
    );
  }
}

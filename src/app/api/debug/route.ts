import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../_lib/database';

export async function GET(request: NextRequest) {
  try {
    
    const result = await Database.query('SELECT NOW() as current_time, version() as pg_version');
    
    const osmServerUrl = process.env.NEXT_PUBLIC_OSM_SERVER_URL || 'https://osm.spatialcollective.co.ke';
    
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
      },
      osm: {
        serverUrl: osmServerUrl,
        isPrivateServer: osmServerUrl.includes('spatialcollective'),
      }
    });

  } catch (error: any) {
    
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

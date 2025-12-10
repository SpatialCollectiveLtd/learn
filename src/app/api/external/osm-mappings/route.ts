import { NextRequest, NextResponse } from 'next/server';

// CORS configuration - Only allow app.spatialcollective.com
const ALLOWED_ORIGIN = 'https://app.spatialcollective.com';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin !== ALLOWED_ORIGIN) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized origin' },
      { status: 403 }
    );
  }

  try {
    // Import database after CORS check
    const { Database } = await import('../../_lib/database');

    // Fetch all youth with OSM usernames
    const result = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        osm_username,
        email,
        created_at,
        last_login
      FROM youth_participants
      WHERE osm_username IS NOT NULL
      ORDER BY created_at DESC
    `);

    const response = NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error: any) {
    console.error('Error fetching OSM data:', error);
    
    const response = NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch OSM username data',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );

    // Add CORS headers even for errors
    response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    
    return response;
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (origin !== ALLOWED_ORIGIN) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

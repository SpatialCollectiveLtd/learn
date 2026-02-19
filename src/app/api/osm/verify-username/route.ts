import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    
    
    const normalizedUsername = username.trim();

    
    
    
    
    try {
      const OSM_SERVER_BASE = process.env.NEXT_PUBLIC_OSM_SERVER_URL || 'https://osm.spatialcollective.co.ke';
      
      const response = await fetch(
        `${OSM_SERVER_BASE}/api/0.6/user/details.json`,
        {
          headers: {
            'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
          },
          
        }
      );

      
      
      const profileCheck = await fetch(
        `${OSM_SERVER_BASE}/user/${encodeURIComponent(normalizedUsername)}`,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
          },
        }
      );

      if (profileCheck.status === 200) {
        
        return NextResponse.json({
          success: true,
          exists: true,
          username: normalizedUsername,
          profileUrl: `${OSM_SERVER_BASE}/user/${encodeURIComponent(normalizedUsername)}`,
          message: 'OSM account verified successfully',
        });
      } else if (profileCheck.status === 404) {
        
        return NextResponse.json({
          success: true,
          exists: false,
          username: normalizedUsername,
          message: 'OSM username not found. Please check the spelling or create an account at openstreetmap.org',
        });
      } else {
        
        return NextResponse.json({
          success: true,
          exists: null,
          username: normalizedUsername,
          message: 'Unable to verify OSM account at this time. You can still save your username.',
        });
      }

    } catch (fetchError) {
      
      return NextResponse.json({
        success: true,
        exists: null,
        username: normalizedUsername,
        message: 'Unable to verify OSM account at this time. You can still save your username.',
      });
    }

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while verifying OSM username',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify if an OSM username exists and is active
 * Uses the OSM API v0.6 to check user details
 */
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

    // Call OSM API to verify user exists
    // OSM API endpoint: https://api.openstreetmap.org/api/0.6/user/{username}
    // Note: This requires the username to be the display name or ID
    
    try {
      // First, try to get user details by username
      // OSM API doesn't have a direct username lookup, so we use the user details endpoint
      // We need to search by display name which requires authentication OR
      // Use the public OSM website to verify
      
      const response = await fetch(
        `https://api.openstreetmap.org/api/0.6/user/details.json`,
        {
          headers: {
            'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
          },
          // This requires authentication, so let's use an alternative approach
        }
      );

      // Alternative: Check if user profile page exists
      const profileCheck = await fetch(
        `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
          },
        }
      );

      if (profileCheck.status === 200) {
        // User exists
        return NextResponse.json({
          success: true,
          exists: true,
          username: username,
          profileUrl: `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`,
          message: 'OSM account verified successfully',
        });
      } else if (profileCheck.status === 404) {
        // User not found
        return NextResponse.json({
          success: true,
          exists: false,
          username: username,
          message: 'OSM username not found. Please check the spelling or create an account at openstreetmap.org',
        });
      } else {
        // Other status codes
        return NextResponse.json({
          success: true,
          exists: null,
          username: username,
          message: 'Unable to verify OSM account at this time. You can still save your username.',
        });
      }

    } catch (fetchError) {
      console.error('OSM API fetch error:', fetchError);
      return NextResponse.json({
        success: true,
        exists: null,
        username: username,
        message: 'Unable to verify OSM account at this time. You can still save your username.',
      });
    }

  } catch (error) {
    console.error('Error verifying OSM username:', error);
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

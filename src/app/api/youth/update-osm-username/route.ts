import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '../../_lib/YouthModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get OSM username from request body
    const body = await request.json();
    const { osmUsername } = body;

    if (!osmUsername || !osmUsername.trim()) {
      return NextResponse.json(
        { success: false, message: 'OSM username is required' },
        { status: 400 }
      );
    }

    // Validate OSM username format (alphanumeric, underscores, hyphens)
    const osmUsernamePattern = /^[a-zA-Z0-9_-]+$/;
    if (!osmUsernamePattern.test(osmUsername.trim())) {
      return NextResponse.json(
        { success: false, message: 'Invalid OSM username format. Use only letters, numbers, underscores, and hyphens.' },
        { status: 400 }
      );
    }

    // Update youth participant's OSM username
    await YouthModel.updateOsmUsername(decoded.youthId, osmUsername.trim());

    return NextResponse.json({
      success: true,
      message: 'OSM username updated successfully',
      data: {
        youthId: decoded.youthId,
        osmUsername: osmUsername.trim(),
      },
    });

  } catch (error) {
    console.error('Error updating OSM username:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating OSM username' },
      { status: 500 }
    );
  }
}

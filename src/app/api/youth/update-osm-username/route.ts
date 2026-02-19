import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '../../_lib/YouthModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(request: NextRequest) {
  try {
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    
    const body = await request.json();
    const { osmUsername } = body;

    if (!osmUsername || !osmUsername.trim()) {
      return NextResponse.json(
        { success: false, message: 'OSM username is required' },
        { status: 400 }
      );
    }

    
    
    const osmUsernamePattern = /^[a-zA-Z0-9_\- ]+$/;
    if (!osmUsernamePattern.test(osmUsername.trim())) {
      return NextResponse.json(
        { success: false, message: 'Invalid OSM username format. Use only letters, numbers, underscores, hyphens, and spaces.' },
        { status: 400 }
      );
    }

    
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
    
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating OSM username' },
      { status: 500 }
    );
  }
}

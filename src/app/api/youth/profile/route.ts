import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '../../_lib/YouthModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
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

    // Fetch youth profile
    const youth = await YouthModel.findById(decoded.youthId);

    if (!youth) {
      return NextResponse.json(
        { success: false, message: 'Youth profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        youthId: youth.youth_id,
        fullName: youth.full_name,
        email: youth.email,
        phone: youth.phone_number,
        programType: youth.program_type,
        osmUsername: youth.osm_username || null,
        isActive: youth.is_active,
      },
    });

  } catch (error) {
    console.error('Error fetching youth profile:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching profile' },
      { status: 500 }
    );
  }
}

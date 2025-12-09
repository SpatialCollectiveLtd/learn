import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Database } from '../../_lib/database';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is trainer
    if (decoded.role !== 'trainer') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Trainer access required' },
        { status: 403 }
      );
    }

    // Fetch all active youth participants
    const youthResult = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.email,
        yp.phone_number,
        yp.is_active,
        yp.created_at,
        yp.last_login,
        yp.osm_username
      FROM youth_participants yp
      WHERE yp.is_active = TRUE
      ORDER BY yp.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        youth: youthResult.rows,
        totalCount: youthResult.rows.length,
        activeCount: youthResult.rows.filter((y: any) => y.is_active).length,
      }
    });

  } catch (error: any) {
    console.error('Error fetching youth data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch youth data', error: error.message },
      { status: 500 }
    );
  }
}

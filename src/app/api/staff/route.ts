import { NextRequest, NextResponse } from 'next/server';
import { StaffModel } from '../_lib/StaffModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

// Verify JWT token and check permissions
function verifyStaffToken(request: NextRequest): { staffId: string; role: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      staffId: decoded.staffId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// GET: List all staff members (admin/superadmin only)
export async function GET(request: NextRequest) {
  try {
    const auth = verifyStaffToken(request);
    
    if (!auth || (auth.role !== 'admin' && auth.role !== 'superadmin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all staff members
    const staff = await StaffModel.findAll();

    return NextResponse.json({
      success: true,
      data: staff,
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

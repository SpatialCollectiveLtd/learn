import { NextRequest, NextResponse } from 'next/server';
import { StaffModel } from '../../_lib/StaffModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

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


export async function POST(request: NextRequest) {
  try {
    const auth = verifyStaffToken(request);
    
    
    if (!auth || (auth.role !== 'admin' && auth.role !== 'superadmin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { staffId, fullName, email, role } = body;

    
    if (!staffId || !fullName || !email || !role) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    
    const staffIdPattern = /^S[TFM]EA\d{4}(SA|T|A)$/i;
    if (!staffIdPattern.test(staffId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Staff ID format' },
        { status: 400 }
      );
    }

    
    if (auth.role === 'admin' && role !== 'trainer') {
      return NextResponse.json(
        { success: false, message: 'Admins can only create trainer accounts' },
        { status: 403 }
      );
    }

    
    const existing = await StaffModel.findById(staffId);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Staff ID already exists' },
        { status: 400 }
      );
    }

    
    const newStaff = await StaffModel.create({
      staffId,
      fullName,
      email,
      phoneNumber: null,
      role,
      createdBy: auth.staffId,
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      data: newStaff,
    });

  } catch (error) {
    
    return NextResponse.json(
      { success: false, message: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { StaffModel } from '@/api/models/StaffModel';
import { AuthLogModel } from '@/api/models/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId } = body;

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Validate format (SC followed by 3+ digits)
    const staffIdPattern = /^SC\d{3,}$/i;
    if (!staffIdPattern.test(staffId.toUpperCase())) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: staffId,
        userType: 'staff',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Invalid Staff ID format',
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Staff ID format. Staff ID should be in format: SC### (e.g., SC001)' 
        },
        { status: 400 }
      );
    }

    // Find staff in database
    const staff = await StaffModel.findById(staffId.toUpperCase());

    if (!staff) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: staffId.toUpperCase(),
        userType: 'staff',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Staff ID not found',
      });

      return NextResponse.json(
        { success: false, message: 'Invalid Staff ID' },
        { status: 401 }
      );
    }

    if (!staff.is_active) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: staff.staff_id,
        userType: 'staff',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Account is inactive',
      });

      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Update last login
    await StaffModel.updateLastLogin(staff.staff_id);

    // Generate JWT token
    // @ts-ignore - JWT types are overly strict about expiresIn
    const token = jwt.sign(
      {
        staffId: staff.staff_id,
        fullName: staff.full_name,
        email: staff.email,
        role: staff.role,
        userType: 'staff',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log successful authentication
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await AuthLogModel.log({
      userId: staff.staff_id,
      userType: 'staff',
      action: 'login',
      success: true,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        staffId: staff.staff_id,
        fullName: staff.full_name,
        email: staff.email,
        role: staff.role,
      },
    });

  } catch (error) {
    console.error('Staff authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}

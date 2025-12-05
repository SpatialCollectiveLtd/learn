import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '@/api/models/YouthModel';
import { AuthLogModel } from '@/api/models/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youthId } = body;

    if (!youthId) {
      return NextResponse.json(
        { success: false, message: 'Youth ID is required' },
        { status: 400 }
      );
    }

    // Validate format (YT followed by 3+ digits)
    const youthIdPattern = /^YT\d{3,}$/i;
    if (!youthIdPattern.test(youthId.toUpperCase())) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: youthId,
        userType: 'youth',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Invalid Youth ID format',
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid Youth ID format. Youth ID should be in format: YT### (e.g., YT001)' 
        },
        { status: 400 }
      );
    }

    // Find youth in database
    const youth = await YouthModel.findById(youthId.toUpperCase());

    if (!youth) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: youthId.toUpperCase(),
        userType: 'youth',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Youth ID not found',
      });

      return NextResponse.json(
        { success: false, message: 'Invalid Youth ID' },
        { status: 401 }
      );
    }

    if (!youth.is_active) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: youth.youth_id,
        userType: 'youth',
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
    await YouthModel.updateLastLogin(youth.youth_id);

    // Check if contract is signed
    const hasSignedContract = await YouthModel.hasSignedContract(youth.youth_id);

    // Generate JWT token
    // @ts-ignore - JWT types are overly strict about expiresIn
    const token = jwt.sign(
      {
        youthId: youth.youth_id,
        fullName: youth.full_name,
        email: youth.email,
        programType: youth.program_type,
        userType: 'youth',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Log successful authentication
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await AuthLogModel.log({
      userId: youth.youth_id,
      userType: 'youth',
      action: 'login',
      success: true,
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        youth: {
          youthId: youth.youth_id,
          fullName: youth.full_name,
          email: youth.email,
          phone: youth.phone_number,
          programType: youth.program_type,
          hasSignedContract,
        },
      },
    });

  } catch (error) {
    console.error('Youth authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}

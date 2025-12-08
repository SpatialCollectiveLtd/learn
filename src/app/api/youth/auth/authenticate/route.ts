import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '../../../_lib/YouthModel';
import { AuthLogModel } from '../../../_lib/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';
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
  console.log('[AUTH] POST request received');
  try {
    const body = await request.json();
    console.log('[AUTH] Body parsed:', body);
    const { youthId } = body;

    if (!youthId) {
      console.log('[AUTH] No youthId provided');
      return NextResponse.json(
        { success: false, message: 'Youth ID is required' },
        { status: 400 }
      );
    }

    // Normalize youth ID to uppercase for case-insensitive matching
    const normalizedYouthId = youthId.toUpperCase().trim();

    // Validate format: KAY, KAR, or MJI followed by alphanumeric characters
    // Supports formats like: KAY1278MK, KAR001, MJI123
    const youthIdPattern = /^(KAY|KAR|MJI)[A-Z0-9]+$/i;
    if (!youthIdPattern.test(normalizedYouthId)) {
      console.log('[AUTH] Invalid format:', youthId);
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: normalizedYouthId,
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
          message: 'Invalid Youth ID. Please check your ID and try again.' 
        },
        { status: 400 }
      );
    }

    // Check for too many failed login attempts (max 5 in 15 minutes)
    const failedAttempts = await AuthLogModel.getFailedAttempts(normalizedYouthId, 15);
    if (failedAttempts >= 5) {
      console.log('[AUTH] Too many failed attempts:', normalizedYouthId);
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: normalizedYouthId,
        userType: 'youth',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Too many failed login attempts',
      });

      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many failed login attempts. Please try again in 15 minutes or contact support.' 
        },
        { status: 429 }
      );
    }

    // Find youth in database
    console.log('[AUTH] Looking up youth:', normalizedYouthId);
    const youth = await YouthModel.findById(normalizedYouthId);
    console.log('[AUTH] Youth found:', youth ? 'yes' : 'no');

    if (!youth) {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      await AuthLogModel.log({
        userId: normalizedYouthId,
        userType: 'youth',
        action: 'login',
        success: false,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        errorMessage: 'Youth ID not found',
      });

      return NextResponse.json(
        { success: false, message: 'Invalid Youth ID. Please check your ID and try again.' },
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
    console.error('[AUTH] Youth authentication error:', error);
    console.error('[AUTH] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication', error: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { YouthModel } from '../../../_lib/YouthModel';
import { AuthLogModel } from '../../../_lib/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';


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

    
    const normalizedYouthId = youthId.toUpperCase().trim();

    
    
    const youthIdPattern = /^(KAY|KAR|HUR)[A-Z0-9]+$/i;
    if (!youthIdPattern.test(normalizedYouthId)) {
      
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

    
    const failedAttempts = await AuthLogModel.getFailedAttempts(normalizedYouthId, 15);
    if (failedAttempts >= 5) {
      
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

    
    
    const youth = await YouthModel.findById(normalizedYouthId);
    
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

    
    await YouthModel.updateLastLogin(youth.youth_id);

    
    const hasSignedContract = await YouthModel.hasSignedContract(youth.youth_id);

    const token = jwt.sign(
      {
        youthId: youth.youth_id,
        fullName: youth.full_name,
        email: youth.email,
        programType: youth.program_type,
        moduleAssignment: youth.module_assignment,
        userType: 'youth',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    
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
          moduleAssignment: youth.module_assignment,
          settlement: youth.settlement,
          hasSignedContract,
        },
      },
    });

  } catch (error) {
    
    
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication', error: String(error) },
      { status: 500 }
    );
  }
}

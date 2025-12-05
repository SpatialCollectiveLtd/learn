import { NextRequest, NextResponse } from 'next/server';
import { ContractModel } from '../../_lib/ContractModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Get youth ID from token
    const youthId = decoded.youthId;
    if (!youthId) {
      return NextResponse.json(
        { success: false, message: 'Youth ID not found in token' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { templateId, signatureData } = body;

    if (!templateId || !signatureData) {
      return NextResponse.json(
        { success: false, message: 'Template ID and signature data are required' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create signed contract
    const signedContract = await ContractModel.createSignedContract({
      youthId,
      templateId,
      signatureData,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Contract signed successfully',
      data: {
        contractId: signedContract.contract_id,
        youthId: signedContract.youth_id,
        signedAt: signedContract.signed_at,
      },
    });

  } catch (error) {
    console.error('Sign contract error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while signing contract' },
      { status: 500 }
    );
  }
}

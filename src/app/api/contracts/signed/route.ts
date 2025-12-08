import { NextRequest, NextResponse } from 'next/server';
import { ContractModel } from '../../_lib/ContractModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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

    // Get youth ID from token
    const youthId = decoded.youthId;
    if (!youthId) {
      return NextResponse.json(
        { success: false, message: 'Youth ID not found in token' },
        { status: 400 }
      );
    }

    // Fetch signed contract
    const signedContract = await ContractModel.getSignedContractByYouthId(youthId);
    
    if (!signedContract) {
      return NextResponse.json(
        { success: false, message: 'No signed contract found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signedContract
    });

  } catch (error) {
    console.error('Error fetching signed contract:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while fetching your contract',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    // Extract program type from decoded token
    const programType = decoded.programType;
    if (!programType) {
      return NextResponse.json(
        { success: false, message: 'Program type not found in token' },
        { status: 400 }
      );
    }

    // Get contract template
    const template = await ContractModel.getTemplateByProgramType(programType);
    
    if (!template) {
      return NextResponse.json(
        { success: false, message: 'No contract template found for this program type' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contract template retrieved successfully',
      data: {
        templateId: template.template_id,
        programType: template.program_type,
        version: template.version,
        title: template.title,
        content: template.content,
        pdfUrl: template.pdf_url,
      },
    });

  } catch (error) {
    console.error('Get contract template error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching contract template' },
      { status: 500 }
    );
  }
}

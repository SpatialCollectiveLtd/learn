import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      receivedData: body,
    });
  } catch (error) {
    
    return NextResponse.json(
      { success: false, message: 'Test failed', error: String(error) },
      { status: 500 }
    );
  }
}

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

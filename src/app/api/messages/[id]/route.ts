import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

const EMAIL_API_URL = process.env.EMAIL_API_URL || 'https://email-api.spatialcollective.co.ke/api';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '06682c28d538516b9920423822798612';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyYouthToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    // Get youth's work email
    const result = await Database.query(
      'SELECT youth_id, work_email FROM youth_participants WHERE youth_id = $1',
      [youthId]
    );

    if (result.rows.length === 0 || !result.rows[0].work_email) {
      return NextResponse.json({
        success: false,
        message: 'No work email assigned to your account',
      }, { status: 404 });
    }

    const workEmail = result.rows[0].work_email;
    const emailPassword = youthId; // SSO approach

    // Get folder from query params
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';

    // Fetch single email from Email API
    const response = await fetch(`${EMAIL_API_URL}/email/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EMAIL_API_KEY,
      },
      body: JSON.stringify({
        email: workEmail,
        password: emailPassword,
        folder,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.error || 'Failed to fetch email',
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: data.email,
    });

  } catch (error: any) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

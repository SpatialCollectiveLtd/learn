import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

const EMAIL_API_URL = process.env.EMAIL_API_URL || 'https://email-api.spatialcollective.com';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '06682c28d538516b9920423822798612';

export async function GET(request: NextRequest) {
  try {
    
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

    
    const result = await Database.query(
      'SELECT youth_id, work_email FROM youth_participants WHERE youth_id = $1',
      [youthId]
    );

    if (result.rows.length === 0 || !result.rows[0].work_email) {
      return NextResponse.json({
        success: false,
        message: 'No work email assigned to your account yet',
        hasEmail: false,
      });
    }

    const workEmail = result.rows[0].work_email;
    
    
    const emailPassword = 'DPW2026Map!';

    
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    
    const response = await fetch(`${EMAIL_API_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': EMAIL_API_KEY,
      },
      body: JSON.stringify({
        email: workEmail,
        password: emailPassword,
        folder,
        limit,
        unread_only: unreadOnly,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.error || 'Failed to fetch emails',
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      data: {
        emails: data.emails || [],
        total: data.total || 0,
        folder: data.folder || folder,
        workEmail,
      },
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

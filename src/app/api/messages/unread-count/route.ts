import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

const EMAIL_API_URL = process.env.EMAIL_API_URL || 'https://tasks.spatialcollective.co.ke/email-api';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '06682c28d538516b9920423822798612';

export async function GET(request: NextRequest) {
  try {
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
        success: true,
        data: { unreadCount: 0, hasEmail: false },
      });
    }

    const workEmail = result.rows[0].work_email;
    // Default email password as per Email API specification
    const emailPassword = 'DPW2026Map!';

    // Get folder from query params
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'INBOX';

    // Fetch unread count from Email API
    const response = await fetch(`${EMAIL_API_URL}/unread-count`, {
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
      console.error('Error from Email API:', data);
      return NextResponse.json({
        success: true,
        data: { unreadCount: 0, hasEmail: true, error: data.error },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        unreadCount: data.unread_count || 0,
        hasEmail: true,
        folder: data.folder || folder,
      },
    });

  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    // Don't fail hard - just return 0
    return NextResponse.json({
      success: true,
      data: { unreadCount: 0, hasEmail: false },
    });
  }
}

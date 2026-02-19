import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters');
  }
  return secret;
}


const ODK_CONFIG = {
  baseUrl: process.env.ODK_CENTRAL_URL || 'https://collector.kesmis.go.ke',
  projectId: parseInt(process.env.ODK_PROJECT_ID || '41'),
};

export async function GET(request: NextRequest) {
  try {
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    
    const result = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        program_type,
        odk_token,
        odk_actor_id,
        odk_configured_at
      FROM youth_participants
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youthId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth profile not found' },
        { status: 404 }
      );
    }

    const youth = result.rows[0];
    
    
    const nameParts = youth.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    
    if (youth.program_type !== 'mobile_mapping') {
      return NextResponse.json({
        success: false,
        message: 'ODK configuration is only available for mobile mapping users',
      }, { status: 400 });
    }

    
    if (!youth.odk_token) {
      return NextResponse.json({
        success: true,
        data: {
          configured: false,
          message: 'ODK has not been configured for this account yet. Please contact your trainer.',
        },
      });
    }

    
    
    const configUrl = `${ODK_CONFIG.baseUrl}/v1/key/${youth.odk_token}/projects/${ODK_CONFIG.projectId}`;

    
    
    const qrData = {
      general: {
        server_url: configUrl,
      },
      admin: {},
    };

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        displayName: `${firstName} (${youth.youth_id}) ${lastName}`,
        configUrl: configUrl,
        qrData: qrData,
        configuredAt: youth.odk_configured_at,
        
        instructions: [
          'Open ODK Collect on your phone',
          'Tap the menu icon (three dots) in the top right',
          'Select "Add project"',
          'Scan this QR code',
          'The app will connect to the server automatically',
        ],
      },
    });

  } catch (error: any) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch ODK configuration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

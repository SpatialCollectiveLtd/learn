import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  try {
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyStaffToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { youth_id, action } = body;

    if (!youth_id || !action) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth ID and action are required' 
      }, { status: 400 });
    }

    if (!['register', 'authenticate'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action must be "register" or "authenticate"' 
      }, { status: 400 });
    }

    
    const youthCheck = await Database.query(`
      SELECT youth_id, full_name, program_type 
      FROM youth_participants 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (youthCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth not found or not active' 
      }, { status: 404 });
    }

    
    let allowedCredentials: any[] = [];
    if (action === 'authenticate') {
      const credentialsCheck = await Database.query(`
        SELECT credential_id, public_key 
        FROM biometric_credentials 
        WHERE youth_id = $1 AND is_active = TRUE
      `, [youth_id.toUpperCase()]);

      if (credentialsCheck.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'Youth has no registered biometric credentials' 
        }, { status: 400 });
      }

      
      allowedCredentials = credentialsCheck.rows.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key',
        transports: ['internal']
      }));
    }

    
    const challenge = crypto.randomBytes(32);
    const challengeId = crypto.randomUUID();

    
    await Database.query(`
      UPDATE biometric_challenges 
      SET used = TRUE, used_at = NOW(), used_by = $1
      WHERE youth_id = $2 AND created_at < NOW() - INTERVAL '5 minutes' AND used = FALSE
    `, [decoded.staffId, youth_id.toUpperCase()]);

    
    await Database.query(`
      INSERT INTO biometric_challenges (
        challenge_id,
        youth_id,
        challenge_data,
        action_type,
        staff_id,
        expires_at,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '2 minutes', NOW())
    `, [
      challengeId,
      youth_id.toUpperCase(),
      challenge.toString('base64'),
      action,
      decoded.staffId
    ]);

    const response: any = {
      success: true,
      challengeId,
      challenge: Array.from(challenge), 
      youth: youthCheck.rows[0]
    };

    
    if (action === 'authenticate') {
      response.allowedCredentials = allowedCredentials.map(cred => ({
        id: Array.from(cred.id),
        type: cred.type,
        transports: cred.transports  
      }));
    }

    return NextResponse.json(response);

  } catch (error: unknown) {
    
    return NextResponse.json(
      { success: false, message: 'Server error during challenge generation' },
      { status: 500 }
    );
  }
}

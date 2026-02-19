import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';


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
    const { youth_id, credential, challengeId } = body;

    if (!youth_id || !credential || !challengeId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth ID, credential, and challenge ID are required' 
      }, { status: 400 });
    }

    
    const youthCheck = await Database.query(`
      SELECT youth_id, full_name, program_type, settlement 
      FROM youth_participants 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (youthCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth not found or not active' 
      }, { status: 404 });
    }

    
    const challengeCheck = await Database.query(`
      SELECT challenge_id, youth_id, challenge_data, expires_at, action_type
      FROM biometric_challenges 
      WHERE challenge_id = $1 AND youth_id = $2 AND used = FALSE AND expires_at > NOW()
    `, [challengeId, youth_id.toUpperCase()]);

    if (challengeCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired challenge' 
      }, { status: 400 });
    }

    const challenge = challengeCheck.rows[0];
    if (challenge.action_type !== 'register') {
      return NextResponse.json({ 
        success: false, 
        message: 'Challenge not valid for registration' 
      }, { status: 400 });
    }

    
    const existingBiometric = await Database.query(`
      SELECT credential_id FROM biometric_credentials 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (existingBiometric.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth already has biometric registered' 
      }, { status: 409 });
    }

    
    
    
    
    const credentialResult = await Database.query(`
      INSERT INTO biometric_credentials (
        youth_id, 
        credential_id, 
        public_key, 
        counter, 
        registered_by,
        device_info,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING credential_id
    `, [
      youth_id.toUpperCase(),
      credential.id,
      JSON.stringify(credential),
      0, 
      decoded.staffId,
      JSON.stringify({
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
    ]);

    
    await Database.query(`
      UPDATE biometric_challenges 
      SET used = TRUE, used_at = NOW(), used_by = $1
      WHERE challenge_id = $2
    `, [decoded.staffId, challengeId]);

    
    await Database.query(`
      INSERT INTO biometric_audit_log (
        youth_id,
        action_type,
        staff_id,
        credential_id,
        success,
        ip_address,
        device_info,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      youth_id.toUpperCase(),
      'register',
      decoded.staffId,
      credential.id,
      true,
      request.headers.get('x-forwarded-for') || 'unknown',
      JSON.stringify({
        userAgent: request.headers.get('user-agent')
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Biometric registered successfully',
      data: {
        credential_id: credentialResult.rows[0].credential_id,
        youth: youthCheck.rows[0]
      }
    });

  } catch (error: unknown) {
    
    return NextResponse.json(
      { success: false, message: 'Server error during biometric registration' },
      { status: 500 }
    );
  }
}

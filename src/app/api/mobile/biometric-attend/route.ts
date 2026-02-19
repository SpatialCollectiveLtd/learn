import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
  const trx = await Database.getConnection();
  
  try {
    
    await trx.query('BEGIN');

    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);
    const decoded = verifyStaffToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const body = await request.json();
    const { 
      challengeId,
      youth_id,
      webAuthnResponse,
      session_id,
      date,
      note 
    } = body;

    
    if (!challengeId || !youth_id || !webAuthnResponse || !session_id || !date) {
      throw new Error('Missing required fields');
    }

    
    const challengeResult = await trx.query(`
      SELECT challenge_id, youth_id, challenge_data, action_type, expires_at, used
      FROM biometric_challenges 
      WHERE challenge_id = $1 AND youth_id = $2
    `, [challengeId, youth_id.toUpperCase()]);

    if (challengeResult.rows.length === 0) {
      throw new Error('Invalid challenge');
    }

    const challenge = challengeResult.rows[0];

    if (challenge.used) {
      throw new Error('Challenge already used');
    }

    if (new Date() > new Date(challenge.expires_at)) {
      throw new Error('Challenge expired');
    }

    if (challenge.action_type !== 'authenticate') {
      throw new Error('Challenge not for authentication');
    }

    
    const youthResult = await trx.query(`
      SELECT youth_id, full_name, program_type, settlement
      FROM youth_participants 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (youthResult.rows.length === 0) {
      throw new Error('Youth not found');
    }

    const youth = youthResult.rows[0];

    
    const credentialsResult = await trx.query(`
      SELECT credential_id, public_key, counter
      FROM biometric_credentials 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (credentialsResult.rows.length === 0) {
      throw new Error('No biometric credentials found');
    }

    
    const originalChallenge = Buffer.from(challenge.challenge_data, 'base64');
    let verificationSuccessful = false;
    let usedCredential = null;

    for (const credential of credentialsResult.rows) {
      try {
        
        
        
        const clientDataJSON = JSON.parse(
          Buffer.from(webAuthnResponse.response.clientDataJSON, 'base64').toString()
        );

        
        const responseChallenge = Buffer.from(clientDataJSON.challenge, 'base64url');
        if (!originalChallenge.equals(responseChallenge)) {
          continue;
        }

        
        if (clientDataJSON.type !== 'webauthn.get') {
          continue;
        }

        
        const credentialId = Buffer.from(webAuthnResponse.id, 'base64url');
        const storedCredentialId = Buffer.from(credential.credential_id, 'base64');
        if (!credentialId.equals(storedCredentialId)) {
          continue;
        }

        
        verificationSuccessful = true;
        usedCredential = credential;
        break;

      } catch (verifyError) {
        
        continue;
      }
    }

    if (!verificationSuccessful) {
      throw new Error('Biometric verification failed');
    }

    
    await trx.query(`
      UPDATE biometric_challenges 
      SET used = TRUE, used_at = NOW(), used_by = $1
      WHERE challenge_id = $2
    `, [decoded.staffId, challengeId]);

    
    const existingAttendance = await trx.query(`
      SELECT attendance_id
      FROM attendance_records
      WHERE youth_id = $1 AND attendance_date = $2
    `, [youth_id.toUpperCase(), date]);

    let attendanceId;

    if (existingAttendance.rows.length > 0) {
      
      attendanceId = existingAttendance.rows[0].attendance_id;
      await trx.query(`
        UPDATE attendance_records 
        SET 
          session_id = $1,
          marked_by = $2,
          marked_at = NOW(),
          program_type_at_attendance = $3,
          note = $4,
          verification_method = 'biometric',
          biometric_credential_id = $5
        WHERE attendance_id = $6
      `, [
        session_id,
        decoded.staffId,  
        youth.program_type,
        note || null,
        usedCredential.credential_id,
        attendanceId
      ]);
    } else {
      
      const attendanceResult = await trx.query(`
        INSERT INTO attendance_records (
          youth_id,
          attendance_date,
          session_id,
          marked_by,
          marked_at,
          program_type_at_attendance,
          note,
          verification_method,
          biometric_credential_id
        )
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, 'biometric', $7)
        RETURNING attendance_id
      `, [
        youth_id.toUpperCase(),
        date,
        session_id,
        decoded.staffId,
        youth.program_type,
        note || null,
        usedCredential.credential_id
      ]);

      attendanceId = attendanceResult.rows[0].attendance_id;
    }

    
    await trx.query(`
      INSERT INTO biometric_audit_log (
        youth_id,
        staff_id,
        action_type,
        credential_id,
        session_id,
        metadata,
        created_at
      )
      VALUES ($1, $2, 'attendance_verification', $3, $4, $5, NOW())
    `, [
      youth_id.toUpperCase(),
      decoded.staffId,
      usedCredential.credential_id,
      session_id,
      JSON.stringify({
        attendance_id: attendanceId,
        challenge_id: challengeId,
        verification_timestamp: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })
    ]);

    
    await trx.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: {
        attendance_id: attendanceId,
        youth: {
          youth_id: youth.youth_id,
          full_name: youth.full_name,
          program_type: youth.program_type,
          settlement: youth.settlement
        },
        attendance_date: date,
        session_id: session_id,
        marked_at: new Date().toISOString(),
        verification_method: 'biometric'
      }
    });

  } catch (error: unknown) {
    
    await trx.query('ROLLBACK');
    
    
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    const statusCode = errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token') ? 401 :
                      errorMessage.includes('not found') ? 404 :
                      errorMessage.includes('expired') || errorMessage.includes('used') || 
                      errorMessage.includes('verification failed') ? 400 : 500;

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  } finally {
    trx.release();
  }
}

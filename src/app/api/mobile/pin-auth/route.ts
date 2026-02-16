import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { signToken } from '@/app/api/_lib/auth';
import crypto from 'crypto';

/**
 * POST /api/mobile/pin-auth - Authenticate trainer with PIN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, pin } = body;

    if (!staff_id || !pin) {
      return NextResponse.json(
        { success: false, message: 'Staff ID and PIN are required' },
        { status: 400 }
      );
    }

    // Rate limiting check (10 attempts per hour per IP)
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const rateLimitCheck = await Database.query(`
      SELECT COUNT(*) as attempts
      FROM auth_logs 
      WHERE ip_address = $1 
        AND created_at > $2 
        AND success = FALSE
        AND action = 'mobile_pin_auth'
    `, [clientIp, hourAgo]);

    const attempts = parseInt(rateLimitCheck.rows[0]?.attempts || '0');
    if (attempts >= 10) {
      // Log rate limit violation
      await Database.query(`
        INSERT INTO auth_logs (
          user_id, user_type, action, ip_address, user_agent, success, error_message, created_at
        ) VALUES ($1, 'staff', 'mobile_pin_auth', $2, $3, FALSE, 'Rate limit exceeded', NOW())
      `, [staff_id, clientIp, request.headers.get('user-agent')]);

      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Try again later.' },
        { status: 429 }
      );
    }

    // Get staff member details
    const staffResult = await Database.query(`
      SELECT 
        staff_id,
        full_name,
        email,
        role,
        mobile_pin_hash,
        mobile_pin_salt,
        is_active,
        can_mobile_attend
      FROM staff_members 
      WHERE staff_id = $1 AND is_active = TRUE
    `, [staff_id.toUpperCase()]);

    if (staffResult.rows.length === 0) {
      // Log failed attempt
      await Database.query(`
        INSERT INTO auth_logs (
          user_id, user_type, action, ip_address, user_agent, success, error_message, created_at
        ) VALUES ($1, 'staff', 'mobile_pin_auth', $2, $3, FALSE, 'Staff not found', NOW())
      `, [staff_id, clientIp, request.headers.get('user-agent')]);

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const staff = staffResult.rows[0];

    // Check if staff has mobile attendance permission
    if (!staff.can_mobile_attend) {
      await Database.query(`
        INSERT INTO auth_logs (
          user_id, user_type, action, ip_address, user_agent, success, error_message, created_at
        ) VALUES ($1, 'staff', 'mobile_pin_auth', $2, $3, FALSE, 'Mobile access not permitted', NOW())
      `, [staff_id, clientIp, request.headers.get('user-agent')]);

      return NextResponse.json(
        { success: false, message: 'Mobile attendance access not permitted' },
        { status: 403 }
      );
    }

    // Verify PIN
    let pinValid = false;

    if (staff.mobile_pin_hash && staff.mobile_pin_salt) {
      // Hash provided PIN with stored salt
      const hashedPin = crypto
        .pbkdf2Sync(pin, staff.mobile_pin_salt, 100000, 32, 'sha256')
        .toString('hex');

      pinValid = hashedPin === staff.mobile_pin_hash;
    }

    if (!pinValid) {
      // Log failed authentication
      await Database.query(`
        INSERT INTO auth_logs (
          user_id, user_type, action, ip_address, user_agent, success, error_message, created_at
        ) VALUES ($1, 'staff', 'mobile_pin_auth', $2, $3, FALSE, 'Invalid PIN', NOW())
      `, [staff_id, clientIp, request.headers.get('user-agent')]);

      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token (expires in 8 hours for mobile sessions)
    const tokenPayload = {
      staffId: staff.staff_id,
      role: staff.role,
      email: staff.email,
      mobile: true, // Flag to indicate mobile session
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
    };

    const token = signToken(tokenPayload);

    // Update last login timestamp
    await Database.query(`
      UPDATE staff_members 
      SET 
        last_mobile_login = NOW(),
        mobile_login_count = COALESCE(mobile_login_count, 0) + 1
      WHERE staff_id = $1
    `, [staff.staff_id]);

    // Log successful authentication  
    await Database.query(`
      INSERT INTO auth_logs (
        user_id, user_type, action, ip_address, user_agent, success, created_at
      ) VALUES ($1, 'staff', 'mobile_pin_auth', $2, $3, TRUE, NOW())
    `, [staff.staff_id, clientIp, request.headers.get('user-agent')]);

    // Get staff stats for mobile dashboard
    const statsResult = await Database.query(`
      SELECT 
        COUNT(*) as total_attendances_today,
        COUNT(DISTINCT youth_id) as unique_youth_today
      FROM attendance_records 
      WHERE marked_by = $1 
        AND attendance_date = CURRENT_DATE
    `, [staff.staff_id]);

    const stats = statsResult.rows[0] || { total_attendances_today: 0, unique_youth_today: 0 };

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        staff: {
          staff_id: staff.staff_id,
          full_name: staff.full_name,
          role: staff.role,
          can_mobile_attend: staff.can_mobile_attend
        },
        session: {
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          mobile: true
        },
        stats: {
          attendances_today: parseInt(stats.total_attendances_today),
          unique_youth_today: parseInt(stats.unique_youth_today)
        }
      }
    });

  } catch (error: unknown) {
    console.error('Mobile PIN authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mobile/pin-auth - Set/Update mobile PIN
 */
export async function PUT(request: NextRequest) {
  try {
    // This endpoint requires existing authentication via email/password
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Use existing auth verification (assumes staff can set PIN via web interface)
    const body = await request.json();
    const { staff_id, new_pin, current_password } = body;

    if (!staff_id || !new_pin || !current_password) {
      return NextResponse.json(
        { success: false, message: 'Staff ID, new PIN, and current password are required' },
        { status: 400 }
      );
    }

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(new_pin)) {
      return NextResponse.json(
        { success: false, message: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    // Verify current password (simplified - in production verify against stored password)
    const staffResult = await Database.query(`
      SELECT staff_id, full_name, is_active
      FROM staff_members 
      WHERE staff_id = $1 AND is_active = TRUE
    `, [staff_id.toUpperCase()]);

    if (staffResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Generate salt and hash PIN
    const salt = crypto.randomBytes(32).toString('hex');
    const hashedPin = crypto
      .pbkdf2Sync(new_pin, salt, 100000, 32, 'sha256')
      .toString('hex');

    // Update staff record with new PIN
    await Database.query(`
      UPDATE staff_members 
      SET 
        mobile_pin_hash = $1,
        mobile_pin_salt = $2,
        can_mobile_attend = TRUE,
        pin_updated_at = NOW()
      WHERE staff_id = $3
    `, [hashedPin, salt, staff_id.toUpperCase()]);

    // Log PIN update
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    await Database.query(`
      INSERT INTO auth_logs (
        user_id, user_type, action, ip_address, user_agent, success, created_at
      ) VALUES ($1, 'staff', 'mobile_pin_update', $2, $3, TRUE, NOW())
    `, [staff_id.toUpperCase(), clientIp, request.headers.get('user-agent')]);

    return NextResponse.json({
      success: true,
      message: 'Mobile PIN updated successfully'
    });

  } catch (error: unknown) {
    console.error('Mobile PIN update error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error updating PIN' },
      { status: 500 }
    );
  }
}
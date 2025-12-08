import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '../../_lib/database';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

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

    // Check if user is admin or superadmin
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all youth participants with contract status
    if (!pool) {
      throw new Error('Database connection not available');
    }

    const result = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.email,
        yp.phone_number,
        yp.program_type,
        yp.is_active,
        yp.registered_at,
        sc.contract_id,
        sc.signed_at,
        CASE 
          WHEN sc.contract_id IS NOT NULL AND sc.is_valid = TRUE THEN true
          ELSE false
        END AS has_signed_contract
      FROM youth_participants yp
      LEFT JOIN signed_contracts sc ON yp.youth_id = sc.youth_id AND sc.is_valid = TRUE
      ORDER BY yp.registered_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error('Fetch youth error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while fetching participants' },
      { status: 500 }
    );
  }
}

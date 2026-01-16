import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

/**
 * POST /api/staff/attendance - Record attendance
 * GET /api/staff/attendance?date=2026-01-16 - Get attendance for date
 */

export async function POST(request: NextRequest) {
  try {
    // Verify staff authentication
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
    const { youth_id, attendance_date, notes } = body;

    if (!youth_id || !attendance_date) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth ID and attendance date are required' 
      }, { status: 400 });
    }

    // Verify youth exists and is active mobile mapper
    const youthCheck = await Database.query(`
      SELECT youth_id, full_name FROM youth_participants 
      WHERE youth_id = $1 AND program_type = 'mobile_mapping' AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (youthCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth not found or not an active mobile mapper' 
      }, { status: 404 });
    }

    // Insert attendance record
    try {
      const result = await Database.query(`
        INSERT INTO attendance_records (youth_id, attendance_date, submitted_by, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, youth_id, attendance_date, submitted_at
      `, [youth_id.toUpperCase(), attendance_date, decoded.staffId, notes || null]);

      return NextResponse.json({
        success: true,
        message: 'Attendance recorded successfully',
        data: {
          record: result.rows[0],
          youth: youthCheck.rows[0]
        }
      });

    } catch (err: unknown) {
      // Check for duplicate entry
      if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          message: 'Attendance already recorded for this date' 
        }, { status: 409 });
      }
      throw err;
    }

  } catch (error: unknown) {
    console.error('Attendance POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyStaffToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Get attendance records
    let query: string;
    let params: string[];

    if (date) {
      // Get attendance for specific date
      query = `
        SELECT 
          ar.id,
          ar.youth_id,
          yp.full_name,
          ar.attendance_date,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = $1
        ORDER BY ar.submitted_at DESC
      `;
      params = [date];
    } else {
      // Get today's attendance
      query = `
        SELECT 
          ar.id,
          ar.youth_id,
          yp.full_name,
          ar.attendance_date,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = CURRENT_DATE
        ORDER BY ar.submitted_at DESC
      `;
      params = [];
    }

    const result = await Database.query(query, params);

    // Get total count for the date
    const countQuery = date 
      ? `SELECT COUNT(*) as total FROM attendance_records WHERE attendance_date = $1`
      : `SELECT COUNT(*) as total FROM attendance_records WHERE attendance_date = CURRENT_DATE`;
    const countResult = await Database.query(countQuery, date ? [date] : []);

    // Get total active mobile mappers
    const totalMappers = await Database.query(`
      SELECT COUNT(*) as total FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);

    return NextResponse.json({
      success: true,
      data: {
        records: result.rows,
        attendance_count: parseInt(countResult.rows[0].total),
        total_mappers: parseInt(totalMappers.rows[0].total),
        date: date || new Date().toISOString().split('T')[0]
      }
    });

  } catch (error: unknown) {
    console.error('Attendance GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

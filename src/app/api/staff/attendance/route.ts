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

    // Verify youth exists and is active participant
    const youthCheck = await Database.query(`
      SELECT youth_id, full_name, program_type FROM youth_participants 
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youth_id.toUpperCase()]);

    if (youthCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Youth not found or not an active participant' 
      }, { status: 404 });
    }

    // Insert attendance record with current program type
    try {
      const result = await Database.query(`
        INSERT INTO attendance_records (youth_id, attendance_date, submitted_by, notes, program_type_at_attendance)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, youth_id, attendance_date, submitted_at
      `, [youth_id.toUpperCase(), attendance_date, decoded.staffId, notes || null, youthCheck.rows[0].program_type]);

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
    let decoded;
    try {
      decoded = verifyStaffToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token. Please log in again.' 
      }, { status: 401 });
    }

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const module = searchParams.get('module') || 'mobile_mapping';

    // Get attendance records
    let query: string;
    let params: (string | undefined)[];

    if (date) {
      // Get attendance for specific date and module - USE HISTORICAL PROGRAM TYPE
      query = `
        SELECT 
          ar.id,
          ar.youth_id,
          yp.full_name,
          ar.program_type_at_attendance as program_type,
          ar.attendance_date,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = $1 AND ar.program_type_at_attendance = $2
        ORDER BY ar.submitted_at DESC
      `;
      params = [date, module];
    } else {
      // Get today's attendance for module - USE HISTORICAL PROGRAM TYPE  
      query = `
        SELECT 
          ar.id,
          ar.youth_id,
          yp.full_name,
          ar.program_type_at_attendance as program_type,
          ar.attendance_date,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = CURRENT_DATE AND ar.program_type_at_attendance = $1
        ORDER BY ar.submitted_at DESC
      `;
      params = [module];
    }

    const result = await Database.query(query, params);

    // Get total count for the date and module
    const countQuery = date 
      ? `SELECT COUNT(*) as total FROM attendance_records ar JOIN youth_participants yp ON ar.youth_id = yp.youth_id WHERE ar.attendance_date = $1 AND yp.program_type = $2`
      : `SELECT COUNT(*) as total FROM attendance_records ar JOIN youth_participants yp ON ar.youth_id = yp.youth_id WHERE ar.attendance_date = CURRENT_DATE AND yp.program_type = $1`;
    const countParams = date ? [date, module] : [module];
    const countResult = await Database.query(countQuery, countParams);

    // Get total active participants for the module
    const totalMappers = await Database.query(`
      SELECT COUNT(*) as total FROM youth_participants 
      WHERE program_type = $1 AND is_active = TRUE
    `, [module]);

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

export async function DELETE(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = verifyStaffToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token. Please log in again.' 
      }, { status: 401 });
    }

    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');

    if (!recordId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Attendance record ID is required' 
      }, { status: 400 });
    }

    // Get the record details before deleting (for logging and response)
    const recordCheck = await Database.query(`
      SELECT ar.id, ar.youth_id, yp.full_name, ar.attendance_date, ar.submitted_by
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.id = $1
    `, [parseInt(recordId)]);

    if (recordCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Attendance record not found' 
      }, { status: 404 });
    }

    const record = recordCheck.rows[0];

    // Delete the attendance record
    const result = await Database.query(`
      DELETE FROM attendance_records
      WHERE id = $1
      RETURNING id
    `, [parseInt(recordId)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to delete attendance record' 
      }, { status: 500 });
    }

    // Log the deletion
    console.log(`[ATTENDANCE DELETE] Record #${recordId} deleted by ${decoded.staffId}:`, {
      youth_id: record.youth_id,
      full_name: record.full_name,
      attendance_date: record.attendance_date,
      originally_submitted_by: record.submitted_by,
      deleted_by: decoded.staffId,
      deleted_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Attendance record for ${record.full_name} on ${record.attendance_date} has been deleted`,
      data: {
        deleted_record: {
          id: record.id,
          youth_id: record.youth_id,
          full_name: record.full_name,
          attendance_date: record.attendance_date
        }
      }
    });

  } catch (error: unknown) {
    console.error('Attendance DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while deleting attendance record' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

/**
 * Search for youth by ID - returns name, ID number, phone
 * GET /api/staff/attendance/search?q=KAY123
 */
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
    const query = searchParams.get('q')?.trim().toUpperCase();

    if (!query || query.length < 3) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please enter at least 3 characters' 
      }, { status: 400 });
    }

    // Search for youth - mobile mapping only for now
    console.log('Searching for youth with query:', query);
    const result = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        phone_number,
        program_type
      FROM youth_participants
      WHERE youth_id ILIKE $1
        AND program_type = 'mobile_mapping'
        AND is_active = TRUE
      LIMIT 10
    `, [`%${query}%`]);
    
    console.log('Search results:', result.rows.length, 'records found');

    return NextResponse.json({
      success: true,
      data: {
        results: result.rows,
        count: result.rows.length
      }
    });

  } catch (error: unknown) {
    console.error('Attendance search error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

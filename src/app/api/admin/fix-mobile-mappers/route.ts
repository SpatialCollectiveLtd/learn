import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';

/**
 * ONE-TIME FIX: Ensure all mobile mappers are active and properly assigned
 * GET /api/admin/fix-mobile-mappers?secret=YOUR_SECRET_KEY
 */

const MOBILE_MAPPER_IDS = [
  'KAY348RN', 'KAY1278MK', 'KAY2015NM', 'KAY2615VO', 'KAY1383EN',
  'KAY269JW', 'KAY1255GO', 'KAY2326TO', 'KAY2239NW', 'KAY1771NN',
  'KAY614FO', 'KAY621AM', 'KAY620JH', 'KAY1840TM', 'KAY1353CW',
  'KAY2762ZA', 'KAY2070EM', 'KAY498AW', 'KAY2065BW', 'KAY2675PM',
  'KAY413GG', 'KAY1042KM', 'KAY1008BO', 'KAY264EM', 'KAY1007FO',
  'KAY465DO', 'KAY744IA', 'KAY1604FA', 'KAY2802NM', 'KAY237FM',
  'KAY1000GN', 'KAY1619JG', 'KAY2412FO', 'KAY1990MM', 'KAY2188EG',
  'KAY2501CM', 'KAY2423BO', 'KAY2647MN', 'KAY760SK', 'KAY1230CA',
  'KAY2251TK', 'KAY2531JO', 'KAY2093GN', 'KAY1528CM', 'KAY1537MW',
  'KAY955HO', 'KAY2549EG', 'KAY2529RW', 'KAY2301SA', 'KAY974VE',
  'KAY2071PG', 'KAY2279JN', 'KAY1177MS', 'KAY1223AK', 'KAY1731EM',
  'KAY2642PO', 'KAY880LK', 'KAY098JO', 'KAY2031KM', 'KAY132DN',
  'KAY2587RM', 'KAY1143IM', 'KAY1973FM', 'KAY2465DN', 'KAY1506DM',
  'KAY2687MN', 'KAY1504BA', 'KAY2190FM', 'KAY1640JM', 'KAY2468HO',
  'KAY1799DM', 'KAY2570SM', 'KAY1681JM', 'KAY461VO', 'KAY1975NM',
  'KAY1726RN', 'KAY2134VW', 'KAY778DT', 'KAY2544DG', 'KAY1166AM',
  'KAY2248LK', 'KAY574GK', 'KAY2085SB', 'KAY346CC', 'KAY1398PO',
  'KAY291SM', 'KAY1092LJ', 'KAY1138SM', 'KAY1380MM', 'KAY2754JD',
  'KAY1614VA', 'KAY2491PL', 'KAY924LO', 'KAY1994KK', 'KAY2546PW',
  'KAY868JN', 'KAY1448PO', 'KAY2490AM', 'KAY288SM', 'KAY467DN'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple security check
    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔧 Starting mobile mapper fix...');

    // Check current state
    const checkQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE youth_id = ANY($1)) as found_count,
        COUNT(*) FILTER (WHERE youth_id = ANY($1) AND is_active = TRUE AND program_type = 'mobile_mapping') as ready_count
      FROM youth_participants
    `;
    
    const beforeState = await Database.query(checkQuery, [MOBILE_MAPPER_IDS]);
    
    // Update all mobile mappers
    const updateResult = await Database.query(`
      UPDATE youth_participants
      SET 
        program_type = 'mobile_mapping',
        is_active = TRUE,
        settlement = 'Kayole Soweto',
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = ANY($1)
      RETURNING youth_id
    `, [MOBILE_MAPPER_IDS]);

    const afterState = await Database.query(checkQuery, [MOBILE_MAPPER_IDS]);

    // Get attendance record counts
    const attendanceCheck = await Database.query(`
      SELECT 
        attendance_date,
        COUNT(*) as count
      FROM attendance_records
      WHERE youth_id = ANY($1)
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT 10
    `, [MOBILE_MAPPER_IDS]);

    return NextResponse.json({
      success: true,
      message: 'Mobile mappers fixed successfully',
      data: {
        before: {
          found: parseInt(beforeState.rows[0].found_count),
          ready: parseInt(beforeState.rows[0].ready_count)
        },
        after: {
          found: parseInt(afterState.rows[0].found_count),
          ready: parseInt(afterState.rows[0].ready_count)
        },
        updated: updateResult.rows.length,
        recent_attendance: attendanceCheck.rows
      }
    });

  } catch (error: unknown) {
    console.error('Fix mobile mappers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

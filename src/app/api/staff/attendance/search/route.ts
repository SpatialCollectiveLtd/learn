import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffToken } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';


export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const module = searchParams.get('module') || 'mobile_mapping';

    if (!query || query.length < 3) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please enter at least 3 characters' 
      }, { status: 400 });
    }

    
    
    const result = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        phone_number,
        program_type,
        settlement
      FROM youth_participants
      WHERE (
        youth_id ILIKE $1
        OR full_name ILIKE $1
        OR phone_number ILIKE $1
      )
        AND program_type = $2
        AND is_active = TRUE
      ORDER BY 
        CASE 
          WHEN youth_id ILIKE $1 THEN 1
          WHEN full_name ILIKE $3 THEN 2
          ELSE 3
        END,
        full_name
      LIMIT 20
    `, [`%${query}%`, module, `${query}%`]);
    
    
    return NextResponse.json({
      success: true,
      data: {
        results: result.rows,
        count: result.rows.length
      }
    });

  } catch (error: unknown) {
    
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

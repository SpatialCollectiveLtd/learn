import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';

export async function POST(request: NextRequest) {
  try {
    
    const approveResult = await Database.query(`
      UPDATE youth_work_days
      SET status = 'approved'
      WHERE work_date >= '2025-12-09'
        AND work_date <= '2025-12-19'
        AND status = 'pending'
      RETURNING *
    `);

    
    const summaryResult = await Database.query(`
      SELECT 
        yp.settlement,
        COUNT(*) as total_days,
        SUM(CASE WHEN ywd.status = 'approved' THEN 1 ELSE 0 END) as approved_days,
        SUM(CASE WHEN ywd.status = 'pending' THEN 1 ELSE 0 END) as pending_days
      FROM youth_work_days ywd
      JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
      WHERE yp.program_type = 'digitization'
      GROUP BY yp.settlement
      ORDER BY yp.settlement
    `);

    return NextResponse.json({
      success: true,
      message: `Approved ${approveResult.rows.length} work days`,
      data: {
        approvedCount: approveResult.rows.length,
        summary: summaryResult.rows
      }
    });

  } catch (error: any) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to approve work days',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

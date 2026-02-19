import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import jwt from 'jsonwebtoken';


function getJwtSecret(): string {
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters');
  }
  return secret;
}

export async function GET(request: NextRequest) {
  try {
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;

    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    
    const configResult = await Database.query(`
      SELECT swc.total_work_days, swc.start_date
      FROM youth_participants yp
      JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND yp.program_type = swc.program_type
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1
    `, [youthId]);

    const totalDays = configResult.rows[0]?.total_work_days || 20;
    const startDate = configResult.rows[0]?.start_date;

    
    const approvedResult = await Database.query(`
      SELECT 
        COUNT(*)::INTEGER as days_worked,
        COUNT(*) FILTER (WHERE work_date < '2026-01-01')::INTEGER as days_worked_2025,
        COUNT(*) FILTER (WHERE work_date >= '2026-01-01')::INTEGER as days_worked_2026,
        SUM(buildings_count)::INTEGER as total_buildings,
        COUNT(*) FILTER (WHERE target_met = TRUE)::INTEGER as days_target_met
      FROM youth_work_days
      WHERE youth_id = $1 
      AND status = 'approved'
    `, [youthId]);

    
    const pendingResult = await Database.query(`
      SELECT COUNT(*)::INTEGER as pending_days
      FROM youth_work_days
      WHERE youth_id = $1 
      AND status = 'pending'
    `, [youthId]);

    const daysWorked = approvedResult.rows[0]?.days_worked || 0;
    const daysWorked2025 = approvedResult.rows[0]?.days_worked_2025 || 0;
    const daysWorked2026 = approvedResult.rows[0]?.days_worked_2026 || 0;
    const totalBuildings = approvedResult.rows[0]?.total_buildings || 0;
    const daysTargetMet = approvedResult.rows[0]?.days_target_met || 0;
    const pendingDays = pendingResult.rows[0]?.pending_days || 0;

    const remaining = Math.max(0, totalDays - daysWorked);
    const percentage = Math.round((daysWorked / totalDays) * 100);

    return NextResponse.json({
      success: true,
      data: {
        daysWorked,
        daysWorked2025,
        daysWorked2026,
        totalDays,
        remaining,
        percentage,
        pendingDays,
        totalBuildings,
        daysTargetMet,
        avgBuildingsPerDay: daysWorked > 0 ? Math.round(totalBuildings / daysWorked) : 0,
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
      },
    });

  } catch (error: any) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch work days count',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

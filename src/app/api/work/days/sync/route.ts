// POST /api/work/days/sync
// Auto-syncs work days from youth_osm_stats table
// Creates/updates youth_work_days records for any date where youth mapped buildings
// Auto-approves days to make them count immediately

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured and at least 32 characters');
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT authentication
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
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    // Get youth's settlement config for daily target
    const configResult = await Database.query(`
      SELECT swc.daily_target
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND yp.program_type = swc.program_type
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1
    `, [youthId]);

    const dailyTarget = configResult.rows[0]?.daily_target || 200;

    // Get all dates where youth has OSM stats (days they actually worked)
    const statsResult = await Database.query(`
      SELECT 
        date,
        buildings_mapped,
        last_upload_time
      FROM youth_osm_stats
      WHERE youth_id = $1
      AND buildings_mapped > 0
      ORDER BY date ASC
    `, [youthId]);

    console.log(`[Sync] Found ${statsResult.rows.length} work days for youth ${youthId}`);

    let syncedDays = 0;
    let updatedDays = 0;

    // Sync each work day
    for (const stat of statsResult.rows) {
      const targetMet = stat.buildings_mapped >= dailyTarget;

      // Insert or update work day record - auto-approve it
      const result = await Database.query(`
        INSERT INTO youth_work_days (
          youth_id, 
          work_date, 
          buildings_count, 
          daily_target,
          target_met, 
          status,
          notes
        ) VALUES ($1, $2, $3, $4, $5, 'approved', 'Auto-synced from OSM stats')
        ON CONFLICT (youth_id, work_date) 
        DO UPDATE SET
          buildings_count = EXCLUDED.buildings_count,
          daily_target = EXCLUDED.daily_target,
          target_met = EXCLUDED.target_met,
          status = CASE 
            WHEN youth_work_days.status = 'pending' THEN 'approved'
            ELSE youth_work_days.status
          END,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `, [
        youthId,
        stat.date,
        stat.buildings_mapped,
        dailyTarget,
        targetMet
      ]);

      if (result.rows[0].inserted) {
        syncedDays++;
      } else {
        updatedDays++;
      }
    }

    console.log(`[Sync] Created ${syncedDays} new work days, updated ${updatedDays} existing`);

    return NextResponse.json({
      success: true,
      message: `Synced ${statsResult.rows.length} work days`,
      data: {
        totalWorkDays: statsResult.rows.length,
        newDays: syncedDays,
        updatedDays: updatedDays,
      },
    });

  } catch (error: any) {
    console.error('[API] Error syncing work days:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync work days',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

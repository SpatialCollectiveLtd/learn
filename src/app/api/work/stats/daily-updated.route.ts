import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { getTodayBuildingCount } from '@/lib/osm-service';
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

    
    const timezone = 'Africa/Nairobi'; 
    const offset = 3; 
    const now = new Date();
    const localDate = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    
    const youthResult = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.osm_username,
        yp.program_type as current_program_type,
        yp.settlement,
        yp.exception_hashtags,
        
        -- Get active module assignment for today
        (SELECT program_type FROM get_active_module_assignment(yp.youth_id, $2::date)) as active_program_type,
        (SELECT assignment_id FROM get_active_module_assignment(yp.youth_id, $2::date)) as active_assignment_id,
        
        -- Get settlement config for active assignment
        swc.daily_target,
        swc.project_hashtag,
        swc.timezone,
        swc.start_date,
        swc.total_work_days,
        
        -- Work statistics (across all modules)
        (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved') as total_work_days,
        (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'pending') as pending_work_days
        
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND COALESCE((SELECT program_type FROM get_active_module_assignment(yp.youth_id, $2::date)), yp.program_type) = swc.program_type
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1 AND yp.is_active = TRUE
    `, [youthId, today]);

    if (youthResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth profile not found' },
        { status: 404 }
      );
    }

    const youth = youthResult.rows[0];
    const activeProgram = youth.active_program_type || youth.current_program_type;

    
    
    const osmRequiredPrograms = ['digitization', 'mobile_mapping'];
    if (osmRequiredPrograms.includes(activeProgram) && !youth.osm_username) {
      return NextResponse.json({
        success: false,
        message: 'OSM username required. Please complete training and add your OSM username.',
        requiresOsmUsername: true,
        redirectTo: `/${activeProgram}/${activeProgram === 'digitization' ? 'mapper' : 'training'}`,
      }, { status: 400 });
    }

    
    if (!osmRequiredPrograms.includes(activeProgram)) {
      return NextResponse.json({
        success: false,
        message: `OSM tracking is only available for digitization and mobile mapping modules. Your current module (${activeProgram}) uses different tracking methods.`,
        moduleType: activeProgram,
        currentAssignment: {
          program_type: activeProgram,
          assignment_id: youth.active_assignment_id
        }
      }, { status: 400 });
    }

    
    const maxWorkDays = youth.total_work_days || 20;
    const remainingDays = maxWorkDays - (youth.total_work_days || 0);
    
    if (remainingDays <= 0) {
      return NextResponse.json({
        success: false,
        message: `You have completed your ${maxWorkDays}-day work period across all modules. Contact your supervisor for next steps.`,
        workPeriodComplete: true,
        totalDaysWorked: youth.total_work_days,
        maxDays: maxWorkDays
      }, { status: 400 });
    }

    
    const cachedStatsResult = await Database.query(`
      SELECT buildings_mapped, changesets_analyzed, last_changeset_id, last_upload_time, updated_at
      FROM youth_osm_stats
      WHERE youth_id = $1 
      AND date::date = $2::date
      AND updated_at > NOW() - INTERVAL '5 minutes'
    `, [youthId, today]);

    let stats;
    if (cachedStatsResult.rows.length > 0) {
      
      const cached = cachedStatsResult.rows[0];
      
      stats = {
        totalBuildings: cached.buildings_mapped || 0,
        changesetsAnalyzed: cached.changesets_analyzed || 0,
        lastChangesetId: cached.last_changeset_id,
        lastUploadTime: cached.last_upload_time,
        cacheHit: true,
        processingTime: 0,
      };
    } else {
      
      
      const startTime = Date.now();
      
      stats = await getTodayBuildingCount(
        youth.osm_username,
        youth.project_hashtag || '#DPW2025',
        youth.exception_hashtags,
        youthId
      );
      
      stats.processingTime = Date.now() - startTime;
      stats.cacheHit = false;
    }

    const dailyTarget = youth.daily_target || 200;
    const percentage = Math.round((stats.totalBuildings / dailyTarget) * 100);

    
    if (stats.totalBuildings > 0) {
      const targetMet = stats.totalBuildings >= dailyTarget;
      
      try {
        
        await Database.query(`
          INSERT INTO youth_work_days (
            youth_id, work_date, buildings_count, daily_target,
            target_met, status, notes
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
        `, [youthId, today, stats.totalBuildings, dailyTarget, targetMet]);
      } catch (syncError) {
        
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        today: stats.totalBuildings,
        target: dailyTarget,
        percentage,
        changesetsAnalyzed: stats.changesetsAnalyzed,
        lastChangesetId: stats.lastChangesetId,
        lastUploadTime: stats.lastUploadTime,
        
        
        moduleInfo: {
          currentProgram: activeProgram,
          assignmentId: youth.active_assignment_id,
          isTransitioned: activeProgram !== youth.current_program_type
        },
        
        
        workPeriod: {
          totalDaysWorked: youth.total_work_days || 0,
          pendingDays: youth.pending_work_days || 0,
          remainingDays: remainingDays,
          maxDays: maxWorkDays,
          startDate: youth.start_date
        }
      },
      cache: {
        hit: stats.cacheHit,
        processingTime: stats.processingTime
      }
    });

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to fetch work statistics. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

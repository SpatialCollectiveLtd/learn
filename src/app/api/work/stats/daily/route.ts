// GET /api/work/stats/daily
// Fetches today's building count for authenticated youth mapper
// Uses caching to prevent OSM API rate limiting

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { getTodayBuildingCount } from '@/lib/osm-service';
import jwt from 'jsonwebtoken';

// Get JWT secret at runtime, not module load time (for Vercel compatibility)
function getJwtSecret(): string {
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters');
  }
  return secret;
}

export async function GET(request: NextRequest) {
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
      decoded = jwt.verify(token, getJwtSecret());
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    // Get youth data with settlement config
    const youthResult = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.osm_username,
        yp.program_type,
        yp.settlement,
        yp.exception_hashtags,
        swc.daily_target,
        swc.project_hashtag,
        swc.timezone
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND yp.program_type = swc.program_type
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1 AND yp.is_active = TRUE
    `, [youthId]);

    if (youthResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth profile not found' },
        { status: 404 }
      );
    }

    const youth = youthResult.rows[0];

    // Check if OSM username exists (required for digitization)
    if (youth.program_type === 'digitization' && !youth.osm_username) {
      return NextResponse.json({
        success: false,
        message: 'OSM username required. Please complete training and add your OSM username.',
        requiresOsmUsername: true,
        redirectTo: '/digitization/mapper',
      }, { status: 400 });
    }

    // For non-digitization modules, OSM tracking not yet implemented
    if (youth.program_type !== 'digitization') {
      return NextResponse.json({
        success: false,
        message: `OSM tracking is only available for digitization module. Your module (${youth.program_type}) uses different tracking methods.`,
        moduleType: youth.program_type,
      }, { status: 400 });
    }

    // Get today's date in settlement timezone
    const timezone = youth.timezone || 'Africa/Nairobi';
    const offset = timezone === 'Africa/Nairobi' ? 3 : 0;
    const now = new Date();
    const localDate = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];

    // First check database cache for recent stats (within last 5 minutes)
    // Note: dates in youth_osm_stats are stored as EAT midnight in UTC (e.g., 2026-01-15T21:00:00Z for Jan 16 EAT)
    const cachedStatsResult = await Database.query(`
      SELECT buildings_mapped, changesets_analyzed, last_changeset_id, last_upload_time, updated_at
      FROM youth_osm_stats
      WHERE youth_id = $1 
      AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date = $2::date
      AND updated_at > NOW() - INTERVAL '5 minutes'
    `, [youthId, today]);

    let stats;
    if (cachedStatsResult.rows.length > 0) {
      // Use cached stats from database
      const cached = cachedStatsResult.rows[0];
      console.log(`[API] Using cached stats from database for ${youthId}`);
      stats = {
        totalBuildings: cached.buildings_mapped || 0,
        changesetsAnalyzed: cached.changesets_analyzed || 0,
        lastChangesetId: cached.last_changeset_id,
        lastUploadTime: cached.last_upload_time,
        cacheHit: true,
        processingTime: 0,
      };
    } else {
      // Fetch fresh OSM stats
      console.log(`[API] Fetching fresh OSM stats for ${youthId}`);
      stats = await getTodayBuildingCount(
        youth.osm_username,
        youth.project_hashtag || '#DPW2025',
        youth.timezone || 'Africa/Nairobi',
        false, // Don't force refresh
        youth.exception_hashtags || [] // Exception hashtags for this user
      );
    }

    // Calculate percentage
    const dailyTarget = youth.daily_target || 200;
    const percentage = Math.round((stats.totalBuildings / dailyTarget) * 100);

    // Only update database if we fetched fresh stats (not from cache)
    if (!stats.cacheHit) {
      await Database.query(`
        INSERT INTO youth_osm_stats (
          youth_id, osm_username, date, buildings_mapped,
          changesets_analyzed, last_changeset_id, last_upload_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (youth_id, date) 
        DO UPDATE SET
          buildings_mapped = EXCLUDED.buildings_mapped,
          changesets_analyzed = EXCLUDED.changesets_analyzed,
          last_changeset_id = EXCLUDED.last_changeset_id,
          last_upload_time = EXCLUDED.last_upload_time,
          updated_at = CURRENT_TIMESTAMP
      `, [
        youthId,
        youth.osm_username,
        today,
        stats.totalBuildings,
        stats.changesetsAnalyzed,
        stats.lastChangesetId || null,
        stats.lastUploadTime || null,
      ]);
    }

    // Auto-sync work day (create/update and auto-approve)
    if (stats.totalBuildings > 0) {
      const targetMet = stats.totalBuildings >= dailyTarget;
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
    }

    return NextResponse.json({
      success: true,
      data: {
        today: stats.totalBuildings,
        target: dailyTarget,
        percentage,
        changesetsAnalyzed: stats.changesetsAnalyzed,
        lastUpdated: stats.lastUploadTime || new Date().toISOString(),
        cacheHit: stats.cacheHit,
        processingTime: stats.processingTime,
      },
    });

  } catch (error: any) {
    console.error('[API] Error fetching daily stats:', error?.message || error);
    console.error('[API] Error stack:', error?.stack);
    
    // Try to return cached data from database on any error
    try {
      // Attempt to get last known stats from database
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.substring(7);
      if (token) {
        const decoded: any = jwt.verify(token, getJwtSecret());
        const youthId = decoded.youthId;
        
        // Get today's date in EAT
        const offset = 3; // EAT is UTC+3
        const now = new Date();
        const localDate = new Date(now.getTime() + (offset * 60 * 60 * 1000));
        const today = localDate.toISOString().split('T')[0];
        
        // Check for cached stats in database with proper timezone handling
        const cachedResult = await Database.query(`
          SELECT buildings_mapped, changesets_analyzed, last_upload_time
          FROM youth_osm_stats
          WHERE youth_id = $1 
          AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date = $2::date
        `, [youthId, today]);
        
        if (cachedResult.rows.length > 0) {
          const cached = cachedResult.rows[0];
          console.log('[API] Returning cached stats from database due to error');
          
          return NextResponse.json({
            success: true,
            data: {
              today: cached.buildings_mapped || 0,
              target: 200,
              percentage: Math.round((cached.buildings_mapped || 0) / 200 * 100),
              changesetsAnalyzed: cached.changesets_analyzed || 0,
              lastUpdated: cached.last_upload_time || new Date().toISOString(),
              cacheHit: true,
              fromDatabase: true,
              note: 'Stats from cache - temporary error occurred'
            },
          });
        }
        
        // If no cached stats for today, return 0 with a message
        return NextResponse.json({
          success: true,
          data: {
            today: 0,
            target: 200,
            percentage: 0,
            changesetsAnalyzed: 0,
            lastUpdated: new Date().toISOString(),
            cacheHit: false,
            note: 'No data available for today yet'
          },
        });
      }
    } catch (fallbackError: any) {
      console.error('[API] Fallback also failed:', fallbackError?.message);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

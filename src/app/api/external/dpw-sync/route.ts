import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';

/**
 * DPW Manager Sync API
 * 
 * Provides comprehensive data about youth participants to app.spatialcollective.com
 * Includes: work performance, attendance, training progress, module allocation
 * 
 * Authentication: API Key required in X-API-Key header
 * 
 * GET /api/external/dpw-sync - Get all data
 * GET /api/external/dpw-sync?youth_id=KAY123 - Get specific youth data
 * GET /api/external/dpw-sync?module=mobile_mapping - Filter by module
 */

export async function GET(request: NextRequest) {
  try {
    // Verify API key authentication
    const apiKey = request.headers.get('X-API-Key');
    const validApiKey = process.env.DPW_MANAGER_API_KEY;
    
    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid API Key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const youthId = searchParams.get('youth_id');
    const moduleFilter = searchParams.get('module');

    // Build query conditions
    let whereConditions = ['yp.is_active = TRUE'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (youthId) {
      whereConditions.push(`yp.youth_id = $${paramIndex}`);
      queryParams.push(youthId.toUpperCase());
      paramIndex++;
    }

    if (moduleFilter) {
      whereConditions.push(`yp.program_type = $${paramIndex}`);
      queryParams.push(moduleFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Main query - comprehensive youth data
    const youthData = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.email,
        yp.phone_number,
        yp.work_email,
        yp.program_type as module,
        yp.settlement,
        yp.osm_username,
        yp.module_assignment,
        yp.created_at as enrollment_date,
        yp.last_login,
        
        -- Contract status
        (SELECT COUNT(*) FROM contracts WHERE youth_id = yp.youth_id AND signed_at IS NOT NULL) > 0 as has_signed_contract,
        (SELECT signed_at FROM contracts WHERE youth_id = yp.youth_id ORDER BY signed_at DESC LIMIT 1) as contract_signed_date,
        
        -- Work performance (from work_stats_daily)
        COALESCE((
          SELECT SUM(days_worked) 
          FROM work_stats_daily 
          WHERE youth_id = yp.youth_id
        ), 0) as total_days_worked,
        
        (
          SELECT json_build_object(
            'buildings_mapped', COALESCE(SUM(buildings_mapped), 0),
            'total_days', COALESCE(SUM(days_worked), 0),
            'latest_date', MAX(work_date),
            'first_work_date', MIN(work_date)
          )
          FROM work_stats_daily
          WHERE youth_id = yp.youth_id
        ) as work_summary,
        
        -- Attendance records
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), 0) as attendance_days,
        
        (
          SELECT json_agg(
            json_build_object(
              'date', attendance_date,
              'submitted_at', submitted_at,
              'submitted_by', submitted_by,
              'notes', notes
            ) ORDER BY attendance_date DESC
          )
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ) as attendance_history,
        
        -- Training progress
        (
          SELECT json_build_object(
            'digitization_completed', COALESCE(digitization_completed, false),
            'digitization_completion_date', digitization_completion_date,
            'mobile_mapping_completed', COALESCE(mobile_mapping_completed, false),
            'mobile_mapping_completion_date', mobile_mapping_completion_date
          )
          FROM training_progress
          WHERE youth_id = yp.youth_id
        ) as training_progress,
        
        -- ODK Configuration
        yp.odk_token IS NOT NULL as odk_configured,
        yp.odk_configured_at,
        yp.odk_actor_id
        
      FROM youth_participants yp
      WHERE ${whereClause}
      ORDER BY yp.youth_id
    `, queryParams);

    // Calculate aggregate statistics
    const stats = await Database.query(`
      SELECT 
        program_type as module,
        COUNT(*) as total_participants,
        COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as logged_in_count,
        
        -- Work stats
        COALESCE(SUM((
          SELECT SUM(days_worked) 
          FROM work_stats_daily 
          WHERE youth_id = yp.youth_id
        )), 0) as total_days_worked,
        
        COALESCE(SUM((
          SELECT SUM(buildings_mapped) 
          FROM work_stats_daily 
          WHERE youth_id = yp.youth_id
        )), 0) as total_buildings_mapped,
        
        -- Attendance stats
        COALESCE(SUM((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        )), 0) as total_attendance_records,
        
        -- Training completion
        COUNT((
          SELECT 1 FROM training_progress tp 
          WHERE tp.youth_id = yp.youth_id 
          AND (
            (yp.program_type = 'digitization' AND tp.digitization_completed = true) OR
            (yp.program_type = 'mobile_mapping' AND tp.mobile_mapping_completed = true)
          )
        )) as training_completed_count,
        
        -- ODK configured
        COUNT(CASE WHEN odk_token IS NOT NULL THEN 1 END) as odk_configured_count
        
      FROM youth_participants yp
      WHERE ${whereClause}
      GROUP BY program_type
      ORDER BY program_type
    `, queryParams);

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        participants: youthData.rows,
        count: youthData.rows.length,
        statistics: stats.rows,
        filters_applied: {
          youth_id: youthId || null,
          module: moduleFilter || null
        }
      }
    });

  } catch (error: unknown) {
    console.error('DPW Sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    // Verify API key authentication
    const apiKey = request.headers.get('X-API-Key');
    const validApiKey = process.env.DPW_MANAGER_API_KEY;
    
    // Log incoming request
    console.log(`[DPW-API ${requestId}] Incoming request:`, {
      timestamp: new Date().toISOString(),
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });
    
    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      console.log(`[DPW-API ${requestId}] ❌ Auth failed - Invalid API key`);
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid API Key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const youthId = searchParams.get('youth_id');
    const moduleFilter = searchParams.get('module');
    
    console.log(`[DPW-API ${requestId}] Query params:`, { youthId, moduleFilter });

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
        (SELECT COUNT(*) FROM signed_contracts WHERE youth_id = yp.youth_id AND is_valid = TRUE) > 0 as has_signed_contract,
        (SELECT signed_at FROM signed_contracts WHERE youth_id = yp.youth_id AND is_valid = TRUE ORDER BY signed_at DESC LIMIT 1) as contract_signed_date,
        
        -- Work performance (from youth_work_days and youth_work_summary)
        COALESCE((
          SELECT COUNT(*) 
          FROM youth_work_days 
          WHERE youth_id = yp.youth_id
        ), 0) as total_days_worked,
        
        (
          SELECT json_build_object(
            'buildings_mapped', COALESCE(total_buildings, 0),
            'total_days', COALESCE(days_worked, 0),
            'latest_date', last_work_date
          )
          FROM youth_work_summary
          WHERE youth_id = yp.youth_id
        ) as work_summary,
        
        -- Attendance records (fixed to return array instead of null)
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), 0) as attendance_days,
        
        -- Fixed: Return empty array [] instead of null when no records exist
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'date', attendance_date::text,
              'submitted_at', submitted_at,
              'submitted_by', submitted_by,
              'notes', notes
            ) ORDER BY attendance_date DESC
          )
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), '[]'::json) as attendance_history,
        
        -- Training progress
        (
          SELECT json_build_object(
            'digitization_completed', (
              SELECT COUNT(*) > 0 
              FROM youth_training_progress ytp 
              WHERE ytp.youth_id = yp.youth_id 
              AND ytp.module_type = 'digitization'
            ),
            'digitization_completion_date', (
              SELECT MAX(completed_at) 
              FROM youth_training_progress ytp 
              WHERE ytp.youth_id = yp.youth_id 
              AND ytp.module_type = 'digitization'
            ),
            'mobile_mapping_completed', (
              SELECT COUNT(*) > 0 
              FROM youth_training_progress ytp 
              WHERE ytp.youth_id = yp.youth_id 
              AND ytp.module_type = 'mobile_mapping'
            ),
            'mobile_mapping_completion_date', (
              SELECT MAX(completed_at) 
              FROM youth_training_progress ytp 
              WHERE ytp.youth_id = yp.youth_id 
              AND ytp.module_type = 'mobile_mapping'
            )
          )
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
          SELECT COUNT(*) 
          FROM youth_work_days 
          WHERE youth_id = yp.youth_id
        )), 0) as total_days_worked,
        
        COALESCE(SUM((
          SELECT COALESCE(total_buildings, 0) 
          FROM youth_work_summary 
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
          SELECT 1 FROM youth_training_progress ytp 
          WHERE ytp.youth_id = yp.youth_id 
          AND ytp.module_type = yp.program_type
          LIMIT 1
        )) as training_completed_count,
        
        -- ODK configured
        COUNT(CASE WHEN odk_token IS NOT NULL THEN 1 END) as odk_configured_count
        
      FROM youth_participants yp
      WHERE ${whereClause}
      GROUP BY program_type
      ORDER BY program_type
    `, queryParams);

    console.log(`[DPW-API ${requestId}] ✅ Query executed: ${youthData.rows.length} participants, ${stats.rows.length} stat rows`);

    // Return comprehensive response
    const response = {
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
    };
    
    const duration = Date.now() - startTime;
    console.log(`[DPW-API ${requestId}] ✅ Response sent in ${duration}ms`);
    
    return NextResponse.json(response);

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`[DPW-API ${requestId}] ❌ Error after ${duration}ms:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
        // Include stack trace only in development
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: 500 }
    );
  }
}

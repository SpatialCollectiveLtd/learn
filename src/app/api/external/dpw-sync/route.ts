import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    
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
    
    let whereConditions = ['yp.is_active = TRUE'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (youthId) {
      whereConditions.push(`yp.youth_id = $${paramIndex}`);
      queryParams.push(youthId.toUpperCase());
      paramIndex++;
    }

    if (moduleFilter) {
      // Filter by historical program type (program at time of attendance, not current program)
      // This correctly handles youth who transferred programs mid-project
      whereConditions.push(`yp.youth_id IN (
        SELECT DISTINCT youth_id FROM attendance_records 
        WHERE program_type_at_attendance = $${paramIndex}
      )`);
      queryParams.push(moduleFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Module filter for attendance subqueries — use program type AT TIME OF ATTENDANCE
    // Passed as an extra parameter so all subqueries can reference it consistently
    let moduleAttendanceFilter = '';
    if (moduleFilter) {
      moduleAttendanceFilter = `AND program_type_at_attendance = $${paramIndex}`;
      queryParams.push(moduleFilter);
      paramIndex++;
    }

    // ENHANCED QUERY - Includes OSM stats, attendance-based work calculation, and payment data
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
        
        -- ENHANCED: Work performance with fallback to attendance when work_days missing
        COALESCE((
          SELECT COUNT(*) 
          FROM youth_work_days 
          WHERE youth_id = yp.youth_id
        ), 0) as total_days_worked_official,
        
        -- Attendance as work indicator (for payment calculation when work_days missing)
        -- When module filter is applied, only count attendance for that specific program type
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
          ${moduleAttendanceFilter}
        ), 0) as attendance_days,
        
        -- ENHANCED: OSM building statistics for digitization/mapping programs
        COALESCE((
          SELECT json_build_object(
            'total_buildings', SUM(buildings_mapped),
            'total_changesets', SUM(changesets_analyzed),
            'mapping_days', COUNT(DISTINCT date),
            'first_mapping_date', MIN(date),
            'latest_mapping_date', MAX(date),
            'average_buildings_per_day', ROUND(AVG(buildings_mapped), 2)
          )
          FROM youth_osm_stats
          WHERE youth_id = yp.youth_id
        ), json_build_object(
          'total_buildings', 0,
          'total_changesets', 0,
          'mapping_days', 0,
          'first_mapping_date', null,
          'latest_mapping_date', null,
          'average_buildings_per_day', 0
        )) as osm_statistics,
        
        -- ENHANCED: Payment calculation data  
        CASE 
          -- Use work_days if available
          WHEN EXISTS (SELECT 1 FROM youth_work_days WHERE youth_id = yp.youth_id) THEN
            (SELECT json_build_object(
              'work_days', COUNT(*),
              'buildings_mapped', COALESCE(SUM(buildings_count), 0),
              'data_source', 'youth_work_days',
              'payment_eligible_days', COUNT(CASE WHEN status = 'approved' THEN 1 END),
              'total_earnings_potential', COUNT(CASE WHEN status = 'approved' THEN 1 END) * 
                CASE yp.program_type 
                  WHEN 'digitization' THEN 400
                  WHEN 'mobile_mapping' THEN 500
                  WHEN 'microtasking' THEN 300
                  ELSE 350
                END
            ) FROM youth_work_days WHERE youth_id = yp.youth_id)
          -- Fallback to attendance for payment calculation
          -- Use moduleAttendanceFilter so transferred youth are paid for the correct program
          WHEN EXISTS (SELECT 1 FROM attendance_records WHERE youth_id = yp.youth_id ${moduleAttendanceFilter}) THEN
            (SELECT json_build_object(
              'work_days', COUNT(DISTINCT attendance_date),
              'buildings_mapped', COALESCE(MAX(osm.total_buildings), 0),
              'data_source', 'attendance_records',
              'payment_eligible_days', COUNT(DISTINCT attendance_date),
              'total_earnings_potential', COUNT(DISTINCT attendance_date) * 
                CASE yp.program_type 
                  WHEN 'digitization' THEN 400
                  WHEN 'mobile_mapping' THEN 500  
                  WHEN 'microtasking' THEN 300
                  ELSE 350
                END
            ) FROM attendance_records ar
            LEFT JOIN (
              SELECT youth_id, SUM(buildings_mapped) as total_buildings
              FROM youth_osm_stats 
              WHERE youth_id = yp.youth_id
              GROUP BY youth_id
            ) osm ON osm.youth_id = ar.youth_id
            WHERE ar.youth_id = yp.youth_id ${moduleAttendanceFilter})
          -- No work or attendance data
          ELSE json_build_object(
            'work_days', 0,
            'buildings_mapped', 0,
            'data_source', 'none',
            'payment_eligible_days', 0,
            'total_earnings_potential', 0
          )
        END as payment_data,
        
        -- Original work summary (for backward compatibility)
        (
          SELECT json_build_object(
            'buildings_mapped', COALESCE(total_buildings, 0),
            'total_days', COALESCE(days_worked, 0),
            'latest_date', last_work_date
          )
          FROM youth_work_summary
          WHERE youth_id = yp.youth_id
        ) as work_summary,        
        
        -- Individual work history (detailed work days)
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'work_date', work_date::text,
              'buildings_count', buildings_count,
              'daily_target', daily_target,
              'status', status,
              'target_met', target_met,
              'notes', notes,
              'created_at', created_at
            ) ORDER BY work_date DESC
          )
          FROM youth_work_days
          WHERE youth_id = yp.youth_id
        ), '[]'::json) as work_history,
        
        -- ENHANCED: Attendance history with metadata
        -- When module filter is applied, only include attendance for that program type
        -- Includes program_type field so DPW can see the exact program context per day
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'date', attendance_date::text,
              'submitted_at', submitted_at,
              'submitted_by', submitted_by,
              'notes', notes,
              'program_type', program_type_at_attendance,
              'day_of_week', EXTRACT(dow FROM attendance_date),
              'week_number', EXTRACT(week FROM attendance_date)
            ) ORDER BY attendance_date DESC
          )
          FROM attendance_records
          WHERE youth_id = yp.youth_id
          ${moduleAttendanceFilter}
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

    // ENHANCED: Statistics with payment gap analysis
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
          ${moduleAttendanceFilter}
        )), 0) as total_attendance_records,
        
        -- ENHANCED: Payment eligibility analysis 
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM youth_work_days WHERE youth_id = yp.youth_id
        ) THEN 1 END) as youth_with_work_days,
        
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM attendance_records WHERE youth_id = yp.youth_id ${moduleAttendanceFilter}
        ) THEN 1 END) as youth_with_attendance,
        
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM youth_osm_stats WHERE youth_id = yp.youth_id
        ) THEN 1 END) as youth_with_osm_data,
        
        -- Payment gap analysis
        COUNT(CASE WHEN 
          EXISTS (SELECT 1 FROM attendance_records WHERE youth_id = yp.youth_id ${moduleAttendanceFilter})
          AND NOT EXISTS (SELECT 1 FROM youth_work_days WHERE youth_id = yp.youth_id)
        THEN 1 END) as payment_gap_count,
        
        -- Total earnings potential
        SUM(
          COALESCE((SELECT COUNT(DISTINCT attendance_date) FROM attendance_records WHERE youth_id = yp.youth_id ${moduleAttendanceFilter}), 0) *
          CASE program_type 
            WHEN 'digitization' THEN 400
            WHEN 'mobile_mapping' THEN 500
            WHEN 'microtasking' THEN 300
            ELSE 350
          END
        ) as total_earnings_potential_kes,
        
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

    // ENHANCED: Response with payment system metadata
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      api_version: '2.1-program-transfer-fix',
      enhancements: [
        'OSM building statistics included',
        'Attendance-based payment calculation',
        'Payment gap identification',
        'Multiple data source fallbacks',
        'Earnings potential calculation',
        'Program transfer support: module filter uses program_type_at_attendance (historical program type)',
        'Transferred youth correctly appear under their original program module'
      ],
      payment_rates_kes: {
        digitization: 400,
        mobile_mapping: 500,
        microtasking: 300,
        default: 350
      },
      data: {
        participants: youthData.rows,
        count: youthData.rows.length,
        statistics: stats.rows,
        filters_applied: {
          youth_id: youthId || null,
          module: moduleFilter || null
        },
        // ENHANCED: Payment system health check
        payment_system_health: stats.rows.map(stat => ({
          module: stat.module,
          total_youth: stat.total_participants,
          payment_eligible: stat.youth_with_work_days,
          payment_gap: stat.payment_gap_count,
          gap_percentage: stat.payment_gap_count > 0 ? 
            Math.round((stat.payment_gap_count / stat.total_participants) * 100) : 0,
          total_earnings_potential: `KES ${stat.total_earnings_potential_kes.toLocaleString()}`,
          status: stat.payment_gap_count > 0 ? '🚨 PAYMENT GAPS DETECTED' : '✅ PAYMENT READY'
        }))
      }
    };
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json(response);

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
        
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: 500 }
    );
  }
}
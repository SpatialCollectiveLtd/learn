// POST /api/staff/manage-assignments
// Staff API to transition youth between modules during their 20-day employment period

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { verifyStaffToken } from '@/app/api/_lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify staff authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyStaffToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, youth_id, program_type, transition_date, notes } = body;

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action is required (transition, get_history, or get_eligible)' 
      }, { status: 400 });
    }

    // Action: Get assignment history for a youth
    if (action === 'get_history') {
      if (!youth_id) {
        return NextResponse.json({ 
          success: false, 
          message: 'Youth ID is required for history lookup' 
        }, { status: 400 });
      }

      const historyResult = await Database.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.program_type as current_program_type,
          
          -- Current assignment
          (SELECT program_type FROM get_active_module_assignment(yp.youth_id)) as active_program_type,
          
          -- Assignment history
          json_agg(
            json_build_object(
              'assignment_id', yma.assignment_id,
              'program_type', yma.program_type,
              'start_date', yma.start_date,
              'end_date', yma.end_date,
              'is_active', yma.is_active,
              'assigned_by', yma.assigned_by,
              'assignment_notes', yma.assignment_notes,
              'created_at', yma.created_at
            )
            ORDER BY yma.start_date DESC
          ) as assignment_history,
          
          -- Work statistics  
          (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved') as total_work_days,
          (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'pending') as pending_work_days,
          GREATEST(0, 20 - (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved')) as remaining_work_days
          
        FROM youth_participants yp
        LEFT JOIN youth_module_assignments yma ON yp.youth_id = yma.youth_id
        WHERE yp.youth_id = $1 AND yp.is_active = TRUE
        GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type
      `, [youth_id.toUpperCase()]);

      if (historyResult.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'Youth not found or not active' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: historyResult.rows[0]
      });
    }

    // Action: Get eligible youth for transitions
    if (action === 'get_eligible') {
      const eligibleResult = await Database.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.program_type as current_program_type,
          
          -- Current assignment info
          yma.program_type as active_program_type,
          yma.start_date as current_assignment_start,
          
          -- Work progress
          COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0) as work_days_completed,
          GREATEST(0, 20 - COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0)) as remaining_work_days,
          
          -- Training progress for current module
          COALESCE((SELECT COUNT(DISTINCT step_id) FROM youth_training_progress 
                    WHERE youth_id = yp.youth_id AND module_type = yma.program_type), 0) as training_steps_completed
          
        FROM youth_participants yp
        LEFT JOIN youth_module_assignments yma ON yp.youth_id = yma.youth_id AND yma.is_active = TRUE
        WHERE yp.is_active = TRUE
        AND COALESCE((SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved'), 0) < 20
        ORDER BY yp.settlement, yp.youth_id
      `);

      return NextResponse.json({
        success: true,
        data: eligibleResult.rows,
        summary: {
          total_eligible: eligibleResult.rows.length,
          by_settlement: eligibleResult.rows.reduce((acc, youth) => {
            acc[youth.settlement] = (acc[youth.settlement] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    }

    // Action: Transition youth to new module
    if (action === 'transition') {
      if (!youth_id || !program_type || !transition_date) {
        return NextResponse.json({ 
          success: false, 
          message: 'Youth ID, program type, and transition date are required' 
        }, { status: 400 });
      }

      // Validate program type
      const validPrograms = ['digitization', 'mobile_mapping', 'household_survey', 'microtasking'];
      if (!validPrograms.includes(program_type)) {
        return NextResponse.json({ 
          success: false, 
          message: `Invalid program type. Must be one of: ${validPrograms.join(', ')}` 
        }, { status: 400 });
      }

      // Check if youth exists and is eligible
      const youthCheck = await Database.query(`
        SELECT 
          yp.youth_id, 
          yp.full_name, 
          yp.settlement,
          yp.program_type as current_program_type,
          (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yp.youth_id AND status = 'approved') as work_days_completed
        FROM youth_participants yp 
        WHERE yp.youth_id = $1 AND yp.is_active = TRUE
      `, [youth_id.toUpperCase()]);

      if (youthCheck.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: 'Youth not found or not an active participant' 
        }, { status: 404 });
      }

      const youth = youthCheck.rows[0];

      // Check if youth has completed 20-day work period
      if (youth.work_days_completed >= 20) {
        return NextResponse.json({ 
          success: false, 
          message: `${youth.full_name} has already completed the 20-day work period (${youth.work_days_completed} days)` 
        }, { status: 400 });
      }

      // Check if transitioning to same program type
      if (youth.current_program_type === program_type) {
        return NextResponse.json({ 
          success: false, 
          message: `Youth is already assigned to ${program_type} module` 
        }, { status: 400 });
      }

      // Check if settlement has configuration for new program type
      const configCheck = await Database.query(`
        SELECT config_id, daily_target, project_hashtag
        FROM settlement_work_config
        WHERE settlement = $1 AND program_type = $2 AND is_active = TRUE
      `, [youth.settlement, program_type]);

      if (configCheck.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          message: `No active work configuration found for ${youth.settlement} settlement and ${program_type} program` 
        }, { status: 400 });
      }

      // Perform the transition using the database function
      try {
        const transitionResult = await Database.query(`
          SELECT transition_youth_module($1, $2, $3, $4, $5) as new_assignment_id
        `, [
          youth_id.toUpperCase(),
          program_type,
          transition_date,
          decoded.staffId,
          notes || `Transitioned from ${youth.current_program_type} to ${program_type} by staff`
        ]);

        const newAssignmentId = transitionResult.rows[0].new_assignment_id;

        // Get updated assignment info
        const updatedInfo = await Database.query(`
          SELECT 
            yma.assignment_id,
            yma.program_type,
            yma.start_date,
            yma.assignment_notes,
            yp.youth_id,
            yp.full_name,
            yp.settlement
          FROM youth_module_assignments yma
          JOIN youth_participants yp ON yma.youth_id = yp.youth_id
          WHERE yma.assignment_id = $1
        `, [newAssignmentId]);

        return NextResponse.json({
          success: true,
          message: `Successfully transitioned ${youth.full_name} to ${program_type} module`,
          data: {
            transition: updatedInfo.rows[0],
            previous_program: youth.current_program_type,
            work_days_completed: youth.work_days_completed,
            remaining_work_days: 20 - youth.work_days_completed
          }
        });

      } catch (err: unknown) {
        const error = err as Error;
        console.error('[API] Module transition error:', error);
        
        return NextResponse.json({
          success: false,
          message: error.message || 'Failed to transition youth module assignment',
          details: error.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action. Supported actions: transition, get_history, get_eligible' 
    }, { status: 400 });

  } catch (error) {
    console.error('[API] Assignment management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/staff/manage-assignments?youth_id=KAY1234&action=get_history
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const youth_id = searchParams.get('youth_id');
  const action = searchParams.get('action') || 'get_history';

  // Reuse the POST logic for GET requests
  const mockBody = { action, youth_id };
  const mockRequest = {
    ...request,
    json: async () => mockBody
  } as NextRequest;

  return await POST(mockRequest);
}
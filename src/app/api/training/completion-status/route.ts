// GET /api/training/completion-status
// Checks if ALL training steps are completed for the youth's program module
// Required before granting access to work dashboard

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import jwt from 'jsonwebtoken';

// Get JWT secret at runtime, not module load time (for Vercel compatibility)
function getJwtSecret(): string {
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters');
  }
  return secret;
}

// Map of program types to their required training steps
// CRITICAL: step_id in database is stored as INTEGER (1, 2, 3, etc.)
// NOT as string ('intro', 'building-types', etc.)
const REQUIRED_STEPS: Record<string, number[]> = {
  mapper: [1, 2, 3, 4, 5, 6, 7],           // Mapper has 7 steps
  validator: [1, 2, 3, 4, 5, 6],           // Validator has 6 steps
  digitization: [1, 2, 3, 4, 5, 6, 7],     // Legacy fallback
  mobile_mapping: [1, 2, 3, 4],            // 4 steps
  household_survey: [1, 2, 3, 4],          // 4 steps
  microtasking: [1, 2, 3],                 // 3 steps
};

// Step titles for display
const STEP_TITLES: Record<string, Record<number, string>> = {
  mapper: {
    1: 'Introduction',
    2: 'Building Types',
    3: 'Building Identification',
    4: 'Drawing Techniques',
    5: 'Quality Guidelines',
    6: 'OSM Setup',
    7: 'Final Assessment',
  },
  validator: {
    1: 'Introduction',
    2: 'Validation Basics',
    3: 'Error Detection',
    4: 'Correction Techniques',
    5: 'Quality Standards',
    6: 'Final Assessment',
  },
  mobile_mapping: {
    1: 'Install ODK Collect',
    2: 'Connect to Server',
    3: 'Download Forms',
    4: 'Collect Data',
  },
  household_survey: {
    1: 'Survey Introduction',
    2: 'Form Navigation',
    3: 'Data Entry',
    4: 'Submission',
  },
  microtasking: {
    1: 'Task Overview',
    2: 'Completing Tasks',
    3: 'Quality Standards',
  },
};

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

    // Get youth program type and module assignment
    const youthResult = await Database.query(`
      SELECT program_type, module_assignment, osm_username, settlement
      FROM youth_participants
      WHERE youth_id = $1 AND is_active = TRUE
    `, [youthId]);

    if (youthResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth profile not found' },
        { status: 404 }
      );
    }

    const { program_type, module_assignment, osm_username, settlement } = youthResult.rows[0];

    // CRITICAL FIX: For digitization program, use module_assignment ('mapper' or 'validator')
    // For other programs, use program_type directly
    const moduleType = program_type === 'digitization' && module_assignment
      ? module_assignment  // 'mapper' or 'validator'
      : program_type;      // 'mobile_mapping', 'household_survey', etc.

    // Get required steps for this module type
    // Use moduleType (mapper/validator) not program_type (digitization)
    const requiredSteps = REQUIRED_STEPS[moduleType] || [];
    if (requiredSteps.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No training steps defined for module: ${moduleType}`,
      }, { status: 400 });
    }

    // Get completed training steps
    // Use moduleType which is either module_assignment (for digitization) or program_type (for others)
    const progressResult = await Database.query(`
      SELECT step_id, completed_at
      FROM youth_training_progress
      WHERE youth_id = $1 AND module_type = $2
      ORDER BY completed_at ASC
    `, [youthId, moduleType]);

    const completedSteps = new Set(
      progressResult.rows.map((row: any) => parseInt(row.step_id))  // Convert to number
    );

    // Check if all required steps are completed
    const missingStepIds = requiredSteps.filter(step => !completedSteps.has(step));
    const allStepsCompleted = missingStepIds.length === 0;
    
    // Convert missing step IDs to readable titles
    const stepTitles = STEP_TITLES[moduleType] || STEP_TITLES['mapper'] || {};
    const missingSteps = missingStepIds.map(stepId => stepTitles[stepId] || `Step ${stepId}`);

    // Additional check: OSM username required for digitization
    const requiresOsmUsername = program_type === 'digitization';
    const hasOsmUsername = !!osm_username;
    const canAccessWorkDashboard = allStepsCompleted && 
      (!requiresOsmUsername || hasOsmUsername);

    return NextResponse.json({
      success: true,
      data: {
        programType: program_type,
        moduleAssignment: module_assignment,
        moduleType,  // The actual module being checked ('mapper', 'validator', or program_type)
        settlement,
        trainingCompleted: allStepsCompleted,
        hasOsmUsername,
        requiresOsmUsername,
        canAccessWorkDashboard,
        progress: {
          total: requiredSteps.length,
          completed: completedSteps.size,
          percentage: Math.round((completedSteps.size / requiredSteps.length) * 100),
          missingSteps,
        },
        completedSteps: progressResult.rows.map((row: any) => ({
          stepId: row.step_id,
          completedAt: row.completed_at,
        })),
      },
    });

  } catch (error: any) {
    console.error('[API] Error checking training completion:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check training completion status',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

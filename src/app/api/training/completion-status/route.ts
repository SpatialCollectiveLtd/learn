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




const REQUIRED_STEPS: Record<string, number[]> = {
  mapper: [1, 2, 3, 4, 5, 6, 7],           
  validator: [1, 2, 3, 4, 5, 6],           
  digitization: [1, 2, 3, 4, 5, 6, 7],     
  mobile_mapping: [1, 2, 3, 4],            
  household_survey: [1, 2, 3, 4],          
  microtasking: [1, 2, 3],                 
};


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

    
    
    const moduleType = program_type === 'digitization' && module_assignment
      ? module_assignment  
      : program_type;      

    
    
    const requiredSteps = REQUIRED_STEPS[moduleType] || [];
    if (requiredSteps.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No training steps defined for module: ${moduleType}`,
      }, { status: 400 });
    }

    
    
    const progressResult = await Database.query(`
      SELECT step_id, completed_at
      FROM youth_training_progress
      WHERE youth_id = $1 AND module_type = $2
      ORDER BY completed_at ASC
    `, [youthId, moduleType]);

    const completedSteps = new Set(
      progressResult.rows.map((row: any) => parseInt(row.step_id))  
    );

    
    const missingStepIds = requiredSteps.filter(step => !completedSteps.has(step));
    const allStepsCompleted = missingStepIds.length === 0;
    
    
    const stepTitles = STEP_TITLES[moduleType] || STEP_TITLES['mapper'] || {};
    const missingSteps = missingStepIds.map(stepId => stepTitles[stepId] || `Step ${stepId}`);

    
    const requiresOsmUsername = program_type === 'digitization';
    const hasOsmUsername = !!osm_username;
    const canAccessWorkDashboard = allStepsCompleted && 
      (!requiresOsmUsername || hasOsmUsername);

    return NextResponse.json({
      success: true,
      data: {
        programType: program_type,
        moduleAssignment: module_assignment,
        moduleType,  
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

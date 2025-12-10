import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../../_lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

/**
 * GET /api/youth/training-progress
 * Fetch training progress for authenticated youth
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const moduleType = searchParams.get('module'); // 'mapper' or 'validator'

    // Build query based on module filter
    let query = `
      SELECT module_type, step_id, completed_at
      FROM youth_training_progress
      WHERE youth_id = $1
    `;
    const params: any[] = [decoded.youthId];

    if (moduleType) {
      query += ' AND module_type = $2';
      params.push(moduleType);
    }

    query += ' ORDER BY module_type, step_id';

    const result = await Database.query(query, params);

    // Group by module type
    const progressByModule: { [key: string]: number[] } = {
      mapper: [],
      validator: []
    };

    result.rows.forEach((row: any) => {
      progressByModule[row.module_type].push(row.step_id);
    });

    return NextResponse.json({
      success: true,
      data: {
        youthId: decoded.youthId,
        progress: progressByModule,
        totalCompleted: result.rows.length,
        details: result.rows
      }
    });

  } catch (error) {
    console.error('Error fetching training progress:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch training progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/youth/training-progress
 * Mark a step as completed (with sequential validation)
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { moduleType, stepId } = body;

    // Validate input
    if (!moduleType || !stepId) {
      return NextResponse.json(
        { success: false, message: 'Module type and step ID are required' },
        { status: 400 }
      );
    }

    if (!['mapper', 'validator'].includes(moduleType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid module type' },
        { status: 400 }
      );
    }

    const stepNumber = parseInt(stepId);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 7) {
      return NextResponse.json(
        { success: false, message: 'Step ID must be between 1 and 7' },
        { status: 400 }
      );
    }

    // CRITICAL VALIDATION: Ensure previous step is completed (except for step 1)
    if (stepNumber > 1) {
      const previousStepCheck = await Database.query(
        `SELECT step_id FROM youth_training_progress 
         WHERE youth_id = $1 AND module_type = $2 AND step_id = $3`,
        [decoded.youthId, moduleType, stepNumber - 1]
      );

      if (previousStepCheck.rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: `You must complete Step ${stepNumber - 1} before proceeding to Step ${stepNumber}`,
            missingStep: stepNumber - 1
          },
          { status: 403 }
        );
      }
    }

    // SPECIAL VALIDATION FOR STEP 2: Ensure OSM username is set
    if (moduleType === 'mapper' && stepNumber === 2) {
      const youthCheck = await Database.query(
        'SELECT osm_username FROM youth_participants WHERE youth_id = $1',
        [decoded.youthId]
      );

      if (!youthCheck.rows[0]?.osm_username) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'You must save your verified OSM username before completing this step'
          },
          { status: 403 }
        );
      }
    }

    // Insert or update progress (using ON CONFLICT to handle duplicates)
    await Database.query(
      `INSERT INTO youth_training_progress (youth_id, module_type, step_id, completed_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (youth_id, module_type, step_id) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      [decoded.youthId, moduleType, stepNumber]
    );

    return NextResponse.json({
      success: true,
      message: `Step ${stepNumber} marked as completed`,
      data: {
        youthId: decoded.youthId,
        moduleType,
        stepId: stepNumber
      }
    });

  } catch (error) {
    console.error('Error marking step complete:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark step as completed' },
      { status: 500 }
    );
  }
}

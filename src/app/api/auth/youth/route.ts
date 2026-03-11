import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/app/api/_lib/auth';
import { authenticateYouth } from '@/lib/dpw-client';
import { DpwClientError } from '@/lib/dpw-client';
import type { LearnTokenPayload } from '@/app/api/_lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youthId } = body;

    if (!youthId || typeof youthId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Youth ID is required' },
        { status: 400 }
      );
    }

    const normalizedId = youthId.trim().toUpperCase();

    // Validate format: starts with KAY, KAR, or HUR followed by alphanumeric
    if (!/^(KAY|KAR|HUR)[A-Z0-9]+$/i.test(normalizedId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Youth ID format' },
        { status: 400 }
      );
    }

    // Authenticate against DPW App
    const profile = await authenticateYouth(normalizedId);

    // Sign Learn's own JWT
    const payload: LearnTokenPayload = {
      userId: profile.user_id,
      fullName: profile.full_name,
      role: 'youth',
      settlement: profile.settlement,
      module: profile.module,
      moduleAssignment: profile.module_assignment,
      userType: 'youth',
    };

    const token = signToken(payload);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          userId: profile.user_id,
          fullName: profile.full_name,
          email: profile.email,
          phone: profile.phone_number,
          role: 'youth',
          settlement: profile.settlement,
          module: profile.module,
          moduleAssignment: profile.module_assignment,
          trainerName: profile.trainer_name,
          cohort: profile.cohort,
          contract: profile.contract,
        },
      },
    });
  } catch (error) {
    if (error instanceof DpwClientError) {
      const status = error.statusCode === 401 || error.statusCode === 403 ? error.statusCode : 401;
      return NextResponse.json(
        { success: false, message: error.message },
        { status }
      );
    }

    console.error('Youth auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

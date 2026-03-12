import { NextRequest, NextResponse } from 'next/server';
import { signToken, normalizeRole } from '@/app/api/_lib/auth';
import { verifyLaunchToken, DpwClientError } from '@/lib/dpw-client';
import type { LearnTokenPayload } from '@/app/api/_lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Launch token is required' },
        { status: 400 }
      );
    }

    // Verify the one-time launch token with DPW App
    const profile = await verifyLaunchToken(token);

    const role = normalizeRole(profile.role);

    // Sign Learn's own JWT
    const payload: LearnTokenPayload = {
      userId: profile.user_id,
      fullName: profile.full_name,
      role,
      settlement: profile.settlement,
      module: null,
      moduleAssignment: null,
      userType: 'staff',
    };

    const learnToken = signToken(payload);

    return NextResponse.json({
      success: true,
      data: {
        token: learnToken,
        user: {
          userId: profile.user_id,
          fullName: profile.full_name,
          email: profile.email,
          role,
          settlement: profile.settlement,
          permissions: profile.permissions,
          userType: 'staff',
          module: null,
          moduleAssignment: null,
        },
      },
    });
  } catch (error) {
    if (error instanceof DpwClientError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 401 }
      );
    }

    console.error('Launch auth error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

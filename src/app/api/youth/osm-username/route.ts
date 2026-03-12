import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/app/api/_lib/auth';
import { Database } from '@/app/api/_lib/database';

/**
 * GET /api/youth/osm-username
 * Returns the authenticated youth's OSM username from the Learn DB.
 */
export async function GET(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const result = await Database.query(
    'SELECT osm_username FROM youth_participants WHERE youth_id = $1',
    [token.userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { osmUsername: result.rows[0].osm_username || null },
  });
}

/**
 * PUT /api/youth/osm-username
 * Body: { osmUsername: string }
 * Updates the authenticated youth's OSM username in the Learn DB.
 */
export async function PUT(request: NextRequest) {
  const token = verifyAuthHeader(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  let body: { osmUsername?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { osmUsername } = body;
  if (!osmUsername || typeof osmUsername !== 'string' || osmUsername.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION', message: 'osmUsername is required' } },
      { status: 400 }
    );
  }

  const sanitized = osmUsername.trim().substring(0, 255);

  await Database.query(
    'UPDATE youth_participants SET osm_username = $1 WHERE youth_id = $2',
    [sanitized, token.userId]
  );

  return NextResponse.json({ success: true, data: { osmUsername: sanitized } });
}

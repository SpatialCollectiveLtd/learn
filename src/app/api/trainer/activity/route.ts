import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Database } from '../../_lib/database';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is trainer
    if (decoded.role !== 'trainer') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Trainer access required' },
        { status: 403 }
      );
    }

    // Get recent activity - last logins, registrations
    const recentLogins = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        last_login,
        created_at
      FROM youth_participants
      WHERE last_login IS NOT NULL
      ORDER BY last_login DESC
      LIMIT 5
    `);

    const recentRegistrations = await Database.query(`
      SELECT 
        youth_id,
        full_name,
        created_at
      FROM youth_participants
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Format activities
    const activities: Array<{
      type: string;
      icon: string;
      title: string;
      subtitle: string;
      timestamp: string;
    }> = [];

    // Add recent completions (based on last_login as a proxy for activity)
    recentLogins.rows.slice(0, 3).forEach((youth: any) => {
      if (youth.last_login) {
        activities.push({
          type: 'completion',
          icon: 'CheckCircle2',
          title: 'Youth completed training activity',
          subtitle: `${youth.youth_id} - ${getTimeAgo(youth.last_login)}`,
          timestamp: youth.last_login,
        });
      }
    });

    // Add recent registrations
    recentRegistrations.rows.forEach((youth: any) => {
      const isNew = new Date(youth.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (isNew) {
        activities.push({
          type: 'registration',
          icon: 'Users',
          title: 'New youth registered',
          subtitle: `${youth.youth_id} - ${getTimeAgo(youth.created_at)}`,
          timestamp: youth.created_at,
        });
      }
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.slice(0, 5), // Return top 5 most recent
      }
    });

  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch activity data', error: error.message },
      { status: 500 }
    );
  }
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

/**
 * Badges API - Client-Side Badge System
 * 
 * GET /api/youth/badges
 * Returns badge status calculated from Performance + Payment API data
 * NOTE: This is NOT a proxy - Learn Platform calculates badges locally
 * 
 * Auth: Bearer token (youth JWT)
 * Response: Badge status with earned/locked states and progress
 */

const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://digital-chi-six.vercel.app/api/v1';
const DPW_API_KEY = process.env.DPW_MANAGER_API_KEY || '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';

// Badge definitions
const BADGE_CRITERIA = {
  first_submission: {
    name: 'First Steps',
    description: 'Submit your first POI',
    tiers: [
      { tier: 'bronze', requirement: 1, icon: '🥉' },
    ],
  },
  consistency: {
    name: 'Consistent Contributor',
    description: 'Submit data on consecutive days',
    tiers: [
      { tier: 'bronze', requirement: 3, icon: '🥉' },
      { tier: 'silver', requirement: 5, icon: '🥈' },
      { tier: 'gold', requirement: 7, icon: '🥇' },
    ],
  },
  quality_master: {
    name: 'Quality Master',
    description: 'Maintain high quality scores',
    tiers: [
      { tier: 'bronze', requirement: 70, icon: '🥉' }, // 70%+ avg quality
      { tier: 'silver', requirement: 85, icon: '🥈' }, // 85%+
      { tier: 'gold', requirement: 95, icon: '🥇' }, // 95%+
    ],
  },
  volume_champion: {
    name: 'Volume Champion',
    description: 'Submit large number of POIs',
    tiers: [
      { tier: 'bronze', requirement: 100, icon: '🥉' },
      { tier: 'silver', requirement: 300, icon: '🥈' },
      { tier: 'gold', requirement: 500, icon: '🥇' },
    ],
  },
  top_performer: {
    name: 'Top Performer',
    description: 'Rank in top positions on leaderboard',
    tiers: [
      { tier: 'bronze', requirement: 10, icon: '🥉' }, // Top 10
      { tier: 'silver', requirement: 5, icon: '🥈' }, // Top 5
      { tier: 'gold', requirement: 1, icon: '🥇' }, // #1 rank
    ],
  },
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[Badges-API ${requestId}] Route accessed, DPW_BASE_URL: ${DPW_BASE_URL}`);
  
  try {
    // Verify youth authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' } },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let youthId: string;
    
    try {
      const decoded = verifyYouthToken(token);
      youthId = decoded.youth_id;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    console.log(`[Badges-API ${requestId}] Request for youth: ${youthId}`);

    // Fetch performance data from DPW
    const performanceUrl = `${DPW_BASE_URL}/youth/${youthId}/performance`;
    const paymentUrl = `${DPW_BASE_URL}/youth/${youthId}/payment/breakdown`;
    
    const [performanceRes, paymentRes] = await Promise.all([
      fetch(performanceUrl, {
        headers: { 'X-API-Key': DPW_API_KEY },
        signal: AbortSignal.timeout(10000),
      }),
      fetch(paymentUrl, {
        headers: { 'X-API-Key': DPW_API_KEY },
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (!performanceRes.ok || !paymentRes.ok) {
      throw new Error('Failed to fetch data from DPW API');
    }

    const performanceData = await performanceRes.json();
    const paymentData = await paymentRes.json();

    // Extract metrics
    const metrics = {
      totalPois: paymentData.data?.daily_breakdown?.reduce((sum: number, day: any) => sum + day.pois_submitted, 0) || 0,
      workDays: paymentData.data?.work_days_completed || 0,
      avgQuality: performanceData.data?.personal_metrics?.quality_score || 0,
      rank: performanceData.data?.settlement_ranking?.youth_rank || 999,
      consecutiveDays: calculateConsecutiveDays(paymentData.data?.daily_breakdown || []),
    };

    // Calculate badge status
    const badges = calculateBadges(metrics);
    const duration = Date.now() - startTime;
    
    console.log(`[Badges-API ${requestId}] Success (${duration}ms) - ${badges.filter((b: any) => b.earned).length} badges earned`);

    return NextResponse.json({
      success: true,
      data: {
        youth_id: youthId,
        total_badges: badges.length,
        earned_badges: badges.filter((b: any) => b.earned).length,
        badges,
        metrics,
        last_updated: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Badges-API ${requestId}] Error (${duration}ms):`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate badges',
          details: error.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

// Helper: Calculate consecutive work days
function calculateConsecutiveDays(dailyBreakdown: any[]): number {
  if (!dailyBreakdown || dailyBreakdown.length === 0) return 0;
  
  const sortedDates = dailyBreakdown
    .map(d => new Date(d.date))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let maxStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = Math.floor((sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return maxStreak;
}

// Helper: Calculate badge status
function calculateBadges(metrics: any) {
  const badges = [];
  
  for (const [badgeId, criteria] of Object.entries(BADGE_CRITERIA)) {
    for (const tier of criteria.tiers) {
      let progress = 0;
      let earned = false;
      
      switch (badgeId) {
        case 'first_submission':
          progress = metrics.totalPois >= 1 ? 100 : 0;
          earned = metrics.totalPois >= 1;
          break;
        case 'consistency':
          progress = Math.min((metrics.consecutiveDays / tier.requirement) * 100, 100);
          earned = metrics.consecutiveDays >= tier.requirement;
          break;
        case 'quality_master':
          progress = Math.min((metrics.avgQuality / tier.requirement) * 100, 100);
          earned = metrics.avgQuality >= tier.requirement;
          break;
        case 'volume_champion':
          progress = Math.min((metrics.totalPois / tier.requirement) * 100, 100);
          earned = metrics.totalPois >= tier.requirement;
          break;
        case 'top_performer':
          progress = metrics.rank <= tier.requirement ? 100 : 0;
          earned = metrics.rank <= tier.requirement;
          break;
      }
      
      badges.push({
        badge_id: `${badgeId}_${tier.tier}`,
        name: `${criteria.name} - ${tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}`,
        description: criteria.description,
        tier: tier.tier,
        icon: tier.icon,
        earned,
        progress: Math.round(progress),
        earned_at: earned ? new Date().toISOString() : null,
      });
    }
  }
  
  return badges;
}

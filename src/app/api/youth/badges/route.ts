import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';
import fs from 'fs/promises';
import path from 'path';

/**
 * Badges API - Client-Side Badge System
 * 
 * GET /api/youth/badges
 * Returns badge status calculated from local DPW payment data
 * NOTE: This calculates badges locally from DPW Excel data
 * 
 * Auth: Bearer token (youth JWT)
 * Response: Badge status with earned/locked states and progress
 */

// Badge definitions updated for DPW cycles
const BADGE_CRITERIA = {
  first_submission: {
    name: 'First Steps',
    description: 'Complete your first work cycle',
    tiers: [
      { tier: 'bronze', requirement: 1, icon: '🥉' },
    ],
  },
  consistency: {
    name: 'Consistent Worker',
    description: 'Work consecutive days in a cycle',
    tiers: [
      { tier: 'bronze', requirement: 3, icon: '🥉' },
      { tier: 'silver', requirement: 5, icon: '🥈' },
      { tier: 'gold', requirement: 10, icon: '🥇' },
    ],
  },
  quality_master: {
    name: 'Quality Master',
    description: 'Maintain high quality scores',
    tiers: [
      { tier: 'bronze', requirement: 60, icon: '🥉' }, // 60%+ avg quality
      { tier: 'silver', requirement: 80, icon: '🥈' }, // 80%+
      { tier: 'gold', requirement: 90, icon: '🥇' }, // 90%+
    ],
  },
  earning_champion: {
    name: 'Earning Champion',
    description: 'Earn significant amounts through quality work',
    tiers: [
      { tier: 'bronze', requirement: 5000, icon: '🥉' }, // KES 5,000
      { tier: 'silver', requirement: 10000, icon: '🥈' }, // KES 10,000  
      { tier: 'gold', requirement: 15000, icon: '🥇' }, // KES 15,000
    ],
  },
  top_performer: {
    name: 'Top Performer',
    description: 'Rank in top positions by total earnings',
    tiers: [
      { tier: 'bronze', requirement: 20, icon: '🥉' }, // Top 20
      { tier: 'silver', requirement: 10, icon: '🥈' }, // Top 10
      { tier: 'gold', requirement: 5, icon: '🥇' }, // Top 5
    ],
  },
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`[Badges-API ${requestId}] Route accessed - calculating badges from local DPW data`);
  
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
      youthId = decoded.youthId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      );
    }

    console.log(`[Badges-API ${requestId}] Request for youth: ${youthId}`);

    // Load DPW payment data
    const dataPath = path.join(process.cwd(), 'data', 'dpw-payment-data.json');
    
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      const paymentData = JSON.parse(fileContent);
      
      const userPayment = paymentData.data[youthId];
      
      if (!userPayment) {
        return NextResponse.json({
          success: true,
          data: {
            youth_id: youthId,
            total_badges: 0,
            earned_badges: 0,
            badges: [],
            metrics: {
              totalEarnings: 0,
              workDays: 0,
              avgQuality: 0,
              rank: 0,
              totalCycles: 0
            }
          }
        });
      }

      // Calculate metrics from DPW data
      const adjustedQuality = Math.max(userPayment.overall_quality_percentage, 60);
      
      // Calculate rank by earnings
      const allParticipants = Object.values(paymentData.data)
        .sort((a: any, b: any) => b.total_payment - a.total_payment);
      const userRank = allParticipants.findIndex((p: any) => p.youth_id === youthId) + 1;
      
      const cycleCount = (userPayment.cycle2 ? 1 : 0) + (userPayment.cycle3 ? 1 : 0);
      
      const metrics = {
        totalEarnings: userPayment.total_payment,
        workDays: userPayment.total_days,
        avgQuality: adjustedQuality,
        rank: userRank,
        totalCycles: cycleCount
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
      
    } catch (fileError: any) {
      console.error(`[Badges-API ${requestId}] Failed to read DPW data:`, fileError);
      return NextResponse.json(
        { 
          success: false, 
          error: {
            code: 'DATA_ERROR',
            message: 'Failed to load DPW payment data',
            details: fileError.message,
            timestamp: new Date().toISOString(),
          }
        },
        { status: 500 }
      );
    }

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

// Helper: Calculate badge status for DPW data
function calculateBadges(metrics: any) {
  const badges = [];
  
  for (const [badgeId, criteria] of Object.entries(BADGE_CRITERIA)) {
    for (const tier of (criteria as any).tiers) {
      let progress = 0;
      let earned = false;
      
      switch (badgeId) {
        case 'first_submission':
          progress = metrics.totalCycles >= 1 ? 100 : 0;
          earned = metrics.totalCycles >= 1;
          break;
        case 'consistency':
          progress = Math.min((metrics.workDays / tier.requirement) * 100, 100);
          earned = metrics.workDays >= tier.requirement;
          break;
        case 'quality_master':
          progress = Math.min((metrics.avgQuality / tier.requirement) * 100, 100);
          earned = metrics.avgQuality >= tier.requirement;
          break;
        case 'earning_champion':
          progress = Math.min((metrics.totalEarnings / tier.requirement) * 100, 100);
          earned = metrics.totalEarnings >= tier.requirement;
          break;
        case 'top_performer':
          progress = metrics.rank <= tier.requirement ? 100 : 0;
          earned = metrics.rank <= tier.requirement && metrics.rank > 0;
          break;
      }
      
      badges.push({
        badge_id: `${badgeId}_${tier.tier}`,
        name: `${(criteria as any).name} - ${tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}`,
        description: (criteria as any).description,
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

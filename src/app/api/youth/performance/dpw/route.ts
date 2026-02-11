import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '../../../_lib/auth';
import fs from 'fs/promises';
import path from 'path';

interface DPWPaymentData {
  youth_id: string;
  name: string;
  settlement: string;
  program_type: string;
  cycle2?: {
    days_present: number;
    base_pay: number;
    quality_pay: number;
    total_earned: number;
    quality_percentage: number;
    period: string;
  };
  cycle3?: {
    days_present: number;
    base_pay: number;
    quality_pay: number;
    total_earned: number;
    quality_percentage: number;
    period: string;
  };
  total_payment: number;
  total_days: number;
  overall_quality_percentage: number;
}

interface DPWPaymentFile {
  generated_at: string;
  period_displayed: string;
  cycle2_period: string;
  cycle3_period: string;
  total_participants: number;
  data: Record<string, DPWPaymentData>;
}

interface LeaderboardEntry {
  youth_id: string;
  name: string;
  settlement: string;
  quality_score: number;
  total_earnings: number;
  total_days: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyYouthToken(token);
    const youth_id = decoded.youthId;

    // Load DPW payment data
    const dataPath = path.join(process.cwd(), 'data', 'dpw-payment-data.json');
    
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      const paymentData: DPWPaymentFile = JSON.parse(fileContent);
      
      const userPayment = paymentData.data[youth_id];
      
      if (!userPayment) {
        return NextResponse.json({
          message: 'No DPW performance data found for this period',
          personal_metrics: {
            quality_score: 0,
            attendance_rate: 0,
            total_earnings: 0,
            total_days_worked: 0
          },
          settlement_ranking: [],
          leaderboard: []
        });
      }

      // Calculate personal metrics
      const personalMetrics = {
        quality_score: userPayment.overall_quality_percentage,
        attendance_rate: Math.round((userPayment.total_days / 20) * 100), // Assuming 20 max days for period
        total_earnings: userPayment.total_payment,
        total_days_worked: userPayment.total_days
      };

      // Create leaderboard from all participants
      const leaderboard: LeaderboardEntry[] = Object.values(paymentData.data)
        .map(participant => ({
          youth_id: participant.youth_id,
          name: participant.name,
          settlement: participant.settlement,
          quality_score: participant.overall_quality_percentage,
          total_earnings: participant.total_payment,
          total_days: participant.total_days
        }))
        .sort((a, b) => b.quality_score - a.quality_score) // Sort by quality score
        .slice(0, 10); // Top 10

      // Calculate settlement ranking
      const settlementStats: Record<string, {
        settlement: string;
        participants: number;
        avg_quality: number;
        avg_earnings: number;
        total_days: number;
      }> = {};

      Object.values(paymentData.data).forEach(participant => {
        const settlement = participant.settlement;
        if (!settlementStats[settlement]) {
          settlementStats[settlement] = {
            settlement,
            participants: 0,
            avg_quality: 0,
            avg_earnings: 0,
            total_days: 0
          };
        }
        
        settlementStats[settlement].participants++;
        settlementStats[settlement].total_days += participant.total_days;
        settlementStats[settlement].avg_quality += participant.overall_quality_percentage;
        settlementStats[settlement].avg_earnings += participant.total_payment;
      });

      // Calculate averages and convert to array
      const settlementRanking = Object.values(settlementStats)
        .map(stats => ({
          settlement: stats.settlement,
          participants: stats.participants,
          avg_quality_score: Math.round(stats.avg_quality / stats.participants),
          avg_earnings: Math.round(stats.avg_earnings / stats.participants),
          total_days_worked: stats.total_days
        }))
        .sort((a, b) => b.avg_quality_score - a.avg_quality_score);

      return NextResponse.json({
        period: paymentData.period_displayed,
        personal_metrics: personalMetrics,
        settlement_ranking: settlementRanking,
        leaderboard: leaderboard,
        user_ranking: {
          quality_rank: leaderboard.findIndex(entry => entry.youth_id === youth_id) + 1,
          settlement_rank: settlementRanking.findIndex(settlement => settlement.settlement === userPayment.settlement) + 1
        }
      });

    } catch (fileError) {
      console.error('Error reading DPW payment data:', fileError);
      return NextResponse.json({
        message: 'DPW performance data not available',
        personal_metrics: {
          quality_score: 0,
          attendance_rate: 0,
          total_earnings: 0,
          total_days_worked: 0
        },
        settlement_ranking: [],
        leaderboard: []
      });
    }

  } catch (error) {
    console.error('Error fetching DPW performance data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
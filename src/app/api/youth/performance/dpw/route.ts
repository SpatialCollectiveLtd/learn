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

      // Calculate personal metrics with adjusted quality
      const adjustedQualityScore = Math.max(userPayment.overall_quality_percentage, 60);
      
      const personalMetrics = {
        quality_score: adjustedQualityScore,
        attendance_rate: Math.round((userPayment.total_days / 20) * 100), // Assuming 20 max days for period
        total_earnings: userPayment.total_payment,
        total_days_worked: userPayment.total_days
      };

      // Create leaderboard from all participants, ranked by total earnings
      const leaderboard: LeaderboardEntry[] = Object.values(paymentData.data)
        .map(participant => ({
          youth_id: participant.youth_id,
          name: participant.name,
          settlement: participant.settlement,
          quality_score: Math.max(participant.overall_quality_percentage, 60),
          total_earnings: participant.total_payment,
          total_days: participant.total_days
        }))
        .sort((a, b) => b.total_earnings - a.total_earnings) // Sort by total earnings
        .slice(0, 20); // Top 20

      return NextResponse.json({
        period: 'Jan 7 - Feb 6, 2026',
        personal_metrics: personalMetrics,
        leaderboard: leaderboard,
        user_ranking: {
          earnings_rank: leaderboard.findIndex(entry => entry.youth_id === youth_id) + 1,
          total_participants: Object.keys(paymentData.data).length
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
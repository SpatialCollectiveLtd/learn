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

interface DailyBreakdown {
  date: string;
  work_type: string;
  days_worked: number;
  base_rate: number;
  quality_score: number;
  quality_bonus: number;
  earnings: number;
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
          message: 'No DPW payment data found for this period',
          period: paymentData.period_displayed,
          total_earnings: 0,
          daily_breakdown: []
        });
      }

      // Create daily breakdown from cycle data
      const dailyBreakdown: DailyBreakdown[] = [];
      
      if (userPayment.cycle2) {
        dailyBreakdown.push({
          date: 'Cycle 2 (Jan 7-23)',
          work_type: userPayment.program_type,
          days_worked: userPayment.cycle2.days_present,
          base_rate: Math.round(userPayment.cycle2.base_pay / Math.max(userPayment.cycle2.days_present, 1)),
          quality_score: userPayment.cycle2.quality_percentage,
          quality_bonus: userPayment.cycle2.quality_pay,
          earnings: userPayment.cycle2.total_earned
        });
      }
      
      if (userPayment.cycle3) {
        dailyBreakdown.push({
          date: 'Cycle 3 (Jan 26-Feb 6)',
          work_type: userPayment.program_type,
          days_worked: userPayment.cycle3.days_present,
          base_rate: Math.round(userPayment.cycle3.base_pay / Math.max(userPayment.cycle3.days_present, 1)),
          quality_score: userPayment.cycle3.quality_percentage,
          quality_bonus: userPayment.cycle3.quality_pay,
          earnings: userPayment.cycle3.total_earned
        });
      }

      return NextResponse.json({
        period: paymentData.period_displayed,
        total_earnings: userPayment.total_payment,
        total_days_worked: userPayment.total_days,
        overall_quality_score: userPayment.overall_quality_percentage,
        daily_breakdown: dailyBreakdown,
        payment_formula: {
          base_rate_per_day: 'KES 760',
          quality_tiers: {
            excellent: '20% bonus (90%+ quality)',
            good: '15% bonus (75-89% quality)',
            fair: '10% bonus (60-74% quality)',
            poor: '0% bonus (<60% quality)'
          }
        }
      });

    } catch (fileError) {
      console.error('Error reading DPW payment data:', fileError);
      return NextResponse.json({
        message: 'DPW payment data not available',
        period: 'Feb 7-6, 2025',
        total_earnings: 0,
        daily_breakdown: []
      });
    }

  } catch (error) {
    console.error('Error fetching DPW payment breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
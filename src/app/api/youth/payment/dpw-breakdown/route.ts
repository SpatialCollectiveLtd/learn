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

interface CycleBreakdown {
  cycle: string;
  period: string;
  work_type: string;
  days_worked: number;
  base_pay: number;
  quality_score: number;
  quality_bonus: number;
  total_earnings: number;
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

      // Create cycle breakdown from cycle data
      const cycleBreakdown: CycleBreakdown[] = [];
      
      if (userPayment.cycle2) {
        // Adjust quality score to be more representative (minimum 60% for participants)
        const adjustedQuality = Math.max(userPayment.cycle2.quality_percentage, 60);
        
        cycleBreakdown.push({
          cycle: 'Cycle 2',
          period: 'Jan 7-23, 2026',
          work_type: userPayment.program_type,
          days_worked: userPayment.cycle2.days_present,
          base_pay: userPayment.cycle2.base_pay,
          quality_score: adjustedQuality,
          quality_bonus: userPayment.cycle2.quality_pay,
          total_earnings: userPayment.cycle2.total_earned
        });
      }
      
      if (userPayment.cycle3) {
        // Adjust quality score to be more representative (minimum 60% for participants)
        const adjustedQuality = Math.max(userPayment.cycle3.quality_percentage, 60);
        
        cycleBreakdown.push({
          cycle: 'Cycle 3', 
          period: 'Jan 26-Feb 6, 2026',
          work_type: userPayment.program_type,
          days_worked: userPayment.cycle3.days_present,
          base_pay: userPayment.cycle3.base_pay,
          quality_score: adjustedQuality,
          quality_bonus: userPayment.cycle3.quality_pay,
          total_earnings: userPayment.cycle3.total_earned
        });
      }

      // Calculate overall adjusted quality score
      const totalBasePay = (userPayment.cycle2?.base_pay || 0) + (userPayment.cycle3?.base_pay || 0);
      const totalQualityPay = (userPayment.cycle2?.quality_pay || 0) + (userPayment.cycle3?.quality_pay || 0);
      const overallQuality = totalBasePay > 0 ? Math.max(Math.round((totalQualityPay / totalBasePay) * 100), 60) : 60;

      return NextResponse.json({
        period: 'Jan 7 - Feb 6, 2026',
        total_earnings: userPayment.total_payment,
        total_days_worked: userPayment.total_days,
        overall_quality_score: overallQuality,
        cycle_breakdown: cycleBreakdown,
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
        period: 'Jan 7 - Feb 6, 2026',
        total_earnings: 0,
        cycle_breakdown: []
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
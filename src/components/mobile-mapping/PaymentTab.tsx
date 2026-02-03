'use client';

import { useEffect, useState } from 'react';
import { 
  Wallet, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';

interface DailyBreakdown {
  date: string;
  pois_submitted: number;
  quality_score: number;
  base_pay: number;
  quality_bonus: number;
  earnings: number;
}

interface PaymentFormula {
  base_pay: number;
  quality_bonus_tiers: {
    excellent: { min: number; rate: number; amount: number };
    good: { min: number; rate: number; amount: number };
    fair: { min: number; rate: number; amount: number };
  };
  daily_target_pois: number;
}

interface PaymentData {
  youth_id: string;
  settlement: string;
  total_earnings: number;
  work_days_completed: number;
  daily_breakdown: DailyBreakdown[];
  payment_formula: PaymentFormula;
  message?: string;
  last_updated: string;
  sync_status: string;
}

export default function PaymentTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/youth/payment/breakdown', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load payment data');
      }
    } catch (err: any) {
      console.error('Payment fetch error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPaymentData();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getQualityTier = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-success' };
    if (score >= 70) return { label: 'Good', color: 'text-info' };
    if (score >= 60) return { label: 'Fair', color: 'text-warning' };
    return { label: 'Needs Improvement', color: 'text-error' };
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-subtle text-sm">Loading payment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Error Loading Payment Data</p>
            <p className="text-xs text-foreground-muted">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-primary hover:text-primary-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground-subtle">No payment data available</p>
      </div>
    );
  }

  const hasWorkData = paymentData.work_days_completed > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Payment Breakdown</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Last Updated */}
      {paymentData.last_updated && (
        <div className="flex items-center gap-2 text-xs text-foreground-subtle">
          <Info className="w-3 h-3" />
          <span>
            Updated {new Date(paymentData.last_updated).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      )}

      {/* Total Earnings Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-primary/30 rounded-xl p-6 text-center">
        <p className="text-foreground-subtle text-sm mb-2">Total Earnings</p>
        <div className="text-4xl font-heading font-bold text-white mb-1">
          {formatCurrency(paymentData.total_earnings)}
        </div>
        <p className="text-foreground-subtle text-xs">
          {paymentData.work_days_completed} work {paymentData.work_days_completed === 1 ? 'day' : 'days'} completed
        </p>
      </div>

      {/* No Work Data Message */}
      {!hasWorkData && paymentData.message && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white mb-2">{paymentData.message}</p>
              
              {/* Payment Formula */}
              {paymentData.payment_formula && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground-subtle">What You Can Earn:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-subtle">Base Pay (per day)</span>
                      <span className="text-white font-semibold">{formatCurrency(paymentData.payment_formula.base_pay)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-subtle">Quality Bonus (90%+)</span>
                      <span className="text-success font-semibold">+{formatCurrency(paymentData.payment_formula.quality_bonus_tiers.excellent.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-subtle">Quality Bonus (70-89%)</span>
                      <span className="text-info font-semibold">+{formatCurrency(paymentData.payment_formula.quality_bonus_tiers.good.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-subtle">Quality Bonus (60-69%)</span>
                      <span className="text-warning font-semibold">+{formatCurrency(paymentData.payment_formula.quality_bonus_tiers.fair.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground-subtle">Max Earnings (per day)</span>
                      <span className="text-primary font-bold">
                        {formatCurrency(paymentData.payment_formula.base_pay + paymentData.payment_formula.quality_bonus_tiers.excellent.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {hasWorkData && paymentData.daily_breakdown && paymentData.daily_breakdown.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-subheading font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Daily Breakdown
          </h3>
          
          <div className="space-y-2">
            {paymentData.daily_breakdown.map((day, index) => {
              const qualityTier = getQualityTier(day.quality_score);
              return (
                <div
                  key={index}
                  className="bg-background-elevated border border-border rounded-lg p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm font-semibold text-white">{formatDate(day.date)}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{formatCurrency(day.earnings)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-foreground-subtle">POIs Submitted</span>
                      <p className="text-white font-semibold">{day.pois_submitted}</p>
                    </div>
                    <div>
                      <span className="text-foreground-subtle">Quality Score</span>
                      <p className={`font-semibold ${qualityTier.color}`}>
                        {day.quality_score.toFixed(1)}% • {qualityTier.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-foreground-subtle">Base Pay</span>
                    <span className="text-white">{formatCurrency(day.base_pay)}</span>
                  </div>
                  {day.quality_bonus > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-foreground-subtle">Quality Bonus</span>
                      <span className="text-success font-semibold">+{formatCurrency(day.quality_bonus)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { 
  Wallet, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface DailyBreakdown {
  date: string;
  pois_submitted?: number;
  work_type?: string;
  days_worked?: number;
  quality_score: number;
  base_pay?: number;
  base_rate?: number;
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
  work_days_completed?: number;
  total_days_worked?: number;
  daily_breakdown: DailyBreakdown[];
  payment_formula?: PaymentFormula;
  period?: string;
  overall_quality_score?: number;
  message?: string;
  last_updated?: string;
  sync_status?: string;
}

export default function PaymentTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDPWData, setShowDPWData] = useState(true); // Default to DPW data

  useEffect(() => {
    fetchPaymentData();
  }, [showDPWData]);

  const fetchPaymentData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Choose endpoint based on toggle
      const endpoint = showDPWData 
        ? '/api/youth/payment/dpw-breakdown' 
        : '/api/youth/payment/breakdown';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentData(result);
      } else {
        setError(result.error?.message || result.message || 'Failed to load payment data');
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

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00 KES';
    }
    return `${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KES`;
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Invalid date';
    }
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

  const hasWorkData = (paymentData?.work_days_completed || paymentData?.total_days_worked || 0) > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header with Toggle and Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Payment Breakdown</h2>
        <div className="flex items-center gap-3">
          {/* DPW Data Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-subtle">Regular</span>
            <button
              onClick={() => setShowDPWData(!showDPWData)}
              className="flex-shrink-0"
            >
              {showDPWData ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-foreground-muted" />
              )}
            </button>
            <span className="text-xs text-foreground-subtle">DPW</span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Display for DPW Data */}
      {showDPWData && paymentData?.period && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-white">Payment Period: {paymentData.period}</span>
          </div>
          {paymentData.overall_quality_score !== undefined && (
            <p className="text-xs text-foreground-subtle mt-1">
              Overall Quality Score: <span className="text-white font-semibold">{paymentData.overall_quality_score}%</span>
            </p>
          )}
        </div>
      )}

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
          {(paymentData.work_days_completed || paymentData.total_days_worked || 0)} work {(paymentData.work_days_completed || paymentData.total_days_worked || 0) === 1 ? 'day' : 'days'} completed
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
                    {/* Show POIs for regular data, Work Type for DPW data */}
                    {day.pois_submitted !== undefined ? (
                      <div>
                        <span className="text-foreground-subtle">POIs Submitted</span>
                        <p className="text-white font-semibold">{day.pois_submitted}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-foreground-subtle">Work Type</span>
                        <p className="text-white font-semibold">{day.work_type || 'DPW'}</p>
                      </div>
                    )}
                    
                    {/* Days Worked for DPW data */}
                    {day.days_worked !== undefined && (
                      <div>
                        <span className="text-foreground-subtle">Days Worked</span>
                        <p className="text-white font-semibold">{day.days_worked}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-foreground-subtle">Quality Score</span>
                      <p className={`font-semibold ${qualityTier.color}`}>
                        {(day?.quality_score !== undefined && day?.quality_score !== null && !isNaN(day.quality_score)) 
                          ? day.quality_score.toFixed(1) 
                          : '0.0'}% • {qualityTier.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                    <span className="text-foreground-subtle">
                      {day.base_pay !== undefined ? 'Base Pay' : 'Base Rate'}
                    </span>
                    <span className="text-white">
                      {day.base_pay !== undefined 
                        ? formatCurrency(day.base_pay) 
                        : `${day.base_rate ? formatCurrency(day.base_rate) : 'N/A'} per day`
                      }
                    </span>
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

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Target, AlertCircle } from 'lucide-react';

interface ContractProgress {
  days_worked: number;
  total_days: number;
  days_remaining: number;
  start_date: string | null;
}

interface QualityMetrics {
  avg_quality_percentage: number | null;
  quality_rating: string | null;
  days_meeting_target: number;
  days_below_target: number;
  total_evaluated_days: number;
}

interface PerformanceData {
  contract_progress: ContractProgress | null;
  quality_metrics: QualityMetrics | null;
  total_earnings_kes: number;
  avg_daily_earnings_kes: number;
  best_day_earnings_kes: number;
}

export default function PerformanceTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { setError('Not authenticated'); setLoading(false); return; }
    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { setError('Session error'); setLoading(false); return; }

    fetch(`/api/users/${user.userId}/performance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error?.message || 'Failed to load performance');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" /></div>;

  if (error) return (
    <div className="p-6">
      <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#dc2626]">{error}</p>
      </div>
    </div>
  );

  const cp = data?.contract_progress;
  const qm = data?.quality_metrics;
  const targetMet = qm ? Math.round((qm.days_meeting_target / Math.max(1, qm.total_evaluated_days)) * 100) : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Earnings overview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Earned', value: `KES ${(data?.total_earnings_kes ?? 0).toLocaleString()}` },
          { label: 'Avg/Day', value: `KES ${Math.round(data?.avg_daily_earnings_kes ?? 0).toLocaleString()}` },
          { label: 'Best Day', value: `KES ${Math.round(data?.best_day_earnings_kes ?? 0).toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-black border border-[#2a2a2a] rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xs font-bold text-white leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Work period progress */}
      {cp && (
        <div className="bg-black border border-[#2a2a2a] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#737373] text-sm">Work Period</span>
            <span className="text-[#dc2626] font-semibold text-sm">{cp.days_worked} / {cp.total_days} days</span>
          </div>
          <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full bg-[#dc2626] rounded-full transition-all" style={{ width: `${Math.round((cp.days_worked / cp.total_days) * 100)}%` }} />
          </div>
          <p className="text-xs text-[#737373] mt-1.5">{cp.days_remaining} days remaining</p>
        </div>
      )}

      {/* Quality metrics */}
      {qm && (
        <div className="bg-black border border-[#2a2a2a] rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#dc2626]" />
            Quality Metrics
          </p>
          {[
            { label: 'Avg Quality', value: qm.avg_quality_percentage != null ? `${qm.avg_quality_percentage.toFixed(1)}%` : '—' },
            { label: 'Rating', value: qm.quality_rating ?? '—' },
            { label: 'Target Met', value: `${targetMet}% of days` },
            { label: 'Days Meeting Target', value: `${qm.days_meeting_target} / ${qm.total_evaluated_days}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-[#737373]">{label}</span>
              <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {!cp && !qm && (
        <div className="text-center py-8">
          <Target className="w-8 h-8 text-[#737373] mx-auto mb-2" />
          <p className="text-[#737373] text-sm">No performance data yet.</p>
        </div>
      )}
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';

interface DailyRecord {
  date: string;
  module: string;
  total_pay_kes: number;
  base_pay_kes: number;
  bonus_pay_kes: number;
  volume: number;
  volume_unit: string;
  quality_percentage: number | null;
  attended: boolean;
  earning_status: string;
  pay_note: string | null;
}

interface PaySummary {
  total_earnings_kes: number;
  total_base_pay_kes: number;
  total_bonus_pay_kes: number;
  days_with_earnings: number;
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export default function PaymentTab() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PaySummary | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { setError('Not authenticated'); setLoading(false); return; }
    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { setError('Session error'); setLoading(false); return; }

    fetch(`/api/users/${user.userId}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.data.summary);
          setRecords(data.data.daily_records ?? []);
        } else {
          setError(data.error?.message || 'Failed to load payments');
        }
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

  return (
    <div className="p-4 space-y-4">
      {/* Summary chips */}
      {summary && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Total', value: `KES ${summary.total_earnings_kes.toLocaleString()}`, hi: true },
            { label: 'Base', value: `KES ${summary.total_base_pay_kes.toLocaleString()}`, hi: false },
            { label: 'Bonus', value: `KES ${summary.total_bonus_pay_kes.toLocaleString()}`, hi: false },
            { label: 'Earning Days', value: String(summary.days_with_earnings), hi: false },
          ].map(({ label, value, hi }) => (
            <div key={label} className={`flex-shrink-0 border rounded-xl px-3 py-2 ${hi ? 'bg-[#dc2626]/10 border-[#dc2626]/30' : 'bg-black border-[#2a2a2a]'}`}>
              <p className="text-[10px] text-[#737373] uppercase tracking-wider whitespace-nowrap">{label}</p>
              <p className={`text-sm font-bold whitespace-nowrap ${hi ? 'text-[#dc2626]' : 'text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <p className="text-center text-[#737373] py-8 text-sm">No payment records yet.</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const key = `${r.date}-${r.module}`;
            const open = expanded === key;
            const earned = r.earning_status === 'earned';
            return (
              <div key={key} className="bg-black border border-[#2a2a2a] rounded-xl overflow-hidden">
                <button className="w-full flex items-center gap-3 p-3 text-left active:bg-white/5" onClick={() => setExpanded(open ? null : key)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">{fmt(r.date)}</p>
                    <p className="text-[#737373] text-xs capitalize">{r.module.replace(/_/g, ' ')}</p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${earned ? 'text-green-400' : 'text-[#737373]'}`}>
                    {earned ? `KES ${r.total_pay_kes.toLocaleString()}` : '—'}
                  </p>
                  <ChevronRight className={`w-4 h-4 text-[#737373] flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-2 border-t border-[#1a1a1a] space-y-1.5 text-sm">
                    {[
                      { l: 'Volume', v: `${r.volume} ${r.volume_unit}` },
                      { l: 'Quality', v: r.quality_percentage != null ? `${r.quality_percentage.toFixed(1)}%` : '—' },
                      { l: 'Base Pay', v: `KES ${r.base_pay_kes.toLocaleString()}` },
                      { l: 'Bonus', v: `KES ${r.bonus_pay_kes.toLocaleString()}` },
                      { l: 'Attended', v: r.attended ? 'Yes' : 'No' },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-[#737373]">{l}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                    {r.pay_note && <p className="text-[#a3a3a3] text-xs pt-1 italic">{r.pay_note}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
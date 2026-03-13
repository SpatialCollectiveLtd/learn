'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, AlertCircle, Flag, X, ChevronDown, ChevronRight } from 'lucide-react';

interface DailyRecord {
  date: string;
  module: string;
  volume: number;
  volume_unit: string;
  quality_percentage: number | null;
  base_pay_kes: number;
  bonus_pay_kes: number;
  total_pay_kes: number;
  attended: boolean;
  day_type: string;
  earning_status: string;
  pay_note: string | null;
  finalized: boolean;
}

interface PaymentsData {
  summary: {
    total_earnings_kes: number;
    total_base_pay_kes: number;
    total_bonus_pay_kes: number;
    days_with_earnings: number;
  };
  modules_active: string[];
  daily_records: DailyRecord[];
  sync_info: { data_note: string | null } | null;
}

interface Dispute {
  id: number;
  dispute_date: string;
  module: string | null;
  issue_type: string;
  description: string | null;
  expected_amount_kes: number | null;
  reported_amount_kes: number | null;
  status: 'open' | 'resolved' | 'rejected';
  resolution_note: string | null;
  created_at: string;
}

const ISSUE_TYPES: Record<string, string> = {
  missed_attendance: 'Missed Attendance',
  wrong_volume: 'Wrong Volume',
  missing_bonus: 'Missing Bonus',
  wrong_module: 'Wrong Module',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  rejected: 'bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20',
};

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentsData | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showDisputes, setShowDisputes] = useState(false);

  // Dispute modal state
  const [modalRecord, setModalRecord] = useState<DailyRecord | null>(null);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const disputedDates = new Set(disputes.filter((d) => d.status === 'open').map((d) => d.dispute_date));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.replace('/'); return; }

    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { router.replace('/'); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`/api/users/${user.userId}/payments`, { headers }).then((r) => r.json()),
      fetch('/api/disputes', { headers }).then((r) => r.json()),
    ]).then(([payRes, dispRes]) => {
      if (payRes.status === 'fulfilled' && payRes.value.success) {
        setPayments(payRes.value.data);
      } else {
        setError('Unable to load payment data. DPW App may be unavailable.');
      }
      if (dispRes.status === 'fulfilled' && dispRes.value.success) {
        setDisputes(dispRes.value.data);
      }
      setLoading(false);
    });
  }, [router]);

  const openModal = (record: DailyRecord) => {
    setModalRecord(record);
    setIssueType('');
    setDescription('');
    setExpectedAmount(String(record.total_pay_kes));
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const closeModal = () => setModalRecord(null);

  const submitDispute = async () => {
    if (!modalRecord || !issueType) return;
    setSubmitting(true);
    setSubmitError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          dispute_date: modalRecord.date,
          module: modalRecord.module,
          issue_type: issueType,
          description: description.trim() || null,
          reported_amount_kes: modalRecord.total_pay_kes,
          expected_amount_kes: expectedAmount ? parseFloat(expectedAmount) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes((prev) => [data.data, ...prev]);
        setSubmitSuccess(true);
        setTimeout(closeModal, 1500);
      } else {
        setSubmitError(data.error?.message || 'Failed to submit dispute.');
      }
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="bg-black px-4 pt-8 pb-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white font-heading mb-1 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[#dc2626]" />
          Payments
        </h1>
        <p className="text-[#737373] text-sm mb-6">Daily earnings breakdown</p>

        {error && (
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        )}

        {payments && (
          <>
            {/* Sync note */}
            {payments.sync_info?.data_note && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">{payments.sync_info.data_note}</p>
              </div>
            )}

            {/* Summary chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
              {[
                { label: 'Total', value: `KES ${payments.summary.total_earnings_kes.toLocaleString()}`, highlight: true },
                { label: 'Base', value: `KES ${payments.summary.total_base_pay_kes.toLocaleString()}`, highlight: false },
                { label: 'Bonus', value: `KES ${payments.summary.total_bonus_pay_kes.toLocaleString()}`, highlight: false },
                { label: 'Earning Days', value: String(payments.summary.days_with_earnings), highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={`flex-shrink-0 border rounded-xl px-4 py-2.5 ${highlight ? 'bg-[#dc2626]/10 border-[#dc2626]/30' : 'bg-[#111111] border-[#262626]'}`}>
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider whitespace-nowrap">{label}</p>
                  <p className={`text-sm font-bold whitespace-nowrap ${highlight ? 'text-[#dc2626]' : 'text-white'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Daily records — mobile card list */}
            <div className="mb-6">
              <p className="text-[#737373] text-xs uppercase tracking-wider mb-3">
                {payments.daily_records.length} Days Recorded
              </p>
              {payments.daily_records.length === 0 ? (
                <div className="bg-[#111111] border border-[#262626] rounded-2xl p-8 text-center">
                  <p className="text-[#737373] text-sm">No payment records yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.daily_records.map((r) => {
                    const key = `${r.date}-${r.module}`;
                    const expanded = expandedRecord === key;
                    const alreadyDisputed = disputedDates.has(r.date);
                    const earned = r.earning_status === 'earned';

                    return (
                      <div key={key} className="bg-[#111111] border border-[#262626] rounded-2xl overflow-hidden">
                        {/* Collapsed row */}
                        <button
                          className="w-full flex items-center gap-3 p-4 text-left active:bg-white/5 transition-colors"
                          onClick={() => setExpandedRecord(expanded ? null : key)}
                        >
                          {/* Date + module */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm">{fmt(r.date)}</p>
                            <p className="text-[#737373] text-xs capitalize">{r.module.replace(/_/g, ' ')}</p>
                          </div>
                          {/* Pay amount */}
                          <div className="text-right flex-shrink-0">
                            <p className={`font-bold text-base ${earned ? 'text-green-400' : 'text-[#737373]'}`}>
                              {earned ? `KES ${r.total_pay_kes.toLocaleString()}` : '—'}
                            </p>
                            {!earned && r.pay_note && (
                              <p className="text-[#737373] text-[10px] max-w-[120px] truncate">{r.pay_note}</p>
                            )}
                          </div>
                          <ChevronRight className={`w-4 h-4 text-[#737373] flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Expanded details */}
                        {expanded && (
                          <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3 space-y-2">
                            {[
                              { label: 'Volume', value: `${r.volume} ${r.volume_unit}` },
                              { label: 'Quality', value: r.quality_percentage != null ? `${r.quality_percentage.toFixed(1)}%` : '—' },
                              { label: 'Base Pay', value: `KES ${r.base_pay_kes.toLocaleString()}` },
                              { label: 'Bonus', value: `KES ${r.bonus_pay_kes.toLocaleString()}` },
                              { label: 'Attended', value: r.attended ? 'Yes' : 'No' },
                              { label: 'Day Type', value: r.day_type },
                              { label: 'Status', value: r.finalized ? 'Finalized' : 'Pending' },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex justify-between text-sm">
                                <span className="text-[#737373]">{label}</span>
                                <span className="text-white font-medium">{value}</span>
                              </div>
                            ))}
                            {r.pay_note && (
                              <div className="bg-black/40 rounded-lg p-2.5 mt-1">
                                <p className="text-[#a3a3a3] text-xs">{r.pay_note}</p>
                              </div>
                            )}
                            {/* Dispute button */}
                            <div className="pt-1">
                              {alreadyDisputed ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                  Dispute submitted
                                </span>
                              ) : (
                                <button
                                  onClick={() => openModal(r)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#737373] hover:text-white border border-[#262626] hover:border-[#404040] rounded-full transition-colors"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                  Report discrepancy
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* My disputes — collapsible */}
        <div className="bg-[#111111] border border-[#262626] rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left active:bg-white/5 transition-colors"
            onClick={() => setShowDisputes(!showDisputes)}
          >
            <p className="font-semibold text-white text-sm">My Disputes ({disputes.length})</p>
            <ChevronDown className={`w-4 h-4 text-[#737373] transition-transform ${showDisputes ? 'rotate-180' : ''}`} />
          </button>
          {showDisputes && (
            <div className="border-t border-[#262626]">
              {disputes.length === 0 ? (
                <p className="text-center text-[#737373] py-8 text-sm">No disputes filed yet.</p>
              ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {disputes.map((d) => (
                    <div key={d.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-white text-sm font-medium">{fmt(d.dispute_date)}</span>
                          {d.module && <span className="text-xs text-[#737373] capitalize">{d.module.replace(/_/g, ' ')}</span>}
                        </div>
                        <p className="text-xs text-[#a3a3a3]">{ISSUE_TYPES[d.issue_type] ?? d.issue_type}</p>
                        {d.description && <p className="text-xs text-[#737373] mt-0.5 truncate">{d.description}</p>}
                        {d.resolution_note && <p className="text-xs text-[#a3a3a3] mt-1 italic">{d.resolution_note}</p>}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_STYLES[d.status] ?? ''}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report dispute modal */}
      {modalRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4">
          <div className="bg-[#111111] border border-[#262626] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h3 className="font-bold text-white">Report Discrepancy</h3>
              <button onClick={closeModal} className="text-[#737373] hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-black/50 rounded-lg p-3 text-sm">
                <p className="text-[#a3a3a3]">
                  <span className="text-white font-medium">{fmt(modalRecord.date)}</span>
                  {' — '}{modalRecord.module.replace(/_/g, ' ')}
                  {' — '}Recorded: <span className="text-white">KES {modalRecord.total_pay_kes.toLocaleString()}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">Issue Type <span className="text-[#dc2626]">*</span></label>
                <div className="relative">
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] pr-10 text-base"
                  >
                    <option value="">Select issue…</option>
                    {Object.entries(ISSUE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">Expected Amount (KES)</label>
                <input type="number" min="0" step="0.01" value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] text-base"
                  placeholder="What you expected to earn" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none text-base"
                  placeholder="Explain the issue…" />
              </div>

              {submitError && <div className="p-3 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg"><p className="text-sm text-[#dc2626]">{submitError}</p></div>}
              {submitSuccess && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"><p className="text-sm text-green-400">Dispute submitted!</p></div>}
            </div>

            <div className="flex gap-3 p-5 border-t border-[#262626]">
              <button onClick={closeModal} className="flex-1 px-4 py-3 border border-[#2a2a2a] text-[#a3a3a3] hover:text-white rounded-xl transition-colors text-sm">Cancel</button>
              <button onClick={submitDispute} disabled={!issueType || submitting || submitSuccess}
                className="flex-1 px-4 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

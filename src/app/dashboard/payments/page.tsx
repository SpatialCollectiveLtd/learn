'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, AlertCircle, Flag, X, ChevronDown } from 'lucide-react';

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

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentsData | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dispute modal state
  const [modalRecord, setModalRecord] = useState<DailyRecord | null>(null);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Track which dates already have open disputes
  const disputedDates = new Set(disputes.filter((d) => d.status === 'open').map((d) => d.dispute_date));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.push('/'); return; }

    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { router.push('/'); return; }

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[#a3a3a3] hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Wallet className="w-6 h-6 text-[#dc2626]" />
          <h1 className="text-2xl font-bold text-white">Payment Breakdown</h1>
        </div>

        {error && (
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#dc2626] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        )}

        {payments && (
          <>
            {/* Sync info banner */}
            {payments.sync_info?.data_note && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-400">{payments.sync_info.data_note}</p>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              {[
                { label: 'Total Earned', value: `KES ${payments.summary.total_earnings_kes.toLocaleString()}`, color: 'text-white' },
                { label: 'Base Pay', value: `KES ${payments.summary.total_base_pay_kes.toLocaleString()}`, color: 'text-white' },
                { label: 'Bonus Pay', value: `KES ${payments.summary.total_bonus_pay_kes.toLocaleString()}`, color: 'text-green-400' },
                { label: 'Days Earned', value: String(payments.summary.days_with_earnings), color: 'text-white' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4">
                  <p className="text-xs text-[#737373] uppercase mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Daily records table */}
            {payments.daily_records.length > 0 ? (
              <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden mb-8">
                <div className="p-4 border-b border-[#262626] flex items-center justify-between">
                  <h2 className="font-semibold text-white">Daily Records ({payments.daily_records.length})</h2>
                  <p className="text-xs text-[#737373]">Click <Flag className="w-3 h-3 inline" /> to report a discrepancy</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#262626]">
                        {['Date', 'Module', 'Output', 'Quality', 'Base', 'Bonus', 'Total', 'Note', ''].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs text-[#737373] uppercase font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.daily_records.map((r, i) => {
                        const alreadyDisputed = disputedDates.has(r.date);
                        return (
                          <tr key={i} className="border-b border-[#262626]/50 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-[#a3a3a3] whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                            <td className="px-4 py-2.5 text-white capitalize whitespace-nowrap">{r.module.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3] whitespace-nowrap">{r.volume} {r.volume_unit}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3] whitespace-nowrap">
                              {r.quality_percentage != null ? `${r.quality_percentage.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-[#a3a3a3] whitespace-nowrap">KES {r.base_pay_kes.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3] whitespace-nowrap">KES {r.bonus_pay_kes.toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                              <span className={r.earning_status === 'earned' ? 'text-green-400' : 'text-[#737373]'}>
                                KES {r.total_pay_kes.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[#737373] text-xs max-w-[160px] truncate">
                              {r.pay_note || '—'}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {alreadyDisputed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                  Disputed
                                </span>
                              ) : (
                                <button
                                  onClick={() => openModal(r)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#737373] hover:text-white hover:bg-white/10 rounded transition-colors"
                                  title="Report discrepancy"
                                >
                                  <Flag className="w-3 h-3" />
                                  Report
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-8 text-center mb-8">
                <p className="text-[#737373]">No payment records found for the selected period.</p>
              </div>
            )}
          </>
        )}

        {/* My disputes */}
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#262626]">
            <h2 className="font-semibold text-white">My Disputes ({disputes.length})</h2>
          </div>
          {disputes.length > 0 ? (
            <div className="divide-y divide-[#262626]">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">
                        {new Date(d.dispute_date).toLocaleDateString()}
                      </span>
                      {d.module && (
                        <span className="text-xs text-[#737373] capitalize">{d.module.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#a3a3a3]">{ISSUE_TYPES[d.issue_type] ?? d.issue_type}</p>
                    {d.description && <p className="text-xs text-[#737373] mt-1 truncate">{d.description}</p>}
                    {d.resolution_note && (
                      <p className="text-xs text-[#a3a3a3] mt-1 italic">{d.resolution_note}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLES[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#737373] py-8 text-sm">No disputes filed yet.</p>
          )}
        </div>
      </div>

      {/* Report dispute modal */}
      {modalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h3 className="font-bold text-white">Report Discrepancy</h3>
              <button onClick={closeModal} className="text-[#737373] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-black/50 rounded-lg p-3 text-sm">
                <p className="text-[#a3a3a3]">
                  <span className="text-white font-medium">{new Date(modalRecord.date).toLocaleDateString()}</span>
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
                    className="w-full appearance-none px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] pr-10"
                    required
                  >
                    <option value="">Select issue...</option>
                    {Object.entries(ISSUE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">
                  Expected Amount (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                  placeholder="What you expected to earn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#e5e5e5] mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-black border border-[#2a2a2a] rounded-lg text-white placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none"
                  placeholder="Explain the issue..."
                />
              </div>

              {submitError && (
                <div className="p-3 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg">
                  <p className="text-sm text-[#dc2626]">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-400">Dispute submitted successfully!</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-[#262626]">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-[#2a2a2a] text-[#a3a3a3] hover:text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={!issueType || submitting || submitSuccess}
                className="flex-1 px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

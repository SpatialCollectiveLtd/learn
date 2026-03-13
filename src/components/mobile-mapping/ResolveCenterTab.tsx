'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Plus, X, AlertCircle } from 'lucide-react';

interface Dispute {
  id: number;
  dispute_date: string;
  module: string | null;
  issue_type: string;
  description: string | null;
  expected_amount_kes: number | null;
  status: 'open' | 'resolved' | 'rejected';
  resolution_note: string | null;
}

const ISSUE_TYPES: Record<string, string> = {
  missed_attendance: 'Missed Attendance',
  wrong_volume: 'Wrong Volume',
  missing_bonus: 'Missing Bonus',
  wrong_module: 'Wrong Module',
  other: 'Other',
};

const STATUS_COLOR: Record<string, string> = {
  open: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  rejected: 'text-[#dc2626] bg-[#dc2626]/10 border-[#dc2626]/20',
};

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function ResolveCenterTab() {
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setLoading(false); return; }
    fetch('/api/disputes', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => { if (res.success) setDisputes(res.data); else setError(res.error?.message || 'Failed'); })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!date || !issueType) { setSubmitError('Date and issue type are required.'); return; }
    setSubmitting(true); setSubmitError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dispute_date: date, issue_type: issueType, description: description.trim() || null, expected_amount_kes: expectedAmount ? parseFloat(expectedAmount) : null }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes((p) => [data.data, ...p]);
        setSubmitSuccess(true);
        setTimeout(() => { setShowForm(false); setSubmitSuccess(false); setDate(''); setIssueType(''); setDescription(''); setExpectedAmount(''); }, 1500);
      } else { setSubmitError(data.error?.message || 'Failed.'); }
    } catch { setSubmitError('Network error.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" /></div>;

  if (error) return <div className="p-6"><div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4 flex gap-3"><AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" /><p className="text-sm text-[#dc2626]">{error}</p></div></div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">My Disputes ({disputes.length})</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-[#dc2626]/10 border border-[#dc2626]/30 text-[#dc2626] text-xs font-semibold rounded-xl transition-colors">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New Dispute'}
        </button>
      </div>

      {showForm && (
        <div className="bg-black border border-[#2a2a2a] rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs text-[#737373] mb-1">Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]" />
          </div>
          <div>
            <label className="block text-xs text-[#737373] mb-1">Issue Type *</label>
            <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full px-3 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]">
              <option value="">Select issue…</option>
              {Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#737373] mb-1">Expected Amount (KES)</label>
            <input type="number" min="0" value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} className="w-full px-3 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]" placeholder="Optional" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-[#111111] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626] resize-none" placeholder="Explain the issue…" />
          {submitError && <p className="text-xs text-[#dc2626]">{submitError}</p>}
          {submitSuccess && <p className="text-xs text-green-400">Dispute submitted!</p>}
          <button onClick={submit} disabled={!date || !issueType || submitting || submitSuccess} className="w-full py-2.5 bg-[#dc2626] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="text-center py-8"><MessageCircle className="w-8 h-8 text-[#737373] mx-auto mb-2" /><p className="text-[#737373] text-sm">No disputes yet.</p></div>
      ) : (
        <div className="space-y-2">
          {disputes.map((d) => (
            <div key={d.id} className="bg-black border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div><p className="text-white text-sm font-medium">{fmt(d.dispute_date)}</p><p className="text-[#737373] text-xs">{ISSUE_TYPES[d.issue_type] ?? d.issue_type}</p></div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR[d.status] ?? ''}`}>{d.status}</span>
              </div>
              {d.description && <p className="text-[#a3a3a3] text-xs mt-1">{d.description}</p>}
              {d.resolution_note && <p className="text-xs text-[#737373] italic mt-1">{d.resolution_note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

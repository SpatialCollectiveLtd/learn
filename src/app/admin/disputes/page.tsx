'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DisputeRow {
  id: number;
  youth_id: string;
  youth_name: string;
  settlement: string | null;
  dispute_date: string;
  module: string | null;
  issue_type: string;
  description: string | null;
  expected_amount_kes: number | null;
  reported_amount_kes: number | null;
  status: 'open' | 'resolved' | 'rejected';
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

const SETTLEMENTS = ['Kayole Soweto', 'Kariobangi Machakos', 'Mji wa Huruma'];

const ISSUE_LABELS: Record<string, string> = {
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

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('open');
  const [settlementFilter, setSettlementFilter] = useState('');

  const [resolving, setResolving] = useState<{
    id: number;
    action: 'resolved' | 'rejected';
    note: string;
    submitting: boolean;
  } | null>(null);

  const fetchDisputes = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (settlementFilter) params.set('settlement', settlementFilter);

    try {
      const res = await fetch(`/api/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(data.data);
      } else {
        setError(data.error?.message || 'Failed to load disputes');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, settlementFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const openCount = disputes.filter((d) => d.status === 'open').length;

  const handleConfirmResolve = async () => {
    if (!resolving) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setResolving((r) => r && { ...r, submitting: true });

    try {
      const res = await fetch(`/api/disputes/${resolving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: resolving.action, resolution_note: resolving.note }),
      });
      const json = await res.json();
      if (json.success) {
        setDisputes((prev) =>
          prev.map((d) =>
            d.id === resolving.id
              ? { ...d, status: resolving.action, resolution_note: resolving.note || null }
              : d
          )
        );
        setResolving(null);
      } else {
        setResolving((r) => r && { ...r, submitting: false });
      }
    } catch {
      setResolving((r) => r && { ...r, submitting: false });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">Disputes</h1>
        <p className="text-[#a3a3a3]">Payment disputes filed by youth across all settlements</p>
      </div>

      {/* Filter bar */}
      <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-black/50 rounded-lg p-1 border border-[#2a2a2a]">
            {[
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'rejected', label: 'Rejected' },
              { value: '', label: 'All' },
            ].map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setStatusFilter(value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-[#dc2626] text-white'
                    : 'text-[#a3a3a3] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            className="px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
          >
            <option value="">All Settlements</option>
            {SETTLEMENTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {statusFilter === 'open' && openCount > 0 && (
            <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs font-medium text-yellow-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {openCount} open {openCount === 1 ? 'dispute' : 'disputes'}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-12 text-center">
          <Flag className="w-10 h-10 text-[#737373] mx-auto mb-3" />
          <p className="text-[#737373]">No disputes found for the selected filters</p>
        </div>
      ) : (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626]">
                  {['Youth', 'Settlement', 'Date', 'Issue', 'Amounts', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs text-[#737373] uppercase font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <>
                    <tr
                      key={d.id}
                      className="border-b border-[#262626]/50 last:border-0 hover:bg-white/[0.02] align-top"
                    >
                      {/* Youth */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/youth/${d.youth_id}`)}
                          className="text-white font-medium hover:text-[#dc2626] transition-colors text-left"
                        >
                          {d.youth_name}
                        </button>
                        <p className="text-xs text-[#737373] mt-0.5">{d.youth_id}</p>
                      </td>

                      {/* Settlement */}
                      <td className="px-4 py-3 text-[#a3a3a3] whitespace-nowrap">
                        {d.settlement || '—'}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-[#a3a3a3] whitespace-nowrap">
                        {new Date(d.dispute_date).toLocaleDateString()}
                        {d.module && (
                          <p className="text-xs text-[#737373] capitalize mt-0.5">
                            {d.module.replace(/_/g, ' ')}
                          </p>
                        )}
                      </td>

                      {/* Issue */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-white whitespace-nowrap">
                          {ISSUE_LABELS[d.issue_type] ?? d.issue_type}
                        </p>
                        {d.description && (
                          <p className="text-xs text-[#737373] mt-0.5 line-clamp-2">{d.description}</p>
                        )}
                      </td>

                      {/* Amounts */}
                      <td className="px-4 py-3 text-[#a3a3a3] whitespace-nowrap text-xs">
                        {d.expected_amount_kes != null ? (
                          <>
                            <p>Exp: KES {d.expected_amount_kes.toLocaleString()}</p>
                            {d.reported_amount_kes != null && (
                              <p>Got: KES {d.reported_amount_kes.toLocaleString()}</p>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] ?? ''}`}
                        >
                          {d.status}
                        </span>
                        {d.resolved_at && (
                          <p className="text-xs text-[#737373] mt-0.5">
                            {new Date(d.resolved_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {d.status === 'open' ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() =>
                                setResolving({ id: d.id, action: 'resolved', note: '', submitting: false })
                              }
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800/40 rounded-lg text-xs font-medium transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Resolve
                            </button>
                            <button
                              onClick={() =>
                                setResolving({ id: d.id, action: 'rejected', note: '', submitting: false })
                              }
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#dc2626]/10 hover:bg-[#dc2626]/20 text-[#dc2626] border border-[#dc2626]/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : d.resolution_note ? (
                          <p className="text-xs text-[#737373] italic max-w-[160px] line-clamp-2">
                            {d.resolution_note}
                          </p>
                        ) : (
                          <span className="text-xs text-[#525252]">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Inline resolve/reject form row */}
                    {resolving?.id === d.id && (
                      <tr key={`${d.id}-form`} className="border-b border-[#262626]/50 bg-[#171717]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[240px]">
                              <p className="text-xs text-[#737373] mb-1">
                                {resolving.action === 'resolved'
                                  ? 'Resolution note (optional)'
                                  : 'Rejection reason (optional)'}
                              </p>
                              <textarea
                                value={resolving.note}
                                onChange={(e) =>
                                  setResolving((r) => r && { ...r, note: e.target.value })
                                }
                                placeholder="Add a note…"
                                rows={2}
                                className="w-full bg-black border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#dc2626] resize-none"
                              />
                            </div>
                            <div className="flex gap-2 pb-0.5">
                              <button
                                onClick={handleConfirmResolve}
                                disabled={resolving.submitting}
                                className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 ${
                                  resolving.action === 'resolved'
                                    ? 'bg-green-700 hover:bg-green-600'
                                    : 'bg-[#dc2626] hover:bg-[#b91c1c]'
                                }`}
                              >
                                {resolving.submitting
                                  ? 'Saving…'
                                  : resolving.action === 'resolved'
                                  ? 'Confirm Resolve'
                                  : 'Confirm Reject'}
                              </button>
                              <button
                                onClick={() => setResolving(null)}
                                className="px-4 py-2 rounded-lg text-xs text-[#737373] hover:text-white border border-[#333] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

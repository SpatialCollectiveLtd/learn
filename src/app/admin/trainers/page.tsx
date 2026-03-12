'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserCheck, KeyRound, ShieldOff, RefreshCw, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Trainer {
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  settlement: string | null;
  is_active: boolean;
  has_password: boolean;
  created_at: string | null;
}

interface PasswordModal {
  trainer: Trainer;
  password: string;
  confirm: string;
  error: string;
  loading: boolean;
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modal, setModal] = useState<PasswordModal | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/trainers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to load trainers');
      setTrainers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const openSetPassword = (trainer: Trainer) => {
    setModal({ trainer, password: '', confirm: '', error: '', loading: false });
  };

  const closeModal = () => setModal(null);

  const submitPassword = async () => {
    if (!modal) return;
    if (modal.password.length < 8) {
      setModal(m => m ? { ...m, error: 'Password must be at least 8 characters' } : null);
      return;
    }
    if (modal.password !== modal.confirm) {
      setModal(m => m ? { ...m, error: 'Passwords do not match' } : null);
      return;
    }

    setModal(m => m ? { ...m, loading: true, error: '' } : null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/trainers/${modal.trainer.staff_id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: modal.password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to set password');
      setTrainers(prev => prev.map(t =>
        t.staff_id === modal.trainer.staff_id ? { ...t, has_password: true } : t
      ));
      closeModal();
      showToast('success', `Password set for ${modal.trainer.full_name}`);
    } catch (err) {
      setModal(m => m ? { ...m, loading: false, error: err instanceof Error ? err.message : 'Error' } : null);
    }
  };

  const revokePassword = async (trainer: Trainer) => {
    if (!confirm(`Revoke Learn login for ${trainer.full_name}? They won't be able to sign in with email until a new password is set.`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/trainers/${trainer.staff_id}/password`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Failed to revoke password');
      setTrainers(prev => prev.map(t =>
        t.staff_id === trainer.staff_id ? { ...t, has_password: false } : t
      ));
      showToast('success', `Login revoked for ${trainer.full_name}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to revoke login');
    }
  };

  const ROLE_BADGE: Record<string, string> = {
    trainer: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
    admin: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700' : 'bg-red-900/90 text-red-200 border border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1F2121] rounded-lg border border-[#262626]">
            <UserCheck className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">Staff & Trainers</h1>
            <p className="text-sm text-[#737373]">Manage Learn platform access for trainers and admins</p>
          </div>
        </div>
        <button
          onClick={fetchTrainers}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-[#1F2121] border border-[#262626] rounded-lg text-sm text-[#a3a3a3] hover:text-white hover:border-[#404040] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Staff', value: trainers.length },
            { label: 'With Learn Login', value: trainers.filter(t => t.has_password).length, color: 'text-green-400' },
            { label: 'No Login Set', value: trainers.filter(t => !t.has_password).length, color: 'text-yellow-400' },
          ].map(card => (
            <div key={card.label} className="bg-[#1F2121] border border-[#262626] rounded-xl px-5 py-4">
              <p className="text-xs text-[#737373] font-medium uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-2xl font-bold font-heading ${card.color ?? 'text-white'}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1F2121] border border-[#262626] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 m-6 p-4 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-12 text-[#737373]">No staff members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-xs text-[#737373] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Settlement</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Learn Login</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {trainers.map(trainer => (
                  <tr key={trainer.staff_id} className="hover:bg-[#171717] transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-white font-medium">{trainer.full_name}</p>
                        <p className="text-xs text-[#525252] font-mono">{trainer.staff_id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{trainer.email || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[trainer.role] ?? 'bg-[#262626] text-[#a3a3a3]'}`}>
                        {trainer.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#a3a3a3] text-sm">{trainer.settlement || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${trainer.is_active ? 'bg-green-900/30 text-green-400' : 'bg-[#262626] text-[#525252]'}`}>
                        {trainer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {trainer.has_password ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Password Set
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-yellow-500 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> No Login
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openSetPassword(trainer)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#2a2a2a] text-white rounded-lg text-xs font-medium transition-colors border border-[#333]"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          {trainer.has_password ? 'Reset' : 'Set'} Password
                        </button>
                        {trainer.has_password && (
                          <button
                            onClick={() => revokePassword(trainer)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#737373] hover:text-red-400 hover:bg-red-900/20 rounded-lg text-xs transition-colors border border-transparent hover:border-red-800/40"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Set Password Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1F2121] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#dc2626]" />
                <h2 className="font-semibold text-white">Set Learn Password</h2>
              </div>
              <button onClick={closeModal} className="text-[#737373] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#171717] rounded-lg">
                <p className="text-sm text-white font-medium">{modal.trainer.full_name}</p>
                <p className="text-xs text-[#737373]">{modal.trainer.email} · {modal.trainer.role}</p>
              </div>

              {modal.error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {modal.error}
                </div>
              )}

              <div>
                <label className="block text-xs text-[#a3a3a3] mb-1.5 font-medium">New Password</label>
                <input
                  type="password"
                  value={modal.password}
                  onChange={e => setModal(m => m ? { ...m, password: e.target.value, error: '' } : null)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#171717] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#dc2626] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#a3a3a3] mb-1.5 font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={modal.confirm}
                  onChange={e => setModal(m => m ? { ...m, confirm: e.target.value, error: '' } : null)}
                  placeholder="Repeat password"
                  className="w-full bg-[#171717] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#dc2626] transition-colors"
                  onKeyDown={e => e.key === 'Enter' && submitPassword()}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-[#333] text-[#a3a3a3] hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPassword}
                  disabled={modal.loading}
                  className="flex-1 py-2.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-sm font-bold transition-colors"
                >
                  {modal.loading ? 'Setting…' : 'Set Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

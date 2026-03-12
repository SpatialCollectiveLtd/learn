'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, ArrowRight } from 'lucide-react';

interface TrainerUser {
  userId: string;
  fullName: string;
  settlement: string | null;
}

interface CohortStats {
  total: number;
  active: number;
}

export default function TrainerOverviewPage() {
  const router = useRouter();
  const [trainer, setTrainer] = useState<TrainerUser | null>(null);
  const [stats, setStats] = useState<CohortStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) return;

    let parsed: TrainerUser;
    try {
      parsed = JSON.parse(userData);
    } catch {
      return;
    }
    setTrainer(parsed);

    const params = new URLSearchParams({ role: 'youth', per_page: '500' });
    if (parsed.settlement) params.set('settlement', parsed.settlement);

    fetch(`/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const users = data.data.users as { is_active: boolean }[];
          setStats({
            total: users.length,
            active: users.filter((u) => u.is_active).length,
          });
        } else {
          setError(data.error?.message || 'Failed to load cohort data');
        }
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">Overview</h1>
        <p className="text-[#a3a3a3]">
          {trainer?.settlement ? `${trainer.settlement} cohort summary` : 'Your cohort summary'}
        </p>
      </div>

      {error && (
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[#262626] rounded mb-4 w-1/2" />
              <div className="h-8 bg-[#262626] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                  <Users className="w-5 h-5 text-[#dc2626]" />
                </div>
                <span className="text-sm text-[#a3a3a3]">Total Youth</span>
              </div>
              <p className="text-4xl font-heading font-bold text-white">{stats.total}</p>
            </div>

            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                  <UserCheck className="w-5 h-5 text-[#dc2626]" />
                </div>
                <span className="text-sm text-[#a3a3a3]">Active</span>
              </div>
              <p className="text-4xl font-heading font-bold text-white">{stats.active}</p>
              <p className="text-sm text-[#737373] mt-1">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of cohort
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/trainer/youth')}
            className="flex items-center gap-3 bg-[#1F2121] border border-[#262626] hover:border-[#dc2626] rounded-2xl p-5 transition-all w-full text-left hover:shadow-lg"
          >
            <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
              <Users className="w-5 h-5 text-[#dc2626]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">View My Youth</p>
              <p className="text-sm text-[#a3a3a3]">Browse your cohort participants</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#737373]" />
          </button>
        </>
      ) : null}
    </div>
  );
}

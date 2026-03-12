'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, BookOpen, MapPin, ArrowRight } from 'lucide-react';

interface Stats {
  total: number;
  active: number;
  inactive: number;
  bySettlement: Record<string, number>;
  byModule: Record<string, number>;
}

const MODULE_LABELS: Record<string, string> = {
  digitization: 'Digitization',
  mobile_mapping: 'Mobile Mapping',
  household_survey: 'Household Survey',
  microtasking: 'Microtasking',
  both: 'Multi-Module',
  unassigned: 'Unassigned',
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
        else setError(data.error?.message || 'Failed to load stats');
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">Overview</h1>
        <p className="text-[#a3a3a3]">Platform summary across all settlements</p>
      </div>

      {error && (
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[#262626] rounded mb-4 w-1/2" />
              <div className="h-8 bg-[#262626] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Top stat cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
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
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
              </p>
            </div>

            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                  <BookOpen className="w-5 h-5 text-[#dc2626]" />
                </div>
                <span className="text-sm text-[#a3a3a3]">Inactive</span>
              </div>
              <p className="text-4xl font-heading font-bold text-white">{stats.inactive}</p>
            </div>
          </div>

          {/* By settlement + by module */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[#dc2626]" />
                <h2 className="text-lg font-bold text-white">By Settlement</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.bySettlement)
                  .sort((a, b) => b[1] - a[1])
                  .map(([settlement, count]) => (
                    <div key={settlement}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#a3a3a3]">{settlement}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                        <div
                          className="bg-[#dc2626] h-1.5 rounded-full"
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#dc2626]" />
                <h2 className="text-lg font-bold text-white">By Module</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.byModule)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mod, count]) => (
                    <div key={mod}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#a3a3a3]">{MODULE_LABELS[mod] || mod}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                        <div
                          className="bg-[#dc2626] h-1.5 rounded-full"
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Quick link to youth list */}
          <button
            onClick={() => router.push('/admin/youth')}
            className="flex items-center gap-3 bg-[#1F2121] border border-[#262626] hover:border-[#dc2626] rounded-2xl p-5 transition-all w-full text-left hover:shadow-lg"
          >
            <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
              <Users className="w-5 h-5 text-[#dc2626]" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">View All Youth</p>
              <p className="text-sm text-[#a3a3a3]">Browse, search and filter all participants</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#737373]" />
          </button>
        </>
      ) : null}
    </div>
  );
}

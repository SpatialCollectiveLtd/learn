'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getStaffSession, type StaffSession } from '@/lib/staff-session';

interface YouthListItem {
  user_id: string;
  full_name: string;
  settlement: string | null;
  module: string | null;
  module_assignment: string | null;
  is_active: boolean;
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const MODULES = [
  { value: 'digitization', label: 'Digitization' },
  { value: 'mobile_mapping', label: 'Mobile Mapping' },
  { value: 'household_survey', label: 'Household Survey' },
  { value: 'microtasking', label: 'Microtasking' },
];

const MODULE_LABELS: Record<string, string> = {
  digitization: 'Digitization',
  mobile_mapping: 'Mobile Mapping',
  household_survey: 'Household Survey',
  microtasking: 'Microtasking',
  both: 'Multi-Module',
};

export default function TrainerYouthPage() {
  const router = useRouter();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [youth, setYouth] = useState<YouthListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainerSettlement, setTrainerSettlement] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const nextSession = getStaffSession();
    if (!nextSession || nextSession.role !== 'trainer') return;
    setSession(nextSession);
    setTrainerSettlement(nextSession.settlement);
  }, []);

  const fetchYouth = useCallback(async () => {
    if (!session) return;

    const settlement = trainerSettlement ?? session.settlement;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ role: 'youth', page: String(page), per_page: '25' });
    if (settlement) params.set('settlement', settlement);
    if (module) params.set('module', module);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/users?${params}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setYouth(data.data.users);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || 'Failed to load youth');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [page, module, search, session, trainerSettlement]);

  useEffect(() => {
    fetchYouth();
  }, [fetchYouth]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-1">My Youth</h1>
        <p className="text-[#a3a3a3]">
          {trainerSettlement ? `${trainerSettlement} participants` : 'Your cohort participants'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4 mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={searchInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearchInput(nextValue);
                  if (!nextValue.trim()) {
                    setPage(1);
                    setSearch('');
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm placeholder-[#737373] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          <select
            value={module}
            onChange={(e) => { setModule(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-black border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#dc2626] min-w-[150px]"
          >
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" />
          </div>
        ) : youth.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 text-[#737373] mx-auto mb-3" />
            <p className="text-[#a3a3a3]">No youth found</p>
            <p className="text-sm text-[#737373] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#262626] md:hidden">
              {youth.map((y) => (
                <button
                  key={y.user_id}
                  onClick={() => router.push(`/trainer/youth/${y.user_id}`)}
                  className="w-full p-4 text-left hover:bg-[#262626] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{y.full_name}</p>
                      <p className="text-sm text-[#a3a3a3] font-mono mt-0.5">{y.user_id}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      y.is_active
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-[#737373]/10 text-[#737373] border border-[#737373]/20'
                    }`}>
                      {y.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 text-xs text-[#a3a3a3]">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[#262626] bg-black/50 capitalize">
                      {y.module ? (MODULE_LABELS[y.module] || y.module) : 'No module'}
                    </span>
                    {y.module === 'digitization' && y.module_assignment && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 capitalize">
                        {y.module_assignment}
                      </span>
                    )}
                    {y.settlement && (
                      <span className="text-[#737373]">{y.settlement}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#262626]">
                    <th className="text-left px-5 py-3 text-xs text-[#737373] uppercase font-medium">Name</th>
                    <th className="text-left px-5 py-3 text-xs text-[#737373] uppercase font-medium">ID</th>
                    <th className="text-left px-5 py-3 text-xs text-[#737373] uppercase font-medium hidden md:table-cell">Module</th>
                    <th className="text-left px-5 py-3 text-xs text-[#737373] uppercase font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {youth.map((y) => (
                    <tr
                      key={y.user_id}
                      onClick={() => router.push(`/trainer/youth/${y.user_id}`)}
                      className="border-b border-[#262626] last:border-0 hover:bg-[#262626] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-sm text-white font-medium">{y.full_name}</td>
                      <td className="px-5 py-3.5 text-sm text-[#a3a3a3] font-mono">{y.user_id}</td>
                      <td className="px-5 py-3.5 text-sm text-[#a3a3a3] hidden md:table-cell">
                        {y.module ? (MODULE_LABELS[y.module] || y.module) : '—'}
                        {y.module === 'digitization' && y.module_assignment && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20">
                            {y.module_assignment}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          y.is_active
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-[#737373]/10 text-[#737373] border border-[#737373]/20'
                        }`}>
                          {y.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-[#262626]">
                <p className="text-sm text-[#737373]">
                  {((pagination.page - 1) * pagination.per_page) + 1}–
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg text-[#737373] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-white">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                    disabled={page >= pagination.total_pages}
                    className="p-1.5 rounded-lg text-[#737373] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

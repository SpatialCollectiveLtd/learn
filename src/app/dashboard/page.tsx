'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';

interface UserData {
  userId: string;
  fullName: string;
  role: 'youth' | 'trainer' | 'admin';
  settlement: string | null;
  module: string | null;
  moduleAssignment: string | null;
  userType: 'youth' | 'staff';
}

interface ContractProgress {
  contracted_days: number;
  days_worked: number;
  days_remaining: number;
  percent_complete: number;
}

interface TrainingModule {
  key: string;
  completed: number;
  max: number;
}

const MODULE_MAX_STEPS: Record<string, number> = {
  mapper: 7,
  validator: 7,
  mobile_mapping: 4,
  household_survey: 4,
  microtasking: 3,
};

const MODULE_LABELS: Record<string, string> = {
  digitization: 'Digitization',
  mobile_mapping: 'Mobile Mapping',
  household_survey: 'Household Survey',
  microtasking: 'Microtasking',
};

const SETTLEMENT_SHORT: Record<string, string> = {
  'Kayole Soweto': 'Kayole',
  'Kariobangi Machakos': 'Kariobangi',
  'Mji wa Huruma': 'Huruma',
};

function getModuleKeys(module: string | null, moduleAssignment: string | null): string[] {
  if (!module) return [];
  const ALL = ['digitization', 'mobile_mapping', 'household_survey', 'microtasking'];
  if (module === 'both') return ALL;
  if (module === 'mapper' || module === 'validator') return ['digitization'];
  if (ALL.includes(module)) return [module];
  if (module.includes(',')) return module.split(',').map((m) => m.trim()).filter((m) => ALL.includes(m));
  return [module];
}

function mapModuleProgressKey(moduleKey: string, moduleAssignment: string | null): string {
  if (moduleKey === 'digitization') return moduleAssignment === 'validator' ? 'validator' : 'mapper';
  return moduleKey;
}

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [contractProgress, setContractProgress] = useState<ContractProgress | null>(null);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [openDisputes, setOpenDisputes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.replace('/'); return; }

    let parsed: UserData;
    try { parsed = JSON.parse(userData); } catch { router.replace('/'); return; }

    if (parsed.userType === 'staff') {
      router.replace(parsed.role === 'admin' ? '/admin' : '/trainer');
      return;
    }
    setUser(parsed);

    const headers = { Authorization: `Bearer ${token}` };
    const id = parsed.userId;

    Promise.allSettled([
      fetch(`/api/users/${id}/performance`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${id}/payments`, { headers }).then((r) => r.json()),
      fetch('/api/training/progress', { headers }).then((r) => r.json()),
      fetch('/api/disputes', { headers }).then((r) => r.json()),
    ]).then(([perfRes, payRes, trainRes, dispRes]) => {
      if (perfRes.status === 'fulfilled' && perfRes.value.success) {
        setContractProgress(perfRes.value.data.contract_progress);
      }
      if (payRes.status === 'fulfilled' && payRes.value.success) {
        const today = new Date().toISOString().slice(0, 10);
        const records: Array<{ date: string; total_pay_kes: number }> = payRes.value.data.daily_records ?? [];
        const rec = records.find((r) => r.date === today);
        setTodayEarnings(rec ? rec.total_pay_kes : null);
      }
      if (trainRes.status === 'fulfilled' && trainRes.value.success) {
        const progress: Record<string, number[]> = trainRes.value.data.progress ?? {};
        const moduleKeys = getModuleKeys(parsed.module, parsed.moduleAssignment);
        const modules: TrainingModule[] = moduleKeys.map((key) => {
          if (key === 'microtasking') {
            const completed =
              (progress['microtasking1']?.length ?? 0) > 0 ? 1 : 0 +
              (progress['microtasking2']?.length ?? 0) > 0 ? 1 : 0 +
              (progress['microtasking3']?.length ?? 0) > 0 ? 1 : 0;
            return { key, completed, max: 3 };
          }
          const progressKey = mapModuleProgressKey(key, parsed.moduleAssignment);
          const max = MODULE_MAX_STEPS[progressKey] ?? 0;
          const completed = progress[progressKey]?.length ?? 0;
          return { key, completed, max };
        });
        setTrainingModules(modules);
      }
      if (dispRes.status === 'fulfilled' && dispRes.value.success) {
        const open = (dispRes.value.data as Array<{ status: string }>).filter((d) => d.status === 'open').length;
        setOpenDisputes(open);
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    router.replace('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#dc2626] mx-auto mb-3" />
          <p className="text-[#737373] text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const settlementShort = (user.settlement && SETTLEMENT_SHORT[user.settlement]) || user.settlement || '';
  const moduleLabel = user.module ? MODULE_LABELS[user.module] ?? user.module.replace(/_/g, ' ') : 'Unassigned';
  const daysWorked = contractProgress?.days_worked ?? 0;
  const contractedDays = contractProgress?.contracted_days ?? 20;
  const ringPct = contractProgress ? Math.min(contractProgress.percent_complete, 100) : 0;
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const strokeDash = (ringPct / 100) * CIRC;

  return (
    <div className="bg-black px-4 pt-8 pb-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#737373] text-xs uppercase tracking-widest mb-0.5">
              {settlementShort}{user.moduleAssignment && user.module === 'digitization' ? ` · ${user.moduleAssignment}` : ''}
            </p>
            <h1 className="text-2xl font-bold text-white font-heading leading-tight">
              {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-[#dc2626] text-xs font-medium mt-0.5">{moduleLabel}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-[#737373] hover:text-white transition-colors rounded-lg active:bg-white/5" aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Days ring + today earnings */}
        <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 mb-4 flex items-center gap-5">
          <div className="flex-shrink-0 relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="#1a1a1a" strokeWidth="10" />
              <circle cx="50" cy="50" r={R} fill="none" stroke="#dc2626" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${CIRC}`} className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white font-heading">{daysWorked}</span>
              <span className="text-[10px] text-[#737373]">of {contractedDays}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#737373] text-xs uppercase tracking-wider mb-1">Contract Days</p>
            <p className="text-white font-semibold text-sm mb-2">
              {contractProgress ? `${contractProgress.days_remaining} day${contractProgress.days_remaining !== 1 ? 's' : ''} remaining` : '— not started'}
            </p>
            <div className="border-t border-[#1a1a1a] pt-2">
              <p className="text-[#737373] text-xs uppercase tracking-wider mb-0.5">Today</p>
              {todayEarnings !== null ? (
                <p className="text-green-400 font-bold text-lg">KES {todayEarnings.toLocaleString()}</p>
              ) : (
                <p className="text-[#737373] text-sm">No record yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Training progress */}
        {trainingModules.length > 0 && (
          <div className="bg-[#111111] border border-[#262626] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#737373] text-xs uppercase tracking-wider">Training</p>
              <button onClick={() => router.push('/dashboard/training')} className="text-[#dc2626] text-xs hover:text-[#ef4444] transition-colors">View all →</button>
            </div>
            <div className="space-y-3">
              {trainingModules.map((m) => {
                const pct = m.max > 0 ? Math.round((m.completed / m.max) * 100) : 0;
                return (
                  <div key={m.key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm">{MODULE_LABELS[m.key] ?? m.key.replace(/_/g, ' ')}</span>
                      <span className="text-[#737373] text-xs">{m.completed}/{m.max}</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-[#dc2626] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Open disputes alert */}
        {openDisputes > 0 && (
          <button onClick={() => router.push('/dashboard/payments')}
            className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4 flex items-center gap-3 text-left active:bg-yellow-500/20 transition-colors">
            <Bell className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">{openDisputes} open dispute{openDisputes !== 1 ? 's' : ''}</p>
              <p className="text-[#737373] text-xs">Tap to view in Payments</p>
            </div>
          </button>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Earnings', sub: 'View breakdown', href: '/dashboard/payments' },
            { label: 'Attendance', sub: 'Calendar view', href: '/dashboard/days' },
            { label: 'Training', sub: 'Continue steps', href: '/dashboard/training' },
            { label: 'Messages', sub: 'Inbox', href: '/dashboard/messages' },
          ].map(({ label, sub, href }) => (
            <button key={href} onClick={() => router.push(href)}
              className="bg-[#111111] border border-[#262626] rounded-2xl p-4 text-left hover:border-[#dc2626]/50 active:bg-white/5 transition-colors">
              <p className="text-[#737373] text-xs uppercase tracking-wider mb-1">{label}</p>
              <p className="text-white font-semibold text-sm">{sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

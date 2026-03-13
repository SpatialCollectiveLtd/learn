'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Calendar, CheckCircle, Target, AlertCircle, MapPin, User } from 'lucide-react';
import WorkDashboardTabs from '@/components/mobile-mapping/WorkDashboardTabs';
import PaymentTab from '@/components/mobile-mapping/PaymentTab';
import PerformanceTab from '@/components/mobile-mapping/PerformanceTab';
import ResolveCenterTab from '@/components/mobile-mapping/ResolveCenterTab';

interface ContractProgress { days_worked: number; total_days: number; days_remaining: number; start_date: string | null; }
interface UserProfile { full_name: string; youth_id: string; settlement: string; program_type: string; module_assignment: string | null; }

export default function MobileMappingWorkDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contract, setContract] = useState<ContractProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) { router.replace('/'); return; }

    let user: { userId: string };
    try { user = JSON.parse(userData); } catch { router.replace('/'); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`/api/users/${user.userId}`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${user.userId}/performance`, { headers }).then((r) => r.json()),
    ]).then(([profRes, perfRes]) => {
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        const d = profRes.value.data;
        setProfile({ full_name: d.full_name ?? d.name ?? '', youth_id: d.youth_id, settlement: d.settlement, program_type: d.program_type, module_assignment: d.module_assignment });
        if (d.program_type !== 'mobile_mapping') { router.replace('/dashboard'); return; }
      }
      if (perfRes.status === 'fulfilled' && perfRes.value.success) {
        setContract(perfRes.value.data.contract_progress ?? null);
      } else {
        setError('Could not load work data from DPW App. Some data may be unavailable.');
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  const daysWorked = contract?.days_worked ?? 0;
  const totalDays = contract?.total_days ?? 20;
  const pct = Math.round((daysWorked / totalDays) * 100);

  return (
    <div className="min-h-screen bg-black pb-8">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#dc2626]/10 border border-[#dc2626]/30 flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-[#dc2626]" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white">Work Dashboard</h1>
            <p className="text-[#737373] text-sm">Mobile Mapping</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        )}

        {/* Profile card */}
        {profile && (
          <div className="mb-5 bg-[#111111] border border-[#262626] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#dc2626]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#dc2626]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{profile.full_name}</p>
              <p className="text-xs text-[#737373]">{profile.youth_id}</p>
            </div>
            <div className="flex items-center gap-1 text-[#737373] text-xs">
              <MapPin className="w-3 h-3" />
              <span>{profile.settlement}</span>
            </div>
          </div>
        )}

        {/* Day counter */}
        <div className="mb-5 bg-gradient-to-r from-[#dc2626]/20 to-[#991b1b]/20 border-2 border-[#dc2626] rounded-xl p-6 text-center">
          <p className="text-[#737373] text-sm mb-1">Days Worked</p>
          <div className="text-5xl font-heading font-bold text-white">
            {daysWorked}<span className="text-2xl text-[#737373]"> / {totalDays}</span>
          </div>
          {contract?.start_date && (
            <p className="text-[#737373] text-xs mt-2">
              Started: {new Date(contract.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-5 bg-[#111111] border border-[#262626] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#737373] text-sm">Work Period Progress</span>
            <span className="text-[#dc2626] font-semibold">{pct}%</span>
          </div>
          <div className="h-4 bg-black rounded-full overflow-hidden">
            <div className="h-full bg-[#dc2626] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-[#737373]">
            <span>Day 1</span><span>Day {totalDays}</span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="mb-5 bg-[#111111] border border-[#262626] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#dc2626]" />
            Work Days Calendar
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalDays }, (_, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < daysWorked;
              const isToday = dayNum === daysWorked;
              return (
                <div key={dayNum} className={[
                  'aspect-square rounded-lg flex items-center justify-center text-sm font-semibold',
                  isPast ? 'bg-green-500/20 text-green-400 border border-green-500/30' : '',
                  isToday ? 'bg-[#dc2626] text-white border-2 border-[#dc2626] scale-110' : '',
                  !isPast && !isToday ? 'bg-[#1a1a1a] text-[#737373] border border-[#2a2a2a]' : '',
                ].join(' ')}>
                  {isPast ? <CheckCircle className="w-4 h-4" /> : dayNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 text-center">
            <p className="text-2xl font-heading font-bold text-white">{daysWorked}</p>
            <p className="text-xs text-[#737373]">Days Worked</p>
          </div>
          <div className="bg-[#111111] border border-[#262626] rounded-xl p-4 text-center">
            <div className="flex items-center justify-center">
              <Target className="w-4 h-4 text-[#dc2626] mr-1" />
            </div>
            <p className="text-2xl font-heading font-bold text-white">{Math.max(0, totalDays - daysWorked)}</p>
            <p className="text-xs text-[#737373]">Days Remaining</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#111111] border border-[#262626] rounded-xl overflow-hidden">
          <WorkDashboardTabs
            paymentTab={<PaymentTab />}
            performanceTab={<PerformanceTab />}
            resolveTab={<ResolveCenterTab />}
          />
        </div>
      </div>
    </div>
  );
}
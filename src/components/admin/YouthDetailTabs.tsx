'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, BarChart3, Wallet, AlertCircle, Flag, CheckCircle, XCircle } from 'lucide-react';
import { getStaffSession } from '@/lib/staff-session';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  settlement: string | null;
  module: string | null;
  module_assignment: string | null;
  trainer_name: string | null;
  cohort: string | null;
  is_active: boolean;
  enrolled_at: string | null;
  contract: {
    has_signed: boolean;
    signed_at: string | null;
    start_date: string | null;
    end_date: string | null;
    total_contracted_days: number;
  } | null;
}

interface PerformanceData {
  summary: {
    total_days_worked: number;
    total_output: number;
    output_unit: string;
    daily_target: number;
    average_daily_output: number;
    target_met_days: number;
    attendance_rate: number;
  };
  contract_progress: {
    contracted_days: number;
    days_worked: number;
    days_remaining: number;
    percent_complete: number;
  } | null;
}

interface AttendanceDay {
  date: string;
  status: string;
  output?: number;
}

interface AttendanceData {
  days: AttendanceDay[];
  total_present: number;
  total_absent: number;
}

interface PaymentsData {
  summary: {
    total_earnings_kes: number;
    total_base_pay_kes: number;
    total_bonus_pay_kes: number;
    days_with_earnings: number;
  };
  modules_active: string[];
  daily_records: Array<{
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
  }>;
  sync_info: {
    microtasking_last_consensus: string | null;
    data_note: string | null;
  } | null;
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

const DISPUTE_STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  rejected: 'bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20',
};

const ISSUE_LABELS: Record<string, string> = {
  missed_attendance: 'Missed Attendance',
  wrong_volume: 'Wrong Volume',
  missing_bonus: 'Missing Bonus',
  wrong_module: 'Wrong Module',
  other: 'Other',
};

type TabKey = 'profile' | 'attendance' | 'performance' | 'payments' | 'disputes';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'disputes', label: 'Disputes', icon: Flag },
];

interface Props {
  userId: string;
  backHref: string;
  backLabel?: string;
}

export default function YouthDetailTabs({ userId, backHref, backLabel = 'Back' }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [payments, setPayments] = useState<PaymentsData | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [resolving, setResolving] = useState<{ id: number; action: 'resolved' | 'rejected'; note: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) { router.push('/'); return; }

    const headers = { Authorization: `Bearer ${session.token}` };

    Promise.allSettled([
      fetch(`/api/users/${userId}`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${userId}/performance`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${userId}/payments`, { headers }).then((r) => r.json()),
    ]).then(([profileRes, perfRes, payRes]) => {
      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setProfile(profileRes.value.data);
      } else {
        setError('Unable to load profile. DPW App may be unavailable.');
      }
      if (perfRes.status === 'fulfilled' && perfRes.value.success) setPerformance(perfRes.value.data);
      if (payRes.status === 'fulfilled' && payRes.value.success) setPayments(payRes.value.data);
      setLoading(false);
    });
  }, [userId, router]);

  const fetchAttendance = async () => {
    const session = getStaffSession();
    if (!session) return;
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/attendance?from=${fromDate}&to=${toDate}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json();
      if (data.success) setAttendance(data.data);
    } catch {
      // silent
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  useEffect(() => {
    if (activeTab !== 'disputes') return;
    const session = getStaffSession();
    if (!session) return;
    setDisputesLoading(true);
    fetch(`/api/disputes?youth_id=${userId}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setDisputes(data.data); })
      .catch(() => undefined)
      .finally(() => setDisputesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626]" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-2 text-[#a3a3a3] hover:text-white mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      {error && (
        <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#dc2626] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {/* Profile header */}
      {profile && (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
              <User className="w-8 h-8 text-[#dc2626]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
              <p className="text-[#a3a3a3]">
                {profile.user_id}
                {profile.settlement && ` • ${profile.settlement}`}
                {profile.module && ` • ${profile.module.replace(/_/g, ' ')}`}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              profile.is_active
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-[#737373]/10 text-[#737373] border border-[#737373]/20'
            }`}>
              {profile.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 min-w-[112px] sm:min-w-0 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-[#262626] last:border-r-0 ${
                activeTab === key ? 'bg-[#dc2626] text-white' : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && profile && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Personal Info</h2>
            <div className="space-y-3">
              {[
                { label: 'Full Name', value: profile.full_name },
                { label: 'Youth ID', value: profile.user_id },
                { label: 'Email', value: profile.email || '—' },
                { label: 'Phone', value: profile.phone_number || '—' },
                { label: 'Settlement', value: profile.settlement || '—' },
                { label: 'Module', value: profile.module?.replace(/_/g, ' ') || '—' },
                { label: 'Assignment', value: profile.module_assignment || '—' },
                { label: 'Trainer', value: profile.trainer_name || '—' },
                { label: 'Cohort', value: profile.cohort || '—' },
                {
                  label: 'Enrolled',
                  value: profile.enrolled_at ? new Date(profile.enrolled_at).toLocaleDateString() : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-[#a3a3a3]">{label}</span>
                  <span className="text-white font-medium text-left sm:text-right sm:max-w-[55%] break-words">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Contract</h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                <span className="text-[#a3a3a3]">Contract Signed</span>
                <span className={profile.contract?.has_signed ? 'text-green-400 font-medium' : 'text-[#737373]'}>
                  {profile.contract?.has_signed ? 'Yes' : 'No'}
                </span>
              </div>
              {profile.contract?.signed_at && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-[#a3a3a3]">Signed On</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.signed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.contract?.start_date && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-[#a3a3a3]">Start Date</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.contract?.end_date && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-[#a3a3a3]">End Date</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                <span className="text-[#a3a3a3]">Contracted Days</span>
                <span className="text-white font-medium">
                  {profile.contract?.total_contracted_days ?? '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === 'attendance' && (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
          <div className="flex flex-wrap items-end gap-3 mb-6">
            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#737373] uppercase font-medium mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-black border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
              />
            </div>
            <button
              onClick={fetchAttendance}
              className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Load
            </button>
          </div>

          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" />
            </div>
          ) : attendance ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
                <div className="bg-black/50 rounded-lg p-3 border border-[#2a2a2a]">
                  <p className="text-xs text-[#737373] uppercase mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-400">{attendance.total_present}</p>
                </div>
                <div className="bg-black/50 rounded-lg p-3 border border-[#2a2a2a]">
                  <p className="text-xs text-[#737373] uppercase mb-1">Absent</p>
                  <p className="text-2xl font-bold text-[#dc2626]">{attendance.total_absent}</p>
                </div>
              </div>
              {attendance.days.length > 0 && (
                <div className="space-y-0 max-h-72 overflow-y-auto">
                  {attendance.days.map((day, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm py-2.5 border-b border-[#2a2a2a] last:border-0"
                    >
                      <span className="text-[#a3a3a3]">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-3">
                        {day.output !== undefined && (
                          <span className="text-[#737373] text-xs">{day.output} units</span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          day.status === 'present'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-[#dc2626]/10 text-[#dc2626]'
                        }`}>
                          {day.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-[#737373] py-8">Select a date range and click Load</p>
          )}
        </div>
      )}

      {/* Performance tab */}
      {activeTab === 'performance' && performance && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Work Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Days Worked', value: performance.summary.total_days_worked },
                { label: 'Total Output', value: `${performance.summary.total_output} ${performance.summary.output_unit}` },
                { label: 'Daily Average', value: performance.summary.average_daily_output },
                { label: 'Target Met Days', value: performance.summary.target_met_days },
                { label: 'Attendance Rate', value: `${Math.round(performance.summary.attendance_rate * 100)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-[#a3a3a3]">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {performance.contract_progress && (
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Contract Progress</h2>
              <div className="space-y-3">
                {[
                  { label: 'Contracted Days', value: performance.contract_progress.contracted_days },
                  { label: 'Days Worked', value: performance.contract_progress.days_worked },
                  { label: 'Days Remaining', value: performance.contract_progress.days_remaining },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
                    <span className="text-[#a3a3a3]">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
                <div className="border-t border-[#2a2a2a] my-1" />
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#a3a3a3]">Complete</span>
                  <span className="text-white font-medium">{performance.contract_progress.percent_complete}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                  <div
                    className="bg-[#dc2626] h-2 rounded-full"
                    style={{ width: `${performance.contract_progress.percent_complete}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && payments && (
        <div className="space-y-6">
          {payments.sync_info?.data_note && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-400">{payments.sync_info.data_note}</p>
            </div>
          )}
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4">
              <p className="text-xs text-[#737373] uppercase mb-1">Total Earned</p>
              <p className="text-xl font-bold text-white">KES {payments.summary.total_earnings_kes.toLocaleString()}</p>
            </div>
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4">
              <p className="text-xs text-[#737373] uppercase mb-1">Base Pay</p>
              <p className="text-xl font-bold text-white">KES {payments.summary.total_base_pay_kes.toLocaleString()}</p>
            </div>
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-4">
              <p className="text-xs text-[#737373] uppercase mb-1">Bonus Pay</p>
              <p className="text-xl font-bold text-green-400">KES {payments.summary.total_bonus_pay_kes.toLocaleString()}</p>
            </div>
          </div>

          {/* Daily records table */}
          {payments.daily_records.length > 0 ? (
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#262626]">
                <h3 className="font-semibold text-white">Daily Earnings ({payments.daily_records.length} records)</h3>
              </div>
              <div className="divide-y divide-[#262626] md:hidden">
                {payments.daily_records.map((r, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white text-sm font-medium">{new Date(r.date).toLocaleDateString()}</p>
                        <p className="text-xs text-[#737373] capitalize">{r.module.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={r.earning_status === 'earned' ? 'text-green-400 font-medium' : 'text-[#737373] font-medium'}>
                        KES {r.total_pay_kes.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[#737373] text-xs uppercase mb-1">Output</p>
                        <p className="text-white">{r.volume} {r.volume_unit}</p>
                      </div>
                      <div>
                        <p className="text-[#737373] text-xs uppercase mb-1">Quality</p>
                        <p className="text-white">{r.quality_percentage != null ? `${r.quality_percentage.toFixed(1)}%` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[#737373] text-xs uppercase mb-1">Base</p>
                        <p className="text-white">KES {r.base_pay_kes.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[#737373] text-xs uppercase mb-1">Bonus</p>
                        <p className="text-white">KES {r.bonus_pay_kes.toLocaleString()}</p>
                      </div>
                    </div>
                    {r.pay_note && <p className="text-xs text-[#737373]">{r.pay_note}</p>}
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#262626]">
                      {['Date', 'Module', 'Output', 'Quality', 'Base', 'Bonus', 'Total', 'Note'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs text-[#737373] uppercase font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.daily_records.map((r, i) => (
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
                        <td className="px-4 py-2.5 text-[#737373] text-xs max-w-[180px] truncate">
                          {r.pay_note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-center text-[#737373] py-8">No payment records in the selected period</p>
          )}
        </div>
      )}

      {/* Disputes tab */}
      {activeTab === 'disputes' && (
        <div className="bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#262626]">
            <h3 className="font-semibold text-white">Payment Disputes</h3>
          </div>
          {disputesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#dc2626]" />
            </div>
          ) : disputes.length > 0 ? (
            <div className="divide-y divide-[#262626]">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">
                          {new Date(d.dispute_date).toLocaleDateString()}
                        </span>
                        {d.module && (
                          <span className="text-xs text-[#737373] capitalize">{d.module.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#a3a3a3]">{ISSUE_LABELS[d.issue_type] ?? d.issue_type}</p>
                      {d.description && (
                        <p className="text-xs text-[#737373] mt-1">{d.description}</p>
                      )}
                      {d.expected_amount_kes != null && (
                        <p className="text-xs text-[#737373] mt-1">
                          Expected: KES {d.expected_amount_kes.toLocaleString()}
                          {d.reported_amount_kes != null && ` · Recorded: KES ${d.reported_amount_kes.toLocaleString()}`}
                        </p>
                      )}
                      {d.resolution_note && (
                        <p className="text-xs text-[#a3a3a3] mt-1 italic">{d.resolution_note}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${DISPUTE_STATUS_STYLES[d.status] ?? ''}`}>
                      {d.status}
                    </span>
                  </div>

                  {/* Resolution actions for open disputes */}
                  {d.status === 'open' && (
                    <div className="pl-0">
                      {resolving?.id === d.id ? (
                        <div className="space-y-2">
                          <p className="text-xs text-[#737373]">
                            {resolving.action === 'resolved' ? 'Resolution note (optional):' : 'Rejection reason (optional):'}
                          </p>
                          <textarea
                            value={resolving.note}
                            onChange={e => setResolving(r => r ? { ...r, note: e.target.value } : null)}
                            placeholder="Add a note…"
                            rows={2}
                            className="w-full bg-[#171717] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#dc2626] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                const session = getStaffSession();
                                if (!session) return;
                                const res = await fetch(`/api/disputes/${resolving.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
                                  body: JSON.stringify({ status: resolving.action, resolution_note: resolving.note }),
                                });
                                const json = await res.json();
                                if (json.success) {
                                  setDisputes(prev => prev.map(x =>
                                    x.id === resolving.id
                                      ? { ...x, status: resolving.action as Dispute['status'], resolution_note: resolving.note || null }
                                      : x
                                  ));
                                  setResolving(null);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors ${
                                resolving.action === 'resolved'
                                  ? 'bg-green-700 hover:bg-green-600'
                                  : 'bg-[#dc2626] hover:bg-[#b91c1c]'
                              }`}
                            >
                              Confirm {resolving.action === 'resolved' ? 'Resolve' : 'Reject'}
                            </button>
                            <button
                              onClick={() => setResolving(null)}
                              className="px-3 py-1 rounded-lg text-xs text-[#737373] hover:text-white border border-[#333] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setResolving({ id: d.id, action: 'resolved', note: '' })}
                            className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800/40 rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </button>
                          <button
                            onClick={() => setResolving({ id: d.id, action: 'rejected', note: '' })}
                            className="flex items-center gap-1.5 px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-[#dc2626] border border-red-800/30 rounded-lg text-xs font-medium transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#737373] py-8 text-sm">No disputes filed by this participant.</p>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, BarChart3, Wallet, AlertCircle } from 'lucide-react';

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
  total_earnings: number;
  total_paid: number;
  total_pending: number;
  cycles: Array<{
    cycle_name: string;
    days_worked: number;
    earnings: number;
    status: string;
  }>;
}

type TabKey = 'profile' | 'attendance' | 'performance' | 'payments';

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
  { key: 'payments', label: 'Payments', icon: Wallet },
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
    const token = localStorage.getItem('token');
    if (!token) { router.push('/'); return; }

    const headers = { Authorization: `Bearer ${token}` };

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
    const token = localStorage.getItem('token');
    if (!token) return;
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/attendance?from=${fromDate}&to=${toDate}`, {
        headers: { Authorization: `Bearer ${token}` },
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
          <div className="flex items-center gap-4">
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
      <div className="grid grid-cols-4 mb-6 bg-[#1F2121] border border-[#262626] rounded-2xl overflow-hidden">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-[#262626] last:border-0 ${
              activeTab === key ? 'bg-[#dc2626] text-white' : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
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
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">{label}</span>
                  <span className="text-white font-medium text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Contract</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#a3a3a3]">Contract Signed</span>
                <span className={profile.contract?.has_signed ? 'text-green-400 font-medium' : 'text-[#737373]'}>
                  {profile.contract?.has_signed ? 'Yes' : 'No'}
                </span>
              </div>
              {profile.contract?.signed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Signed On</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.signed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.contract?.start_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Start Date</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile.contract?.end_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">End Date</span>
                  <span className="text-white font-medium">
                    {new Date(profile.contract.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
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
              <div className="flex gap-4 mb-6">
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
                      className="flex justify-between items-center text-sm py-2.5 border-b border-[#2a2a2a] last:border-0"
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
                <div key={label} className="flex justify-between text-sm">
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
                  <div key={label} className="flex justify-between text-sm">
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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#a3a3a3]">Total Earnings</span>
                <span className="text-white font-medium">KES {payments.total_earnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a3a3a3]">Total Paid</span>
                <span className="text-green-400 font-medium">KES {payments.total_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#a3a3a3]">Pending</span>
                <span className="text-yellow-400 font-medium">KES {payments.total_pending.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {payments.cycles.length > 0 && (
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Payment Cycles</h2>
              <div className="space-y-4">
                {payments.cycles.map((cycle, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-white font-medium">{cycle.cycle_name}</p>
                      <p className="text-[#737373] text-xs">{cycle.days_worked} days</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${cycle.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                        KES {cycle.earnings.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#737373]">{cycle.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, BarChart3, Wallet, AlertCircle } from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string;
  settlement: string | null;
  module: string | null;
  module_assignment: string | null;
  is_active: boolean;
  enrolled_at: string | null;
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
  };
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
    total_pay_kes: number;
    earning_status: string;
    pay_note: string | null;
  }>;
  sync_info: {
    data_note: string | null;
  } | null;
}

export default function YouthProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [payments, setPayments] = useState<PaymentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    if (!token || !userData) {
      router.push('/');
      return;
    }

    let user: { userId: string; userType: string };
    try {
      user = JSON.parse(userData);
    } catch {
      router.push('/');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const userId = user.userId;

    Promise.allSettled([
      fetch(`/api/users/${userId}`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${userId}/performance`, { headers }).then((r) => r.json()),
      fetch(`/api/users/${userId}/payments`, { headers }).then((r) => r.json()),
    ]).then(([profileRes, perfRes, payRes]) => {
      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setProfile(profileRes.value.data);
      }
      if (perfRes.status === 'fulfilled' && perfRes.value.success) {
        setPerformance(perfRes.value.data);
      }
      if (payRes.status === 'fulfilled' && payRes.value.success) {
        setPayments(payRes.value.data);
      }
      if (profileRes.status === 'rejected' || (profileRes.status === 'fulfilled' && !profileRes.value.success)) {
        setError('Unable to load profile data. DPW App may be unavailable.');
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

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[#a3a3a3] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {error && (
          <div className="bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#dc2626] mt-0.5" />
            <p className="text-sm text-[#dc2626]">{error}</p>
          </div>
        )}

        {/* Profile header */}
        {profile && (
          <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                <User className="w-8 h-8 text-[#dc2626]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                <p className="text-[#a3a3a3]">
                  {profile.user_id} {profile.settlement && `• ${profile.settlement}`}
                  {profile.module && ` • ${profile.module.replace('_', ' ')}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance */}
          {performance && (
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[#dc2626]" />
                <h2 className="text-lg font-bold text-white">Performance</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Days Worked</span>
                  <span className="text-white font-medium">{performance.summary.total_days_worked}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Total Output</span>
                  <span className="text-white font-medium">{performance.summary.total_output} {performance.summary.output_unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Daily Average</span>
                  <span className="text-white font-medium">{performance.summary.average_daily_output}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Target Met Days</span>
                  <span className="text-white font-medium">{performance.summary.target_met_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Attendance Rate</span>
                  <span className="text-white font-medium">{Math.round(performance.summary.attendance_rate * 100)}%</span>
                </div>
                {performance.contract_progress && (
                  <>
                    <div className="border-t border-[#2a2a2a] my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-[#a3a3a3]">Contract Progress</span>
                      <span className="text-white font-medium">{performance.contract_progress.percent_complete}%</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                      <div className="bg-[#dc2626] h-2 rounded-full" style={{ width: `${performance.contract_progress.percent_complete}%` }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments && (
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#dc2626]" />
                  <h2 className="text-lg font-bold text-white">Payments</h2>
                </div>
                <a href="/dashboard/payments" className="text-xs text-[#dc2626] hover:text-[#ef4444] transition-colors">
                  Full breakdown →
                </a>
              </div>
              {payments.sync_info?.data_note && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-400">{payments.sync_info.data_note}</p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Total Earned</span>
                  <span className="text-white font-medium">KES {payments.summary.total_earnings_kes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Days With Earnings</span>
                  <span className="text-white font-medium">{payments.summary.days_with_earnings}</span>
                </div>
                {payments.modules_active.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a3a3a3]">Modules</span>
                    <span className="text-white font-medium">{payments.modules_active.join(', ')}</span>
                  </div>
                )}
                {payments.daily_records.length > 0 && (
                  <>
                    <div className="border-t border-[#2a2a2a] my-2" />
                    <p className="text-xs text-[#737373] font-medium uppercase">Recent Days</p>
                    {payments.daily_records.slice(0, 3).map((record, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[#a3a3a3]">{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`font-medium ${record.earning_status === 'earned' ? 'text-green-400' : 'text-[#737373]'}`}>
                          KES {record.total_pay_kes.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


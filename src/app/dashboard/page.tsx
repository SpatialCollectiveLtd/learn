'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, BarChart3, Mail, LogOut } from 'lucide-react';

interface UserData {
  userId: string;
  fullName: string;
  role: 'youth' | 'trainer' | 'admin';
  settlement: string | null;
  module: string | null;
  moduleAssignment: string | null;
  userType: 'youth' | 'staff';
}

interface TrainingProgress {
  progress: Record<string, number[]>;
  totalCompleted: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [training, setTraining] = useState<TrainingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModuleSelector, setShowModuleSelector] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    let parsed: UserData;
    try {
      parsed = JSON.parse(userData);
    } catch {
      router.push('/');
      return;
    }

    // Staff have their own areas — redirect immediately
    if (parsed.userType === 'staff') {
      router.replace(parsed.role === 'admin' ? '/admin' : '/trainer');
      return;
    }

    setUser(parsed);

    // Fetch training progress
    fetch('/api/training/progress', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTraining(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#dc2626] mx-auto mb-4" />
          <p className="text-[#a3a3a3]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const moduleLabel = user.module === 'both' ? 'Multi-Module' : (user.module?.replace(/_/g, ' ') || 'Unassigned');

  const MODULE_ROUTES: Record<string, { label: string; path: string }> = {
    digitization: { label: 'Digitization', path: user.moduleAssignment === 'validator' ? '/digitization/validator' : '/digitization/mapper' },
    mobile_mapping: { label: 'Mobile Mapping', path: '/mobile-mapping' },
    household_survey: { label: 'Household Survey', path: '/household-survey' },
    microtasking: { label: 'Microtasking', path: '/microtasking' },
  };

  const handleTrainingClick = () => {
    if (!user.module || user.module === 'both') {
      setShowModuleSelector(true);
      return;
    }
    const route = MODULE_ROUTES[user.module];
    router.push(route?.path || '/digitization/mapper');
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-1">
              Welcome, {user.fullName}
            </h1>
            <p className="text-[#a3a3a3]">
              {user.settlement && `${user.settlement} • `}
              {moduleLabel.toUpperCase()}
              {user.moduleAssignment && user.module === 'digitization' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20">
                  {user.moduleAssignment.toUpperCase()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#737373] hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Dashboard cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <button
            onClick={handleTrainingClick}
            className="bg-[#1F2121] rounded-2xl shadow-lg p-6 text-left hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-[#262626] hover:border-[#dc2626]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                <BookOpen className="w-7 h-7 text-[#dc2626]" />
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">Training</h2>
            <p className="text-sm text-[#a3a3a3] mb-3">
              Continue your training modules and complete your steps.
            </p>
            {training && (
              <div className="bg-black/50 rounded-lg p-3 border border-[#2a2a2a]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a3a3a3]">Completed</span>
                  <span className="text-white font-medium">{training.totalCompleted} steps</span>
                </div>
              </div>
            )}
          </button>

          <button
            onClick={() => router.push('/dashboard/youth')}
            className="bg-[#1F2121] rounded-2xl shadow-lg p-6 text-left hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-[#262626] hover:border-[#dc2626]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                <BarChart3 className="w-7 h-7 text-[#dc2626]" />
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">My Profile</h2>
            <p className="text-sm text-[#a3a3a3]">
              View your performance, attendance, and payment history.
            </p>
          </button>

          <button
            onClick={() => router.push('/dashboard/messages')}
            className="bg-[#1F2121] rounded-2xl shadow-lg p-6 text-left hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-[#262626] hover:border-[#dc2626]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-[#dc2626]/20 p-3 rounded-xl border border-[#dc2626]/30">
                <Mail className="w-7 h-7 text-[#dc2626]" />
              </div>
            </div>
            <h2 className="text-xl font-heading font-bold text-white mb-2">Messages</h2>
            <p className="text-sm text-[#a3a3a3]">
              View notifications and communications from your team.
            </p>
          </button>
        </div>

        <div className="text-center mt-8 text-sm text-[#737373]">
          <p>Need help? Contact your training coordinator.</p>
        </div>

        {/* Module selector for 'both' or null module */}
        {showModuleSelector && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-[#1F2121] border border-[#262626] rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-heading font-bold text-white mb-2">Select Training Module</h3>
              <p className="text-sm text-[#a3a3a3] mb-4">Choose which training to continue:</p>
              <div className="space-y-3">
                {Object.entries(MODULE_ROUTES).map(([key, { label, path }]) => (
                  <button
                    key={key}
                    onClick={() => { setShowModuleSelector(false); router.push(path); }}
                    className="w-full bg-black/50 border border-[#2a2a2a] hover:border-[#dc2626] rounded-xl p-4 text-left transition-colors"
                  >
                    <span className="text-white font-medium">{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowModuleSelector(false)}
                className="mt-4 w-full text-sm text-[#737373] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

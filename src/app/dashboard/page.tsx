'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Briefcase, CheckCircle, Lock, AlertCircle } from 'lucide-react';

interface TrainingStatus {
  programType: string;
  settlement: string;
  trainingCompleted: boolean;
  hasOsmUsername: boolean;
  requiresOsmUsername: boolean;
  canAccessWorkDashboard: boolean;
  progress: {
    total: number;
    completed: number;
    percentage: number;
    missingSteps: string[];
  };
}

export default function DashboardSelection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainingStatus();
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/training/completion-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch training status');
      }

      if (data.success) {
        setStatus(data.data);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Error fetching training status:', err);
      setError(err.message || 'Failed to load dashboard options');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingClick = () => {
    // Route based on program type
    const routes: Record<string, string> = {
      digitization: '/digitization/mapper',
      mobile_mapping: '/mobile-mapping',
      household_survey: '/household-survey',
      microtasking: '/microtasking',
    };

    const route = routes[status?.programType || ''] || '/digitization/mapper';
    router.push(route);
  };

  const handleWorkClick = () => {
    if (!status?.canAccessWorkDashboard) {
      return; // Button should be disabled
    }

    router.push('/dashboard/work');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard options...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-400 text-center mb-6">{error || 'An error occurred'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-cyan-600 text-white py-3 px-6 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-500/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const { trainingCompleted, canAccessWorkDashboard, progress, requiresOsmUsername, hasOsmUsername } = status;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to SC Training Hub
          </h1>
          <p className="text-lg text-gray-400 mb-2">
            {status.settlement} • {status.programType.replace('_', ' ').toUpperCase()}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-gray-300">
              Training Progress: {progress.completed}/{progress.total} steps ({progress.percentage}%)
            </span>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Training Dashboard Card */}
          <button
            onClick={handleTrainingClick}
            className="bg-gray-900 rounded-2xl shadow-lg shadow-blue-500/10 p-8 text-left hover:shadow-2xl hover:shadow-blue-500/20 transition-all transform hover:-translate-y-1 border border-gray-800 hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-600/20 p-4 rounded-xl border border-blue-500/30">
                <BookOpen className="w-8 h-8 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-blue-400 bg-blue-950/50 px-3 py-1 rounded-full border border-blue-800">
                Always Available
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Training Dashboard
            </h2>
            
            <p className="text-gray-400 mb-4">
              Continue your training modules, complete steps, and improve your mapping skills.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium text-white">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {!trainingCompleted && progress.missingSteps.length > 0 && (
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">Remaining steps:</p>
                <p className="text-xs">{progress.missingSteps.slice(0, 3).join(', ')}
                  {progress.missingSteps.length > 3 && ` +${progress.missingSteps.length - 3} more`}
                </p>
              </div>
            )}
          </button>

          {/* Work Dashboard Card */}
          <button
            onClick={handleWorkClick}
            disabled={!canAccessWorkDashboard}
            className={`bg-gray-900 rounded-2xl shadow-lg p-8 text-left transition-all border ${
              canAccessWorkDashboard
                ? 'hover:shadow-2xl hover:shadow-cyan-500/20 transform hover:-translate-y-1 border-gray-800 hover:border-cyan-500 cursor-pointer'
                : 'opacity-60 cursor-not-allowed border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-xl border ${
                canAccessWorkDashboard 
                  ? 'bg-cyan-600/20 border-cyan-500/30' 
                  : 'bg-gray-800/50 border-gray-700'
              }`}>
                {canAccessWorkDashboard ? (
                  <Briefcase className="w-8 h-8 text-cyan-400" />
                ) : (
                  <Lock className="w-8 h-8 text-gray-600" />
                )}
              </div>
              {canAccessWorkDashboard ? (
                <span className="text-sm font-medium text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-800">
                  Unlocked
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                  Locked
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Work Dashboard
            </h2>
            
            {canAccessWorkDashboard ? (
              <>
                <p className="text-gray-400 mb-4">
                  Track your daily mapping work, view building counts, and monitor your 20-day work period.
                </p>
                <div className="bg-cyan-950/50 border border-cyan-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-cyan-300 mb-1">You're ready to start working!</p>
                      <p className="text-cyan-400">
                        All training steps completed. Click to view your work dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-4">
                  Track your daily mapping work, view building counts, and monitor your 20-day work period.
                </p>
                <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-300 mb-2">Requirements to unlock:</p>
                      <ul className="space-y-1 text-amber-400">
                        {!trainingCompleted && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Complete all {progress.total} training steps ({progress.missingSteps.length} remaining)
                          </li>
                        )}
                        {requiresOsmUsername && !hasOsmUsername && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Add your OpenStreetMap username in training
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact your training coordinator.</p>
        </div>
      </div>
    </div>
  );
}

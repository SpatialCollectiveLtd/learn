'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Briefcase, CheckCircle, Lock, AlertCircle } from 'lucide-react';

interface TrainingStatus {
  programType: string;
  moduleAssignment?: string;  // 'mapper' or 'validator' for digitization
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
      const token = localStorage.getItem('youthToken');
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
    if (!status) return;
    
    // Smart routing: For digitization, redirect based on module_assignment
    if (status.programType === 'digitization') {
      const targetRoute = status.moduleAssignment === 'validator'
        ? '/digitization/validator'
        : '/digitization/mapper';  // Default to mapper if not specified
      router.push(targetRoute);
      return;
    }
    
    // For other programs, use direct mapping
    const routes: Record<string, string> = {
      mobile_mapping: '/mobile-mapping',
      household_survey: '/household-survey',
      microtasking: '/microtasking',
    };

    const route = routes[status.programType] || '/digitization/mapper';
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading dashboard options...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-background-card rounded-lg shadow-xl border border-[#262626] p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-heading font-bold text-white text-center mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-foreground-subtle text-center mb-6">{error || 'An error occurred'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 font-subheading font-semibold"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const { trainingCompleted, canAccessWorkDashboard, progress, requiresOsmUsername, hasOsmUsername } = status;

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-white mb-4">
            Welcome to <span className="text-primary">SC</span> Training Hub
          </h1>
          <p className="text-lg text-foreground-muted mb-2">
            {status.settlement} • {status.programType.replace('_', ' ').toUpperCase()}
            {status.moduleAssignment && status.programType === 'digitization' && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20">
                {status.moduleAssignment.toUpperCase()}
              </span>
            )}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-foreground-subtle">
              Training Progress: {progress.completed}/{progress.total} steps ({progress.percentage}%)
            </span>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Training Dashboard Card */}
          <button
            onClick={handleTrainingClick}
            className="bg-background-card rounded-2xl shadow-lg shadow-primary/10 p-8 text-left hover:shadow-2xl hover:shadow-primary/20 transition-all transform hover:-translate-y-1 border border-[#262626] hover:border-primary"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-4 rounded-xl border border-primary/30">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-subheading font-medium text-white bg-primary-dark px-3 py-1 rounded-full border border-primary">
                Always Available
              </span>
            </div>
            
            <h2 className="text-2xl font-heading font-bold text-white mb-3">
              Training Dashboard
            </h2>
            
            <p className="text-foreground-subtle mb-4">
              Continue your training modules, complete steps, and improve your mapping skills.
            </p>

            <div className="bg-background-elevated rounded-lg p-4 mb-4 border border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground-subtle">Progress</span>
                <span className="font-subheading font-medium text-white">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary-hover h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            {!trainingCompleted && progress.missingSteps.length > 0 && (
              <div className="text-sm text-foreground-subtle">
                <p className="font-subheading font-medium mb-1">Remaining steps:</p>
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
            className={`bg-background-card rounded-2xl shadow-lg p-8 text-left transition-all border ${
              canAccessWorkDashboard
                ? 'hover:shadow-2xl hover:shadow-primary/20 transform hover:-translate-y-1 border-[#262626] hover:border-primary cursor-pointer'
                : 'opacity-60 cursor-not-allowed border-[#262626]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-xl border ${
                canAccessWorkDashboard 
                  ? 'bg-primary/20 border-primary/30' 
                  : 'bg-[#1a1a1a] border-border'
              }`}>
                {canAccessWorkDashboard ? (
                  <Briefcase className="w-8 h-8 text-primary" />
                ) : (
                  <Lock className="w-8 h-8 text-foreground-subtle" />
                )}
              </div>
              {canAccessWorkDashboard ? (
                <span className="text-sm font-subheading font-medium text-white bg-primary-dark px-3 py-1 rounded-full border border-primary">
                  Unlocked
                </span>
              ) : (
                <span className="text-sm font-subheading font-medium text-foreground-subtle bg-background-elevated px-3 py-1 rounded-full border border-border">
                  Locked
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-heading font-bold text-white mb-3">
              Work Dashboard
            </h2>
            
            {canAccessWorkDashboard ? (
              <>
                <p className="text-foreground-subtle mb-4">
                  Track your daily mapping work, view building counts, and monitor your 20-day work period.
                </p>
                <div className="bg-primary-dark/50 border border-primary rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-subheading font-medium text-primary-light mb-1">You're ready to start working!</p>
                      <p className="text-foreground-muted">
                        All training steps completed. Click to view your work dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-foreground-subtle mb-4">
                  Track your daily mapping work, view building counts, and monitor your 20-day work period.
                </p>
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-subheading font-medium text-warning mb-2">Requirements to unlock:</p>
                      <ul className="space-y-1 text-foreground-muted">
                        {!trainingCompleted && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                            Complete all {progress.total} training steps ({progress.missingSteps.length} remaining)
                          </li>
                        )}
                        {requiresOsmUsername && !hasOsmUsername && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
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
        <div className="text-center mt-8 text-sm text-foreground-subtle">
          <p>Need help? Contact your training coordinator.</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  MapPin,
  FileText
} from 'lucide-react';
import NotificationToast from '@/components/notifications/NotificationToast';

interface DailyStats {
  today: number;
  target: number;
  percentage: number;
  changesetsAnalyzed: number;
  lastUpdated: string;
  cacheHit?: boolean;
  processingTime?: number;
}

interface WorkDays {
  daysWorked: number;
  daysWorked2025: number;
  daysWorked2026: number;
  totalDays: number;
  remaining: number;
  percentage: number;
  pendingDays: number;
  totalBuildings: number;
  daysTargetMet: number;
  avgBuildingsPerDay: number;
  startDate: string | null;
}

interface YouthProfile {
  youthId: string;
  settlement: string;
  fullName: string;
  programType: string;
}

export default function WorkDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [workDays, setWorkDays] = useState<WorkDays | null>(null);
  const [profile, setProfile] = useState<YouthProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  useEffect(() => {
    // Check access permission
    checkAccess();
    fetchAllData();
  }, []);

  const checkAccess = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/training/completion-status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect microtasking users to their training dashboard
        if (data.data.programType === 'microtasking') {
          router.push('/microtasking');
          return;
        }
        
        // Redirect users who haven't completed training
        if (!data.data.canAccessWorkDashboard) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Access check failed:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        router.push('/');
        return;
      }

      // First, sync work days from OSM stats (runs in background)
      fetch('/api/work/days/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(err => console.warn('Work days sync failed:', err));

      // Fetch daily stats, work days, and profile in parallel
      const [statsRes, daysRes, profileRes] = await Promise.all([
        fetch('/api/work/stats/daily', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/work/days/count', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/youth/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const daysData = await daysRes.json();
      const profileData = await profileRes.json();

      if (statsData.success) {
        setDailyStats(statsData.data);
      } else if (statsData.requiresOsmUsername) {
        router.push(statsData.redirectTo || '/digitization/mapper');
        return;
      } else {
        throw new Error(statsData.message);
      }

      if (daysData.success) {
        setWorkDays(daysData.data);
      } else {
        console.warn('Failed to fetch work days:', daysData.message);
      }

      if (profileData.success) {
        setProfile(profileData.data);
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/work/stats/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setDailyStats(data.data);
        setLastRefreshTime(new Date());

        // Re-fetch work days to update Performance Summary
        const daysRes = await fetch('/api/work/days/count', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const daysData = await daysRes.json();
        if (daysData.success) {
          setWorkDays(daysData.data);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      console.error('Error refreshing stats:', err);
      setError(err.message || 'Failed to refresh statistics');
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading work dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-foreground-subtle hover:text-primary mb-4 transition-colors font-subheading"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard Selection</span>
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Work Dashboard</h1>
              <p className="text-foreground-subtle">Track your daily mapping progress and work days</p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 font-subheading font-semibold"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-subheading font-medium text-error">Error</p>
              <p className="text-sm text-foreground-muted">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-error hover:text-primary-hover"
            >
              ×
            </button>
          </div>
        )}

        {/* Work Assignment Banners */}
        {profile?.settlement === 'Kayole' && profile?.youthId?.startsWith('KAY') && (
          <div className="mb-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 border-2 border-primary rounded-xl p-4 shadow-lg shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="bg-primary/30 p-2 rounded-lg border border-primary">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Your Work Assignment - Kayole Soweto
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Click the button below to access your mapping task on HOT Tasking Manager
                </p>
                
                <a
                  href="https://tasks.hotosm.org/projects/39443"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-subheading font-semibold shadow-lg shadow-primary/30 mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Open Task #39443</span>
                </a>

                <div className="bg-black/40 border border-primary/30 rounded-lg p-3 mt-3">
                  <h4 className="text-sm font-subheading font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Important: Add Hashtag Before Upload
                  </h4>
                  <p className="text-xs text-foreground-muted mb-2">
                    Before uploading your work to OpenStreetMap, you <span className="text-primary font-semibold">MUST</span> add the project hashtag in JOSM:
                  </p>
                  <div className="bg-background-elevated border border-border rounded px-3 py-1.5 font-mono text-primary text-base">
                    #DPW2025
                  </div>
                  <p className="text-xs text-foreground-subtle mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Without this hashtag, your work will not be counted in the statistics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile?.settlement === 'Kariobangi Machakos' && profile?.youthId?.startsWith('KAR') && (
          <div className="mb-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 border-2 border-primary rounded-xl p-4 shadow-lg shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="bg-primary/30 p-2 rounded-lg border border-primary">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Your Work Assignment - Kariobangi Machakos
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Click the button below to access your mapping task on HOT Tasking Manager
                </p>
                
                <a
                  href="https://tasks.hotosm.org/projects/36571"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-subheading font-semibold shadow-lg shadow-primary/30 mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Open Task #36571</span>
                </a>

                <div className="bg-black/40 border border-primary/30 rounded-lg p-3 mt-3">
                  <h4 className="text-sm font-subheading font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Important: Add Hashtag Before Upload
                  </h4>
                  <p className="text-xs text-foreground-muted mb-2">
                    Before uploading your work to OpenStreetMap, you <span className="text-primary font-semibold">MUST</span> add the project hashtag in JOSM:
                  </p>
                  <div className="bg-background-elevated border border-border rounded px-3 py-1.5 font-mono text-primary text-base">
                    #DPW2025
                  </div>
                  <p className="text-xs text-foreground-subtle mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Without this hashtag, your work will not be counted in the statistics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {profile?.settlement === 'Mji wa Huruma' && profile?.youthId?.startsWith('HUR') && (
          <div className="mb-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 border-2 border-primary rounded-xl p-4 shadow-lg shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="bg-primary/30 p-2 rounded-lg border border-primary">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Your Work Assignment - Mji wa Huruma
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Click the button below to access your mapping task on HOT Tasking Manager
                </p>
                
                <a
                  href="https://tasks.hotosm.org/projects/36603"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors font-subheading font-semibold shadow-lg shadow-primary/30 mb-3"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Open Task #36603</span>
                </a>

                <div className="bg-black/40 border border-primary/30 rounded-lg p-3 mt-3">
                  <h4 className="text-sm font-subheading font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Important: Add Hashtag Before Upload
                  </h4>
                  <p className="text-xs text-foreground-muted mb-2">
                    Before uploading your work to OpenStreetMap, you <span className="text-primary font-semibold">MUST</span> add the project hashtag in JOSM:
                  </p>
                  <div className="bg-background-elevated border border-border rounded px-3 py-1.5 font-mono text-primary text-base">
                    #DPW2025
                  </div>
                  <p className="text-xs text-foreground-subtle mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Without this hashtag, your work will not be counted in the statistics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Code of Conduct Banner for Digitization Users */}
        {profile?.programType === 'digitization' && (
          <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-2 border-blue-500 rounded-xl p-4 shadow-lg shadow-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500/30 p-2 rounded-lg border border-blue-500">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Youth Code of Conduct
                </h3>
                <p className="text-sm text-foreground-muted mb-3">
                  Review the important guidelines and expectations for all digitization participants
                </p>
                
                <a
                  href="/youth/code-of-conduct"
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-subheading font-semibold shadow-lg shadow-blue-500/30"
                >
                  <FileText className="w-5 h-5" />
                  <span>View Code of Conduct</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/*   onClick={() => setError(null)}
              className="text-error hover:text-primary-hover"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Today's Buildings Card */}
          <div className="bg-background-card rounded-2xl shadow-lg shadow-primary/10 p-8 border border-[#262626]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-subheading font-medium text-foreground-muted">Today's Progress</h3>
                  <p className="text-xs text-foreground-subtle">Buildings Mapped</p>
                </div>
              </div>
              
              {dailyStats?.cacheHit && (
                <span className="text-xs text-primary bg-primary-dark px-2 py-1 rounded border border-primary">
                  Cached
                </span>
              )}
            </div>

            {dailyStats ? (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-heading font-bold text-white">{dailyStats.today}</span>
                    <span className="text-2xl text-[#404040]">/</span>
                    <span className="text-2xl text-foreground-subtle">{dailyStats.target}</span>
                  </div>
                  <p className="text-sm text-foreground-subtle">
                    {dailyStats.percentage}% of daily target
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground-subtle">Progress</span>
                    <span className={`font-subheading font-medium ${
                      dailyStats.percentage >= 100 ? 'text-primary' : 'text-white'
                    }`}>
                      {dailyStats.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        dailyStats.percentage >= 100 
                          ? 'bg-gradient-to-r from-primary to-primary-hover' 
                          : 'bg-gradient-to-r from-primary to-primary-dark'
                      }`}
                      style={{ width: `${Math.min(dailyStats.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {dailyStats.percentage >= 100 && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3 flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <p className="text-sm font-subheading font-medium text-success">
                      Daily target achieved! Excellent work!
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-foreground-subtle mb-1">Changesets</p>
                    <p className="text-lg font-subheading font-semibold text-white">
                      {dailyStats.changesetsAnalyzed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-subtle mb-1">Last Upload</p>
                    <p className="text-lg font-subheading font-semibold text-white">
                      {formatTime(dailyStats.lastUpdated)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-foreground-subtle">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Work Days Card */}
          <div className="bg-background-card rounded-2xl shadow-lg shadow-info/10 p-8 border border-[#262626]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-info/20 p-3 rounded-xl border border-info/30">
                <Calendar className="w-6 h-6 text-info" />
              </div>
              <div>
                <h3 className="text-sm font-subheading font-medium text-foreground-muted">Work Period</h3>
                <p className="text-xs text-foreground-subtle">20-Day Contract</p>
              </div>
            </div>

            {workDays ? (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-heading font-bold text-white">{workDays.daysWorked}</span>
                    <span className="text-2xl text-[#404040]">/</span>
                    <span className="text-2xl text-foreground-subtle">{workDays.totalDays}</span>
                  </div>
                  <p className="text-sm text-foreground-subtle">
                    Days completed • {workDays.remaining} remaining
                  </p>
                  {(workDays.daysWorked2025 > 0 || workDays.daysWorked2026 > 0) && (
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {workDays.daysWorked2025 > 0 && (
                        <span className="text-foreground-subtle">
                          2025: <span className="text-white font-medium">{workDays.daysWorked2025}</span>
                        </span>
                      )}
                      {workDays.daysWorked2026 > 0 && (
                        <span className="text-foreground-subtle">
                          2026: <span className="text-white font-medium">{workDays.daysWorked2026}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground-subtle">Completion</span>
                    <span className="font-subheading font-medium text-white">{workDays.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-info to-primary h-3 rounded-full transition-all"
                      style={{ width: `${workDays.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-foreground-subtle mb-1">Total Buildings</p>
                    <p className="text-xl font-heading font-bold text-white">{workDays.totalBuildings.toLocaleString()}</p>
                  </div>
                  <div className="bg-background-elevated rounded-lg p-3 border border-border">
                    <p className="text-xs text-foreground-subtle mb-1">Avg per Day</p>
                    <p className="text-xl font-heading font-bold text-white">{workDays.avgBuildingsPerDay}</p>
                  </div>
                </div>

                {workDays.pendingDays > 0 && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <p className="text-sm text-foreground-muted">
                      {workDays.pendingDays} day{workDays.pendingDays > 1 ? 's' : ''} pending approval
                    </p>
                  </div>
                )}

                {workDays.startDate && (
                  <p className="text-xs text-foreground-subtle mt-4">
                    Started: {formatDate(workDays.startDate)}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-foreground-subtle">
                <p>No work days data</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {workDays && (
          <div className="bg-background-card rounded-2xl shadow-lg shadow-primary/10 p-8 border border-[#262626]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-white">Performance Summary</h3>
                <p className="text-sm text-foreground-subtle">Your mapping achievements</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-background-elevated rounded-xl border border-border">
                <Target className="w-8 h-8 text-info mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold text-white">{workDays.daysTargetMet}</p>
                <p className="text-sm text-foreground-subtle">Days Target Met</p>
              </div>

              <div className="text-center p-4 bg-background-elevated rounded-xl border border-border">
                <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold text-white">{workDays.totalBuildings.toLocaleString()}</p>
                <p className="text-sm text-foreground-subtle">Total Buildings</p>
              </div>

              <div className="text-center p-4 bg-background-elevated rounded-xl border border-border">
                <Calendar className="w-8 h-8 text-primary-hover mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold text-white">{workDays.daysWorked}</p>
                <p className="text-sm text-foreground-subtle">Days Worked</p>
              </div>

              <div className="text-center p-4 bg-background-elevated rounded-xl border border-border">
                <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-2xl font-heading font-bold text-white">{workDays.avgBuildingsPerDay}</p>
                <p className="text-sm text-foreground-subtle">Daily Average</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        <div className="mt-6 text-center text-sm text-foreground-subtle">
          <p>Stats last refreshed at {formatTime(lastRefreshTime.toISOString())}</p>
          <p className="text-xs mt-1">Automatic updates every 5 minutes</p>
        </div>
      </div>

      {/* Notification Toast */}
      {profile && <NotificationToast youthId={profile.youthId} />}
    </div>
  );
}

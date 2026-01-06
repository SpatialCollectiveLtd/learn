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
  ArrowLeft
} from 'lucide-react';

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
  totalDays: number;
  remaining: number;
  percentage: number;
  pendingDays: number;
  totalBuildings: number;
  daysTargetMet: number;
  avgBuildingsPerDay: number;
  startDate: string | null;
}

export default function WorkDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [workDays, setWorkDays] = useState<WorkDays | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  useEffect(() => {
    // Check access permission
    checkAccess();
    fetchAllData();
  }, []);

  const checkAccess = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/training/completion-status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success && !data.data.canAccessWorkDashboard) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Access check failed:', err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/');
        return;
      }

      // Fetch daily stats and work days in parallel
      const [statsRes, daysRes] = await Promise.all([
        fetch('/api/work/stats/daily', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/work/days/count', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsRes.json();
      const daysData = await daysRes.json();

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
      const token = localStorage.getItem('authToken');
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading work dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard Selection</span>
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Work Dashboard</h1>
              <p className="text-gray-400">Track your daily mapping progress and work days</p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-300">Error</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Today's Buildings Card */}
          <div className="bg-gray-900 rounded-2xl shadow-lg shadow-cyan-500/10 p-8 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-600/20 p-3 rounded-xl border border-cyan-500/30">
                  <Building2 className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-300">Today's Progress</h3>
                  <p className="text-xs text-gray-500">Buildings Mapped</p>
                </div>
              </div>
              
              {dailyStats?.cacheHit && (
                <span className="text-xs text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800">
                  Cached
                </span>
              )}
            </div>

            {dailyStats ? (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">{dailyStats.today}</span>
                    <span className="text-2xl text-gray-600">/</span>
                    <span className="text-2xl text-gray-400">{dailyStats.target}</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {dailyStats.percentage}% of daily target
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className={`font-medium ${
                      dailyStats.percentage >= 100 ? 'text-cyan-400' : 'text-white'
                    }`}>
                      {dailyStats.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        dailyStats.percentage >= 100 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                          : 'bg-gradient-to-r from-cyan-500 to-cyan-700'
                      }`}
                      style={{ width: `${Math.min(dailyStats.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {dailyStats.percentage >= 100 && (
                  <div className="bg-cyan-950/50 border border-cyan-800 rounded-lg p-3 flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    <p className="text-sm font-medium text-cyan-300">
                      Daily target achieved! Excellent work! 🎉
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Changesets</p>
                    <p className="text-lg font-semibold text-white">
                      {dailyStats.changesetsAnalyzed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Upload</p>
                    <p className="text-lg font-semibold text-white">
                      {formatTime(dailyStats.lastUpdated)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Work Days Card */}
          <div className="bg-gray-900 rounded-2xl shadow-lg shadow-blue-500/10 p-8 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-300">Work Period</h3>
                <p className="text-xs text-gray-500">20-Day Contract</p>
              </div>
            </div>

            {workDays ? (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">{workDays.daysWorked}</span>
                    <span className="text-2xl text-gray-600">/</span>
                    <span className="text-2xl text-gray-400">{workDays.totalDays}</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Days completed • {workDays.remaining} remaining
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Completion</span>
                    <span className="font-medium text-white">{workDays.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${workDays.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Total Buildings</p>
                    <p className="text-xl font-bold text-white">{workDays.totalBuildings.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Avg per Day</p>
                    <p className="text-xl font-bold text-white">{workDays.avgBuildingsPerDay}</p>
                  </div>
                </div>

                {workDays.pendingDays > 0 && (
                  <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <p className="text-sm text-amber-300">
                      {workDays.pendingDays} day{workDays.pendingDays > 1 ? 's' : ''} pending approval
                    </p>
                  </div>
                )}

                {workDays.startDate && (
                  <p className="text-xs text-gray-500 mt-4">
                    Started: {formatDate(workDays.startDate)}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No work days data</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        {workDays && (
          <div className="bg-gray-900 rounded-2xl shadow-lg shadow-purple-500/10 p-8 border border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Performance Summary</h3>
                <p className="text-sm text-gray-400">Your mapping achievements</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{workDays.daysTargetMet}</p>
                <p className="text-sm text-gray-400">Days Target Met</p>
              </div>

              <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Building2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{workDays.totalBuildings.toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Buildings</p>
              </div>

              <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{workDays.daysWorked}</p>
                <p className="text-sm text-gray-400">Days Worked</p>
              </div>

              <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <TrendingUp className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{workDays.avgBuildingsPerDay}</p>
                <p className="text-sm text-gray-400">Daily Average</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Stats last refreshed at {formatTime(lastRefreshTime.toISOString())}</p>
          <p className="text-xs mt-1">Automatic updates every 5 minutes</p>
        </div>
      </div>
    </div>
  );
}

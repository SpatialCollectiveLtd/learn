'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp,
  Trophy,
  Medal,
  Target,
  AlertCircle,
  RefreshCw,
  Crown,
  Award,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PersonalMetrics {
  quality_score: number;
  attendance_rate: number;
  total_pois_submitted?: number;
  total_earnings?: number;
  total_days_worked?: number;
  avg_pois_per_day?: number;
  overall_score?: number;
}

interface LeaderboardEntry {
  rank?: number;
  youth_id: string;
  name?: string;
  settlement?: string;
  overall_score?: number;
  quality_score: number;
  attendance_rate?: number;
  total_pois?: number;
  total_earnings?: number;
  total_days?: number;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

interface SettlementRanking {
  settlement: string;
  participants?: number;
  total_participants?: number;
  avg_quality_score?: number;
  avg_earnings?: number;
  total_days_worked?: number;
  youth_rank?: number;
  top_10?: LeaderboardEntry[];
}

interface PerformanceData {
  youth_id: string;
  settlement?: string;
  period?: string;
  personal_metrics: PersonalMetrics;
  leaderboard?: LeaderboardEntry[];
  user_ranking?: {
    earnings_rank?: number;
    quality_rank?: number;
    total_participants?: number;
  };
  last_updated?: string;
  sync_status?: string;
  message?: string;
}

export default function PerformanceTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDPWData, setShowDPWData] = useState(true); // Default to DPW data
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  const safeNumber = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return value.toFixed(decimals);
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [showDPWData]);

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Choose endpoint based on toggle
      const endpoint = showDPWData 
        ? '/api/youth/performance/dpw' 
        : '/api/youth/performance';

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) {
        setPerformanceData(result);
      } else {
        setError(result.error?.message || result.message || 'Failed to load performance data');
      }
    } catch (err: any) {
      console.error('Performance fetch error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPerformanceData();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <Trophy className="w-4 h-4 text-foreground-subtle" />;
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-primary';
    if (rank <= 10) return 'text-success';
    return 'text-foreground-subtle';
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-subtle text-sm">Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Error Loading Performance Data</p>
            <p className="text-xs text-foreground-muted">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-primary hover:text-primary-hover"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground-subtle">No performance data available</p>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground-subtle">No performance data available</p>
      </div>
    );
  }

  const { personal_metrics, leaderboard = [] } = performanceData;
  
  // For backward compatibility with non-DPW data (settlement_ranking not used for DPW)
  const settlement_ranking = (performanceData as any).settlement_ranking || [];
  
  // For DPW data, use earnings ranking
  const userRank = showDPWData 
    ? (performanceData.user_ranking?.earnings_rank || 0)
    : (settlement_ranking[0]?.youth_rank || 0);
    
  const isTopPerformer = userRank <= 10;

  return (
    <div className="p-4 space-y-4">
      {/* Header with Toggle and Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Performance Metrics</h2>
        <div className="flex items-center gap-3">
          {/* DPW Data Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-subtle">Regular</span>
            <button
              onClick={() => setShowDPWData(!showDPWData)}
              className="flex-shrink-0"
            >
              {showDPWData ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-foreground-muted" />
              )}
            </button>
            <span className="text-xs text-foreground-subtle">DPW</span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Display for DPW Data */}
      {showDPWData && performanceData?.period && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-white">Performance Period: {performanceData.period}</span>
          </div>
        </div>
      )}

      {/* Your Rank Card */}
      <div className={`
        rounded-xl p-6 text-center border-2
        ${isTopPerformer 
          ? 'bg-gradient-to-br from-primary/20 to-primary-dark/20 border-primary' 
          : 'bg-background-elevated border-border'
        }
      `}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {getRankIcon(userRank)}
          <p className="text-foreground-subtle text-sm">
            {showDPWData ? 'Your Earnings Rank' : `Your Rank in ${settlement_ranking[0]?.settlement || 'Settlement'}`}
          </p>
        </div>
        <div className={`text-5xl font-heading font-bold mb-1 ${getRankColor(userRank)}`}>
          #{userRank || '--'}
        </div>
        <p className="text-foreground-subtle text-xs">
          {showDPWData 
            ? `Out of ${performanceData.user_ranking?.total_participants || leaderboard.length} participants` 
            : `Out of ${settlement_ranking[0]?.total_participants || settlement_ranking[0]?.participants || '0'} participants`
          }
        </p>
      </div>

      {/* Personal Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Show Overall Score only for regular data */}
        {!showDPWData && personal_metrics?.overall_score !== undefined && (
          <div className="bg-background-elevated border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-foreground-subtle">Overall Score</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {safeNumber(personal_metrics.overall_score, 1)}%
            </p>
          </div>
        )}
        
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-info" />
            <span className="text-xs text-foreground-subtle">Quality Score</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {safeNumber(personal_metrics?.quality_score, 1)}%
          </p>
        </div>
        
        {/* Attendance Rate */}
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground-subtle">Attendance Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {safeNumber(personal_metrics?.attendance_rate, 0)}%
          </p>
        </div>
        
        {/* Show POIs for regular data, Earnings for DPW */}
        {showDPWData && personal_metrics?.total_earnings !== undefined ? (
          <div className="bg-background-elevated border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="text-xs text-foreground-subtle">Total Earnings</span>
            </div>
            <p className="text-lg font-bold text-white">
              KES {(personal_metrics.total_earnings || 0).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="bg-background-elevated border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-warning" />
              <span className="text-xs text-foreground-subtle">{showDPWData ? 'Total Days' : 'Total POIs'}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {showDPWData 
                ? (personal_metrics?.total_days_worked || 0)
                : (personal_metrics?.total_pois_submitted || 0)
              }
            </p>
          </div>
        )}
        
        {/* Show Avg POIs per day only for regular data */}
        {!showDPWData && personal_metrics?.avg_pois_per_day !== undefined && (
          <div className="bg-background-elevated border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-foreground-subtle">Avg Per Day</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {safeNumber(personal_metrics.avg_pois_per_day, 0)}
            </p>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="bg-background-elevated border border-border rounded-lg p-4">
        <h3 className="text-sm font-subheading font-semibold text-white mb-3">Score Breakdown</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground-subtle">Quality (70% weight)</span>
              <span className="text-white font-semibold">
                {(personal_metrics?.quality_score !== undefined && personal_metrics?.quality_score !== null && !isNaN(personal_metrics.quality_score)) 
                  ? personal_metrics.quality_score.toFixed(1) 
                  : '0.0'}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-info rounded-full transition-all"
                style={{ width: `${personal_metrics?.quality_score || 0}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground-subtle">Attendance (30% weight)</span>
              <span className="text-white font-semibold">
                {(personal_metrics?.attendance_rate !== undefined && personal_metrics?.attendance_rate !== null && !isNaN(personal_metrics.attendance_rate)) 
                  ? personal_metrics.attendance_rate.toFixed(1) 
                  : '0.0'}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${personal_metrics?.attendance_rate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {((showDPWData && leaderboard && leaderboard.length > 0) || (!showDPWData && settlement_ranking[0]?.top_10 && settlement_ranking[0].top_10.length > 0)) && (
        <div className="space-y-3">
          <h3 className="text-sm font-subheading font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            {showDPWData ? 'Top Earners' : `Top 10 - ${settlement_ranking[0]?.settlement || 'Settlement'}`}
          </h3>
          
          <div className="bg-background-elevated border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border">
              {(() => {
                const currentLeaderboard = showDPWData ? (leaderboard || []) : (settlement_ranking[0]?.top_10 || []);
                const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
                const endIndex = startIndex + pagination.itemsPerPage;
                const paginatedEntries = currentLeaderboard.slice(startIndex, endIndex);
                
                // Update pagination total when data changes
                if (pagination.totalItems !== currentLeaderboard.length) {
                  setPagination(prev => ({ ...prev, totalItems: currentLeaderboard.length }));
                }
                
                return paginatedEntries.map((entry: LeaderboardEntry, index: number) => {
                  const isCurrentUser = entry.youth_id === performanceData.youth_id;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        p-3 flex items-center gap-3 transition-colors
                        ${isCurrentUser ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-background'}
                      `}
                    >
                      <div className="w-8 flex-shrink-0 text-center">
                        {getRankIcon(showDPWData ? (startIndex + index + 1) : (entry.rank || index + 1))}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                          {isCurrentUser ? 'You' : (showDPWData && entry.name ? entry.name : entry.youth_id)}
                        </p>
                        <p className="text-xs text-foreground-subtle">
                          {showDPWData ? (
                            <>
                              KES {(entry.total_earnings || 0).toLocaleString()} • {entry.total_days || 0} days • {safeNumber(entry.quality_score, 1)}% quality
                            </>
                          ) : (
                            <>
                              {entry.total_pois || 0} POIs • {safeNumber(entry.quality_score, 1)}% quality
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalItems > pagination.itemsPerPage && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-foreground-muted">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} participants
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                  disabled={pagination.currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 bg-background-elevated border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium">
                  {pagination.currentPage} of {Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(Math.ceil(prev.totalItems / prev.itemsPerPage), prev.currentPage + 1) }))}
                  disabled={pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
                  className="flex items-center gap-1 px-3 py-1 bg-background-elevated border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-info/10 border border-info/30 rounded-lg p-3">
        <p className="text-xs text-foreground-muted">
          <strong>Note:</strong> {showDPWData 
            ? 'DPW performance data covers Jan 7 - Feb 6, 2026. Rankings based on total earnings.' 
            : 'Overall score = (Quality × 70%) + (Attendance × 30%). Rankings are settlement-specific and updated daily.'
          }
        </p>
      </div>
    </div>
  );
}

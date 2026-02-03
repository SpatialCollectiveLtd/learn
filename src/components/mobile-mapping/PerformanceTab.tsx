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
  Award
} from 'lucide-react';

interface PersonalMetrics {
  quality_score: number;
  attendance_rate: number;
  total_pois_submitted: number;
  avg_pois_per_day: number;
  overall_score: number;
}

interface LeaderboardEntry {
  rank: number;
  youth_id: string;
  overall_score: number;
  quality_score: number;
  attendance_rate: number;
  total_pois: number;
}

interface SettlementRanking {
  settlement: string;
  total_participants: number;
  youth_rank: number;
  top_10: LeaderboardEntry[];
}

interface PerformanceData {
  youth_id: string;
  settlement: string;
  personal_metrics: PersonalMetrics;
  settlement_ranking: SettlementRanking;
  last_updated: string;
  sync_status: string;
}

export default function PerformanceTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/youth/performance', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setPerformanceData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load performance data');
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

  const { personal_metrics, settlement_ranking } = performanceData;
  const isTopPerformer = settlement_ranking.youth_rank <= 10;

  return (
    <div className="p-4 space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Performance Metrics</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Your Rank Card */}
      <div className={`
        rounded-xl p-6 text-center border-2
        ${isTopPerformer 
          ? 'bg-gradient-to-br from-primary/20 to-primary-dark/20 border-primary' 
          : 'bg-background-elevated border-border'
        }
      `}>
        <div className="flex items-center justify-center gap-2 mb-2">
          {getRankIcon(settlement_ranking.youth_rank)}
          <p className="text-foreground-subtle text-sm">Your Rank in {settlement_ranking.settlement}</p>
        </div>
        <div className={`text-5xl font-heading font-bold mb-1 ${getRankColor(settlement_ranking.youth_rank)}`}>
          #{settlement_ranking.youth_rank}
        </div>
        <p className="text-foreground-subtle text-xs">
          Out of {settlement_ranking.total_participants} participants
        </p>
      </div>

      {/* Personal Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-success" />
            <span className="text-xs text-foreground-subtle">Overall Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{personal_metrics.overall_score.toFixed(1)}%</p>
        </div>
        
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-info" />
            <span className="text-xs text-foreground-subtle">Quality Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{personal_metrics.quality_score.toFixed(1)}%</p>
        </div>
        
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground-subtle">Total POIs</span>
          </div>
          <p className="text-2xl font-bold text-white">{personal_metrics.total_pois_submitted}</p>
        </div>
        
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-xs text-foreground-subtle">Avg Per Day</span>
          </div>
          <p className="text-2xl font-bold text-white">{personal_metrics.avg_pois_per_day.toFixed(0)}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-background-elevated border border-border rounded-lg p-4">
        <h3 className="text-sm font-subheading font-semibold text-white mb-3">Score Breakdown</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground-subtle">Quality (70% weight)</span>
              <span className="text-white font-semibold">{personal_metrics.quality_score.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-info rounded-full transition-all"
                style={{ width: `${personal_metrics.quality_score}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground-subtle">Attendance (30% weight)</span>
              <span className="text-white font-semibold">{personal_metrics.attendance_rate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${personal_metrics.attendance_rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        <h3 className="text-sm font-subheading font-semibold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Top 10 - {settlement_ranking.settlement}
        </h3>
        
        <div className="bg-background-elevated border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {settlement_ranking.top_10.map((entry, index) => {
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
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                      {isCurrentUser ? 'You' : entry.youth_id}
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {entry.total_pois} POIs • {entry.quality_score.toFixed(1)}% quality
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getRankColor(entry.rank)}`}>
                      {entry.overall_score.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-info/10 border border-info/30 rounded-lg p-3">
        <p className="text-xs text-foreground-muted">
          <strong>Note:</strong> Overall score = (Quality × 70%) + (Attendance × 30%). 
          Rankings are settlement-specific and updated daily.
        </p>
      </div>
    </div>
  );
}

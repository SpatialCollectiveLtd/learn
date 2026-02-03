'use client';

import { useEffect, useState } from 'react';
import { 
  Award,
  Lock,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Badge {
  badge_id: string;
  name: string;
  description: string;
  tier: string;
  icon: string;
  earned: boolean;
  progress: number;
  earned_at: string | null;
}

interface BadgeMetrics {
  totalPois: number;
  workDays: number;
  avgQuality: number;
  rank: number;
  consecutiveDays: number;
}

interface BadgesData {
  youth_id: string;
  total_badges: number;
  earned_badges: number;
  badges: Badge[];
  metrics: BadgeMetrics;
  last_updated: string;
}

export default function BadgesTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [badgesData, setBadgesData] = useState<BadgesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterEarned, setFilterEarned] = useState<boolean | null>(null);

  useEffect(() => {
    fetchBadgesData();
  }, []);

  const fetchBadgesData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('youthToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/youth/badges', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setBadgesData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load badges');
      }
    } catch (err: any) {
      console.error('Badges fetch error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBadgesData();
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      case 'silver': return 'from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 'bronze': return 'from-amber-700/20 to-amber-800/20 border-amber-700/50';
      default: return 'from-foreground-subtle/10 to-foreground-subtle/20 border-border';
    }
  };

  const getTierTextColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'text-yellow-500';
      case 'silver': return 'text-gray-400';
      case 'bronze': return 'text-amber-700';
      default: return 'text-foreground-subtle';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-subtle text-sm">Loading badges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Error Loading Badges</p>
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

  if (!badgesData) {
    return (
      <div className="p-6 text-center">
        <p className="text-foreground-subtle">No badge data available</p>
      </div>
    );
  }

  const filteredBadges = filterEarned === null 
    ? badgesData.badges 
    : badgesData.badges.filter(b => b.earned === filterEarned);

  return (
    <div className="p-4 space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-white">Achievements</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Progress Summary */}
      <div className="bg-gradient-to-br from-primary/20 to-primary-dark/20 border border-primary/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-white">Your Progress</span>
          </div>
          <span className="text-2xl font-bold text-primary">
            {badgesData.earned_badges}/{badgesData.total_badges}
          </span>
        </div>
        
        <div className="h-3 bg-background-elevated rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
            style={{ width: `${(badgesData.earned_badges / badgesData.total_badges) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-foreground-subtle text-center">
          {Math.round((badgesData.earned_badges / badgesData.total_badges) * 100)}% Complete
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterEarned(null)}
          className={`
            flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors
            ${filterEarned === null 
              ? 'bg-primary text-white' 
              : 'bg-background-elevated text-foreground-subtle hover:bg-background'
            }
          `}
        >
          All ({badgesData.total_badges})
        </button>
        <button
          onClick={() => setFilterEarned(true)}
          className={`
            flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors
            ${filterEarned === true 
              ? 'bg-success text-white' 
              : 'bg-background-elevated text-foreground-subtle hover:bg-background'
            }
          `}
        >
          Earned ({badgesData.earned_badges})
        </button>
        <button
          onClick={() => setFilterEarned(false)}
          className={`
            flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors
            ${filterEarned === false 
              ? 'bg-foreground-subtle text-white' 
              : 'bg-background-elevated text-foreground-subtle hover:bg-background'
            }
          `}
        >
          Locked ({badgesData.total_badges - badgesData.earned_badges})
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredBadges.map((badge) => (
          <div
            key={badge.badge_id}
            className={`
              bg-gradient-to-br rounded-xl p-4 border-2 transition-all
              ${badge.earned 
                ? `${getTierColor(badge.tier)} shadow-lg` 
                : 'from-background-elevated to-background-elevated border-border opacity-60'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Badge Icon */}
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0
                ${badge.earned ? 'bg-white/10' : 'bg-background-elevated'}
              `}>
                {badge.earned ? badge.icon : <Lock className="w-6 h-6 text-foreground-subtle" />}
              </div>
              
              {/* Badge Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate ${badge.earned ? 'text-white' : 'text-foreground-subtle'}`}>
                    {badge.name}
                  </h3>
                  {badge.earned && (
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-xs text-foreground-subtle mb-2">{badge.description}</p>
                
                {/* Tier Badge */}
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold uppercase
                    ${getTierTextColor(badge.tier)}
                    ${badge.earned ? 'bg-white/10' : 'bg-background-elevated'}
                  `}>
                    {badge.tier}
                  </span>
                  
                  {badge.earned && badge.earned_at && (
                    <span className="text-xs text-foreground-subtle">
                      {new Date(badge.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                
                {/* Progress Bar (for locked badges) */}
                {!badge.earned && badge.progress > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground-subtle">Progress</span>
                      <span className="text-white font-semibold">{badge.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-background-elevated rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-foreground-subtle mx-auto mb-3" />
          <p className="text-foreground-subtle text-sm">
            {filterEarned === true ? 'No badges earned yet. Keep working!' : 'No locked badges'}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  RefreshCw, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Smartphone,
  MapPin,
  User,
  TrendingUp
} from 'lucide-react';
import WorkDashboardTabs from '@/components/mobile-mapping/WorkDashboardTabs';
import PaymentTab from '@/components/mobile-mapping/PaymentTab';
import PerformanceTab from '@/components/mobile-mapping/PerformanceTab';
import BadgesTab from '@/components/mobile-mapping/BadgesTab';
import ResolveCenterTab from '@/components/mobile-mapping/ResolveCenterTab';

interface WorkDays {
  daysWorked: number;
  totalDays: number;
  remaining: number;
  percentage: number;
  startDate: string | null;
  currentDay: number;
}

interface YouthProfile {
  youthId: string;
  settlement: string;
  fullName: string;
  programType: string;
}

export default function MobileMappingWorkDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workDays, setWorkDays] = useState<WorkDays | null>(null);
  const [profile, setProfile] = useState<YouthProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) {
        router.push('/');
        return;
      }

      
      const statusResponse = await fetch('/api/training/completion-status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const statusData = await statusResponse.json();

      if (statusData.success) {
        
        if (statusData.data.programType !== 'mobile_mapping') {
          router.push('/dashboard');
          return;
        }
        
        
        if (!statusData.data.trainingCompleted) {
          router.push('/mobile-mapping');
          return;
        }
      }

      
      const [profileRes, daysRes] = await Promise.all([
        fetch('/api/youth/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/work/days/count?programType=mobile_mapping', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const profileData = await profileRes.json();
      const daysData = await daysRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }

      if (daysData.success) {
        setWorkDays(daysData.data);
      }

    } catch (err: any) {
      
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  
  const calculateCurrentWorkDay = () => {
    if (!workDays?.startDate) return 0;
    
    const start = new Date(workDays.startDate);
    const today = new Date();
    
    
    const nairobiOffset = 3 * 60; 
    const localOffset = today.getTimezoneOffset();
    today.setMinutes(today.getMinutes() + localOffset + nairobiOffset);
    
    let workDayCount = 0;
    const current = new Date(start);
    
    while (current <= today && workDayCount < 20) {
      const dayOfWeek = current.getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDayCount++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return Math.min(workDayCount, 20);
  };

  const currentWorkDay = calculateCurrentWorkDay();

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
    <div className="min-h-screen bg-black py-6 px-4">
      <div className="max-w-lg mx-auto">
        {}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-foreground-subtle hover:text-primary mb-4 transition-colors font-subheading"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">Work Dashboard</h1>
              <p className="text-foreground-subtle text-sm">Mobile Mapping</p>
            </div>
          </div>
        </div>

        {}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground-muted">{error}</p>
          </div>
        )}

        {}
        {profile && (
          <div className="mb-6 bg-background-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-subheading font-semibold text-white">{profile.fullName}</h3>
                <p className="text-xs text-foreground-subtle">{profile.youthId}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-foreground-subtle text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{profile.settlement}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="mb-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 border-2 border-primary rounded-xl p-6 text-center">
          <p className="text-foreground-subtle text-sm mb-2">Current Work Day</p>
          <div className="text-5xl font-heading font-bold text-white mb-1">
            {currentWorkDay}
            <span className="text-2xl text-foreground-subtle"> / 20</span>
          </div>
          {workDays?.startDate && (
            <p className="text-foreground-subtle text-xs mt-2">
              Started: {new Date(workDays.startDate).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          )}
        </div>

        {}
        <div className="mb-6 bg-background-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-foreground-subtle text-sm">Work Period Progress</span>
            <span className="text-primary font-semibold">{Math.round((currentWorkDay / 20) * 100)}%</span>
          </div>
          <div className="h-4 bg-background-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
              style={{ width: `${(currentWorkDay / 20) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-foreground-subtle">
            <span>Day 1</span>
            <span>Day 20</span>
          </div>
        </div>

        {}
        <div className="mb-6 bg-background-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-subheading font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Work Days Calendar
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }, (_, i) => {
              const dayNum = i + 1;
              const isPast = dayNum < currentWorkDay;
              const isToday = dayNum === currentWorkDay;
              const isFuture = dayNum > currentWorkDay;
              
              return (
                <div
                  key={dayNum}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all
                    ${isPast ? 'bg-success/20 text-success border border-success/30' : ''}
                    ${isToday ? 'bg-primary text-white border-2 border-primary shadow-lg shadow-primary/30 scale-110' : ''}
                    ${isFuture ? 'bg-background-elevated text-foreground-subtle border border-border' : ''}
                  `}
                >
                  {isPast ? <CheckCircle className="w-4 h-4" /> : dayNum}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-foreground-subtle mt-3 text-center">
            ✓ = Completed • Weekdays only (Mon-Fri)
          </p>
        </div>

        {}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-heading font-bold text-white">{Math.max(0, currentWorkDay - 1)}</p>
            <p className="text-xs text-foreground-subtle">Days Completed</p>
          </div>
          <div className="bg-background-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-info" />
            </div>
            <p className="text-2xl font-heading font-bold text-white">{Math.max(0, 20 - currentWorkDay)}</p>
            <p className="text-xs text-foreground-subtle">Days Remaining</p>
          </div>
        </div>

        {}
        <div className="bg-info/10 border border-info/30 rounded-xl p-4">
          <h3 className="text-sm font-subheading font-semibold text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-info" />
            Important Notes
          </h3>
          <ul className="text-xs text-foreground-muted space-y-1.5">
            <li>• Work days are counted Monday to Friday only</li>
            <li>• Each day counts regardless of submission time</li>
            <li>• Submit your ODK forms daily</li>
            <li>• Contact your supervisor for any issues</li>
          </ul>
        </div>

        {}
        <div className="mb-6 bg-background-card border border-border rounded-xl overflow-hidden">
          <WorkDashboardTabs
            paymentTab={<PaymentTab />}
            performanceTab={<PerformanceTab />}
            badgesTab={<BadgesTab />}
            resolveTab={<ResolveCenterTab />}
          />
        </div>

        {}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/mobile-mapping')}
            className="text-primary hover:text-primary-hover transition-colors text-sm font-subheading"
          >
            Review Training Materials →
          </button>
        </div>
      </div>
    </div>
  );
}

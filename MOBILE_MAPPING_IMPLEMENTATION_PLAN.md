# Mobile Mapping Features - Implementation Plan

**Date:** February 2, 2026  
**Target:** SC Learning Platform - Mobile Mapping Module  
**Features:** Payment Breakdown, Performance Analytics, Resolve Center, Badge System  
**Timeline:** 2-3 weeks development + 1 week testing

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [Architecture & Design](#architecture--design)
4. [Component Structure](#component-structure)
5. [API Integration](#api-integration)
6. [Database Changes](#database-changes)
7. [UI/UX Design](#uiux-design)
8. [Development Roadmap](#development-roadmap)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Plan](#deployment-plan)

---

## Executive Summary

### Goals
- **Empower youth** with transparent payment tracking and performance insights
- **Reduce support burden** through self-service resolve center
- **Increase motivation** via gamification (badges, leaderboards)
- **Leverage existing infrastructure** from DPW Manager API

### Success Metrics
- 90%+ youth check payment dashboard weekly
- 50% reduction in payment-related support queries
- Increased engagement (measured by daily logins)
- Positive feedback from youth on transparency

### Key Dependencies
1. **DPW Manager API** must implement endpoints per specification (2-week timeline)
2. **Testing data** available in staging environment
3. **API key** for production access

---

## Feature Overview

### 1. Payment Breakdown Dashboard 💰

**What Youth See:**
- **Today's earnings:** POIs submitted, quality score, estimated pay
- **Current period summary:** Total earnings, days worked, breakdown by type
- **Daily details:** Per-work-day table showing how payment was calculated
- **Payment formula:** Transparent explanation of base + quality + performance

**Value:**
- Eliminates "Where's my money?" confusion
- Shows exactly how quality affects earnings
- Motivates higher quality work

### 2. Performance & Leaderboard 🏆

**What Youth See:**
- **Personal metrics:** Quality score trend, attendance rate, overall score
- **Rankings:** Position in settlement + global ranking
- **Top 10 leaderboard:** See best performers (settlement-specific)
- **Comparison:** How they compare to settlement average

**Value:**
- Healthy competition drives performance
- Recognition for top performers
- Clear visibility into improvement areas

### 3. Resolve Center 🛠️

**What Youth Can Do:**
- Submit payment disputes, work day issues, technical problems
- Track query status (pending → in progress → resolved)
- View response history with admin replies
- Upload screenshots as evidence

**Value:**
- Self-service reduces WhatsApp/call volume
- Structured ticketing prevents issues from being lost
- Historical record of all communications

### 4. Badge System 🏅

**What Youth See:**
- **Earned badges:** Displayed on profile with dates
- **Locked badges:** Show progress toward unlocking
- **Badge tiers:** Bronze, Silver, Gold, Platinum
- **Achievement gallery:** Visual showcase of accomplishments

**Value:**
- Gamification increases engagement
- Non-monetary recognition
- Encourages specific behaviors (quality, attendance, consistency)

---

## Architecture & Design

### Page Structure

```
/mobile-mapping/work (Enhanced with tabs)
├── Overview Tab (Default - exists today)
│   ├── Work day counter
│   ├── Progress bar
│   └── User profile card
├── 💰 Payment Tab (NEW)
│   ├── Today's earnings card
│   ├── Period summary
│   ├── Daily breakdown table
│   └── Payment rules info
├── 🏆 Performance Tab (NEW)
│   ├── Personal metrics
│   ├── Rankings (settlement + global)
│   ├── Leaderboard (top 10)
│   └── Badges showcase
└── 🛠️ Resolve Center Tab (NEW)
    ├── Submit query form
    ├── Active queries list
    └── Resolved queries history

Floating Action Button (Mobile):
└── 🛠️ Quick Access to Resolve Center
```

### Component Hierarchy

```
MobileMappingWorkDashboard (page.tsx)
├── WorkDashboardTabs (new component)
│   ├── OverviewTab
│   │   ├── CurrentWorkDayCard
│   │   ├── WorkProgressCard
│   │   └── UserProfileCard
│   ├── PaymentTab
│   │   ├── TodayEarningsCard
│   │   ├── PeriodSummaryCard
│   │   ├── DailyBreakdownTable
│   │   └── PaymentRulesInfo
│   ├── PerformanceTab
│   │   ├── PersonalMetricsCard
│   │   ├── RankingsCard
│   │   ├── LeaderboardTable
│   │   └── BadgesShowcase
│   └── ResolveCenterTab
│       ├── SubmitQueryForm
│       ├── ActiveQueriesList
│       └── ResolvedQueriesList
└── FloatingResolveButton (mobile only)
```

---

## Component Structure

### 1. WorkDashboardTabs Component

**File:** `src/components/mobile-mapping/WorkDashboardTabs.tsx`

```tsx
'use client';

import { useState } from 'react';
import { DollarSign, Trophy, Wrench, BarChart } from 'lucide-react';

type TabType = 'overview' | 'payment' | 'performance' | 'resolve';

export function WorkDashboardTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: Trophy },
    { id: 'resolve', label: 'Resolve', icon: Wrench },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-primary text-primary font-semibold' 
                : 'border-transparent text-foreground-subtle hover:text-white'
              }
            `}
          >
            <tab.icon className="w-5 h-5" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'payment' && <PaymentTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'resolve' && <ResolveCenterTab />}
      </div>
    </div>
  );
}
```

### 2. PaymentTab Component

**File:** `src/components/mobile-mapping/PaymentTab.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Info } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PaymentData {
  payment_summary: {
    total_earnings: number;
    base_pay: number;
    quality_pay: number;
    performance_bonus: number;
    currency: string;
  };
  today_stats: {
    date: string;
    pois_submitted: number;
    quality_score: number;
    estimated_earnings: number;
    breakdown: {
      base_pay: number;
      quality_pay: number;
      performance_bonus: number;
    };
  };
  daily_breakdown: Array<{
    work_day: number;
    date: string;
    pois_submitted: number;
    quality_score: number;
    total_earnings: number;
    payment_formula: string;
  }>;
  payment_rules: {
    base_pay_per_day: number;
    quality_pay_max: number;
    quality_pay_formula: string;
    performance_thresholds: Array<{
      threshold: number;
      bonus: number;
    }>;
    currency: string;
  };
}

export function PaymentTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) return;

      const response = await fetch('/api/youth/payment/breakdown', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load payment data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading payment data..." />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <p className="text-error">{error || 'No payment data available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Earnings Card */}
      <TodayEarningsCard data={data.today_stats} />

      {/* Period Summary */}
      <PeriodSummaryCard data={data.payment_summary} />

      {/* Daily Breakdown Table */}
      <DailyBreakdownTable data={data.daily_breakdown} />

      {/* Payment Rules Info */}
      <PaymentRulesInfo data={data.payment_rules} />
    </div>
  );
}
```

### 3. PerformanceTab Component

**File:** `src/components/mobile-mapping/PerformanceTab.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Award, Users } from 'lucide-react';

interface PerformanceData {
  performance_metrics: {
    quality_score: {
      current: number;
      average: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    attendance_rate: {
      percentage: number;
      days_present: number;
      total_days: number;
    };
    overall_score: number;
  };
  rankings: {
    settlement_rank: {
      position: number;
      total_participants: number;
      percentile: number;
    };
    global_rank: {
      position: number;
      total_participants: number;
      percentile: number;
    };
  };
  leaderboard: {
    scope: 'settlement' | 'global';
    top_10: Array<{
      rank: number;
      youth_id: string;
      full_name: string;
      quality_score: number;
      attendance_rate: number;
      overall_score: number;
      is_current_user: boolean;
    }>;
  };
  badges_earned: Array<{
    badge_id: string;
    name: string;
    description: string;
    icon_url: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earned_at: string;
  }>;
}

export function PerformanceTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [leaderboardScope, setLeaderboardScope] = useState<'settlement' | 'global'>('settlement');

  useEffect(() => {
    fetchPerformanceData(leaderboardScope);
  }, [leaderboardScope]);

  const fetchPerformanceData = async (scope: 'settlement' | 'global') => {
    try {
      const token = localStorage.getItem('youthToken');
      if (!token) return;

      const response = await fetch(`/api/youth/performance?scope=${scope}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <LoadingSpinner message="Loading performance data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Personal Metrics */}
      <PersonalMetricsCard metrics={data.performance_metrics} />

      {/* Rankings */}
      <RankingsCard rankings={data.rankings} />

      {/* Leaderboard Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setLeaderboardScope('settlement')}
          className={`px-4 py-2 rounded-lg ${
            leaderboardScope === 'settlement'
              ? 'bg-primary text-white'
              : 'bg-background-elevated text-foreground-subtle'
          }`}
        >
          My Settlement
        </button>
        <button
          onClick={() => setLeaderboardScope('global')}
          className={`px-4 py-2 rounded-lg ${
            leaderboardScope === 'global'
              ? 'bg-primary text-white'
              : 'bg-background-elevated text-foreground-subtle'
          }`}
        >
          All Settlements
        </button>
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable data={data.leaderboard.top_10} scope={leaderboardScope} />

      {/* Badges Showcase */}
      <BadgesShowcase badges={data.badges_earned} />
    </div>
  );
}
```

### 4. ResolveCenterTab Component

**File:** `src/components/mobile-mapping/ResolveCenterTab.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type QueryCategory = 
  | 'payment_dispute'
  | 'work_day_dispute'
  | 'odk_technical'
  | 'general_question'
  | 'quality_score_query'
  | 'attendance_issue'
  | 'other';

interface Query {
  query_id: string;
  category: QueryCategory;
  subject: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  submitted_at: string;
  messages: Array<{
    sender_type: 'youth' | 'admin';
    sender_name: string;
    message: string;
    timestamp: string;
  }>;
}

export function ResolveCenterTab() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const token = localStorage.getItem('youthToken');
      const response = await fetch('/api/youth/queries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setQueries(result.data.queries);
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  };

  const activeQueries = queries.filter(q => 
    q.status === 'pending' || q.status === 'in_progress'
  );
  const resolvedQueries = queries.filter(q => 
    q.status === 'resolved' || q.status === 'closed'
  );

  return (
    <div className="space-y-6">
      {/* Submit Query Button */}
      <button
        onClick={() => setShowSubmitForm(true)}
        className="w-full bg-primary text-white py-4 px-6 rounded-xl hover:bg-primary-hover transition-colors font-semibold flex items-center justify-center gap-2"
      >
        <Send className="w-5 h-5" />
        Submit New Query
      </button>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <SubmitQueryForm 
          onClose={() => setShowSubmitForm(false)}
          onSubmit={() => {
            setShowSubmitForm(false);
            fetchQueries();
          }}
        />
      )}

      {/* Active Queries */}
      <div>
        <h3 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Active Queries ({activeQueries.length})
        </h3>
        {activeQueries.length === 0 ? (
          <p className="text-foreground-subtle text-sm">No active queries</p>
        ) : (
          <div className="space-y-4">
            {activeQueries.map(query => (
              <QueryCard key={query.query_id} query={query} />
            ))}
          </div>
        )}
      </div>

      {/* Resolved Queries */}
      <div>
        <h3 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Resolved Queries ({resolvedQueries.length})
        </h3>
        {resolvedQueries.length === 0 ? (
          <p className="text-foreground-subtle text-sm">No resolved queries</p>
        ) : (
          <div className="space-y-4">
            {resolvedQueries.map(query => (
              <QueryCard key={query.query_id} query={query} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## API Integration

### New API Routes to Create

#### 1. Payment Breakdown Proxy

**File:** `src/app/api/youth/payment/breakdown/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyYouthToken(token);
    const youthId = decoded.youthId;

    // Proxy request to DPW Manager API
    const dpwResponse = await fetch(
      `${process.env.DPW_MANAGER_BASE_URL}/api/v1/youth/${youthId}/payment/breakdown?period=current&include_daily=true`,
      {
        headers: {
          'X-API-Key': process.env.DPW_MANAGER_API_KEY || '',
        },
      }
    );

    const data = await dpwResponse.json();

    if (!dpwResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to fetch payment data' },
        { status: dpwResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

#### 2. Performance Proxy

**File:** `src/app/api/youth/performance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyYouthToken(token);
    const youthId = decoded.youthId;

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'settlement';

    // Proxy to DPW Manager
    const dpwResponse = await fetch(
      `${process.env.DPW_MANAGER_BASE_URL}/api/v1/youth/${youthId}/performance?scope=${scope}`,
      {
        headers: {
          'X-API-Key': process.env.DPW_MANAGER_API_KEY || '',
        },
      }
    );

    const data = await dpwResponse.json();

    if (!dpwResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to fetch performance data' },
        { status: dpwResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

#### 3. Query Submission

**File:** `src/app/api/youth/queries/submit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyYouthToken(token);
    const body = await request.json();

    // Add youth_id from token
    body.youth_id = decoded.youthId;

    // Add metadata
    body.metadata = {
      settlement: decoded.settlement,
      submitted_from: 'learning_platform',
      user_agent: request.headers.get('user-agent') || '',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    };

    // Submit to DPW Manager
    const dpwResponse = await fetch(
      `${process.env.DPW_MANAGER_BASE_URL}/api/v1/youth/queries/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.DPW_MANAGER_API_KEY || '',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await dpwResponse.json();

    if (!dpwResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to submit query' },
        { status: dpwResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

#### 4. Query List

**File:** `src/app/api/youth/queries/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyYouthToken(token);
    const youthId = decoded.youthId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Fetch from DPW Manager
    const dpwResponse = await fetch(
      `${process.env.DPW_MANAGER_BASE_URL}/api/v1/youth/${youthId}/queries?status=${status}`,
      {
        headers: {
          'X-API-Key': process.env.DPW_MANAGER_API_KEY || '',
        },
      }
    );

    const data = await dpwResponse.json();

    if (!dpwResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to fetch queries' },
        { status: dpwResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

#### 5. Badges

**File:** `src/app/api/youth/badges/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyYouthToken } from '@/app/api/_lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyYouthToken(token);
    const youthId = decoded.youthId;

    // Fetch from DPW Manager
    const dpwResponse = await fetch(
      `${process.env.DPW_MANAGER_BASE_URL}/api/v1/youth/${youthId}/badges`,
      {
        headers: {
          'X-API-Key': process.env.DPW_MANAGER_API_KEY || '',
        },
      }
    );

    const data = await dpwResponse.json();

    if (!dpwResponse.ok) {
      return NextResponse.json(
        { success: false, message: data.error?.message || 'Failed to fetch badges' },
        { status: dpwResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

### Environment Variables to Add

```env
# DPW Manager API Configuration
DPW_MANAGER_BASE_URL=https://app.spatialcollective.com
DPW_MANAGER_API_KEY=<your_api_key_here>

# Or staging for development
DPW_MANAGER_BASE_URL=https://test.app.spatialcollective.com
DPW_MANAGER_API_KEY=<staging_api_key>
```

---

## Database Changes

### No Schema Changes Required! ✅

All payment, performance, and badge data lives in DPW Manager. The Learning Platform acts as a **display layer** only.

**Benefits:**
- Single source of truth (DPW Manager)
- No data sync issues
- Reduced database load
- Easier to maintain

**Exception:** Query submissions might be cached locally for offline support (future enhancement).

---

## UI/UX Design

### Mobile-First Design Principles

#### 1. Tab Navigation (Mobile)
```
┌─────────────────────────────────────┐
│ [Overview] [Payment] [Performance]  │  ← Swipeable
│            [Resolve]                │
└─────────────────────────────────────┘
```

#### 2. Today's Earnings Card (Prominent)
```
┌─────────────────────────────────────┐
│  💰 TODAY'S EARNINGS                │
│                                     │
│     KES 750                        │  ← Large, bold
│     ↑ 12 POIs submitted            │
│     ⭐ 95.5% Quality               │
│                                     │
│  Base: 500 + Quality: 191 + Perf: 59│
└─────────────────────────────────────┘
```

#### 3. Leaderboard (Competitive)
```
┌─────────────────────────────────────┐
│  🏆 KAYOLE SOWETO LEADERBOARD       │
│                                     │
│  🥇 #1  Denis Gitahi     98.2%     │
│  🥈 #2  Joy Nzomo        96.8%     │
│  🥉 #3  Michelle Kinya   94.5% YOU │  ← Highlighted
│     #4  Tony Oroko       93.1%     │
│     #5  Agnes Mutuku     92.4%     │
└─────────────────────────────────────┘
```

#### 4. Floating Resolve Button
```
                              [🛠️]  ← Fixed bottom-right
                                     Tap to open query form
```

#### 5. Badge Showcase
```
┌─────────────────────────────────────┐
│  🏅 YOUR BADGES                     │
│                                     │
│  [🏆 Gold]  [⭐ Platinum]  [🔒]   │  ← Earned + Locked
│   Quality    Perfect      Speed    │
│   Champion   Attendance   Demon    │
│                                     │
│  Progress to unlock Speed Demon:   │
│  ████████░░░░  18/25 POIs         │
└─────────────────────────────────────┘
```

### Color Coding

```css
/* Payment Colors */
.base-pay { color: #10b981; }        /* Green */
.quality-pay { color: #3b82f6; }     /* Blue */
.performance-bonus { color: #f59e0b; } /* Amber */

/* Badge Tiers */
.badge-bronze { color: #CD7F32; border: 2px solid #CD7F32; }
.badge-silver { color: #C0C0C0; border: 2px solid #C0C0C0; }
.badge-gold { color: #FFD700; border: 2px solid #FFD700; }
.badge-platinum { color: #E5E4E2; border: 2px solid #E5E4E2; }

/* Query Status */
.status-pending { color: #f59e0b; }    /* Amber */
.status-in-progress { color: #3b82f6; } /* Blue */
.status-resolved { color: #10b981; }    /* Green */
```

---

## Development Roadmap

### Phase 1: Foundation (Week 1)

**Days 1-2: Setup & Architecture**
- [ ] Create API request document (✅ Done!)
- [ ] Set up DPW Manager staging API access
- [ ] Add environment variables
- [ ] Create proxy API routes (payment, performance, queries, badges)
- [ ] Test API connectivity

**Days 3-5: Core Components**
- [ ] Build `WorkDashboardTabs` component
- [ ] Build `PaymentTab` with dummy data
- [ ] Build `PerformanceTab` with dummy data
- [ ] Build `ResolveCenterTab` with dummy data
- [ ] Test tab navigation

### Phase 2: Payment Features (Week 2)

**Days 6-8: Payment UI**
- [ ] `TodayEarningsCard` component
- [ ] `PeriodSummaryCard` component
- [ ] `DailyBreakdownTable` component
- [ ] `PaymentRulesInfo` component
- [ ] Integrate with payment API
- [ ] Add loading states & error handling

**Days 9-10: Testing & Polish**
- [ ] Test with real DPW data
- [ ] Mobile responsiveness
- [ ] Currency formatting (KES)
- [ ] Date formatting (Nairobi timezone)

### Phase 3: Performance & Badges (Week 3)

**Days 11-13: Performance UI**
- [ ] `PersonalMetricsCard` component
- [ ] `RankingsCard` component
- [ ] `LeaderboardTable` component
- [ ] Settlement vs Global toggle
- [ ] Integrate with performance API

**Days 14-15: Badges System**
- [ ] `BadgesShowcase` component
- [ ] `BadgeCard` component (earned/locked states)
- [ ] Badge progress bars
- [ ] Badge tier icons
- [ ] Integrate with badges API

### Phase 4: Resolve Center (Week 4)

**Days 16-18: Query Submission**
- [ ] `SubmitQueryForm` component
- [ ] Category dropdown
- [ ] File upload for attachments
- [ ] Form validation
- [ ] Submit API integration

**Days 19-20: Query Management**
- [ ] `QueryCard` component
- [ ] Active/Resolved query lists
- [ ] Query detail view with messages
- [ ] Status badges (pending/in-progress/resolved)
- [ ] Floating action button (mobile)

### Phase 5: Testing & Deployment (Week 5)

**Days 21-23: Testing**
- [ ] Unit tests for components
- [ ] Integration tests for API routes
- [ ] User acceptance testing with 5-10 youth
- [ ] Performance testing (load times)
- [ ] Mobile testing (iOS/Android browsers)

**Days 24-25: Deployment**
- [ ] Deploy to staging
- [ ] Final QA
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Gather user feedback

---

## Testing Strategy

### 1. API Integration Tests

```javascript
// tests/api/payment.test.ts
describe('Payment Breakdown API', () => {
  it('should return payment data for valid youth', async () => {
    const response = await fetch('/api/youth/payment/breakdown', {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('payment_summary');
    expect(data.data).toHaveProperty('today_stats');
  });

  it('should return 401 for missing token', async () => {
    const response = await fetch('/api/youth/payment/breakdown');
    expect(response.status).toBe(401);
  });
});
```

### 2. Component Tests

```javascript
// tests/components/PaymentTab.test.tsx
describe('PaymentTab', () => {
  it('should display today earnings', () => {
    render(<PaymentTab />);
    expect(screen.getByText(/Today's Earnings/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<PaymentTab />);
    expect(screen.getByText(/Loading payment data/i)).toBeInTheDocument();
  });
});
```

### 3. User Acceptance Testing

**Test Scenarios:**
1. Youth checks today's earnings → sees correct POI count and quality score
2. Youth views daily breakdown → sees payment formula explanation
3. Youth checks leaderboard → sees their rank highlighted
4. Youth submits payment dispute → receives confirmation with ticket number
5. Youth views resolved query → sees admin response

---

## Deployment Plan

### Pre-Deployment Checklist

- [ ] DPW Manager API endpoints live in production
- [ ] API key configured in Vercel environment variables
- [ ] All components tested in staging
- [ ] Mobile responsiveness verified
- [ ] Error handling tested
- [ ] Loading states tested
- [ ] User documentation prepared

### Deployment Steps

1. **Merge to main branch** (triggers auto-deploy to Vercel)
2. **Verify environment variables** in Vercel dashboard
3. **Test production API** with sample youth_id
4. **Soft launch:** Enable for 10 test users first
5. **Monitor logs** for errors
6. **Full rollout:** Enable for all 153 active mobile mappers
7. **Announce feature** via trainers/WhatsApp

### Rollback Plan

If critical issues occur:
1. Revert deployment in Vercel
2. Investigate errors
3. Fix issues in development
4. Re-test in staging
5. Deploy again

---

## Success Metrics

### Week 1 Post-Launch
- [ ] 80%+ youth have viewed payment dashboard
- [ ] 50%+ youth have checked leaderboard
- [ ] <5 support queries about using new features

### Month 1 Post-Launch
- [ ] 30% reduction in payment-related support queries
- [ ] 90%+ youth satisfaction (survey)
- [ ] 10+ queries submitted through resolve center
- [ ] Average daily logins increased by 20%

---

## Next Steps

1. **Share API request doc** with DPW Manager team → Get timeline
2. **Run archive script** for inactive mobile mappers:
   ```bash
   node scripts/archive-inactive-mobile-mappers.js --dry-run  # Preview
   node scripts/archive-inactive-mobile-mappers.js            # Execute
   ```
3. **Set up staging environment** with DPW test API
4. **Begin Phase 1 development** (API routes + tab structure)
5. **Weekly sync** with DPW team on API implementation progress

---

**Document Status:** ✅ Ready for Development  
**Next Milestone:** DPW Manager API implementation (2 weeks)  
**Developer Contact:** tech@spatialcollective.co.ke


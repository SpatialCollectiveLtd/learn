# Work Dashboard Implementation Plan
**Feature:** Training vs Work Dashboard Split with OSM Stats Integration  
**Date:** January 6, 2026  
**Status:** Planning Phase

---

## 📋 Executive Summary

### Current State Analysis
After thorough codebase review, I've identified the following:

**✅ Existing Structure (What We Have):**
- Clean Next.js 16 + React 19 architecture
- PostgreSQL database with proper indexing
- JWT authentication system for youth and staff
- Youth training progress tracking (`youth_training_progress` table)
- Modular dashboard structure (`/dashboard/youth`, `/dashboard/staff`, etc.)
- Program type differentiation (digitization, mobile_mapping, household_survey, microtasking)
- Settlement tracking in database (`youth_participants.settlement`)
- OSM username storage and validation

**🎯 What Needs to Be Built:**
1. Dashboard selection page (Training vs Work)
2. Work dashboard with OSM stats (4 module variants)
3. OSM API integration service
4. Work days tracking system
5. Training completion detection logic
6. Caching layer for OSM data

---

## 🏗️ Implementation Strategy

### Phase 1: Database Schema Extensions
**Priority:** HIGH | **Estimated Time:** 1-2 hours

#### New Tables Required

```sql
-- 1. OSM Statistics Cache (prevents API rate limiting)
CREATE TABLE IF NOT EXISTS youth_osm_stats (
  stats_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  osm_username VARCHAR(255) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  buildings_mapped INTEGER DEFAULT 0,
  changesets_analyzed INTEGER DEFAULT 0,
  last_changeset_id BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  UNIQUE(youth_id, date)
);

CREATE INDEX idx_osm_stats_youth ON youth_osm_stats(youth_id);
CREATE INDEX idx_osm_stats_date ON youth_osm_stats(date);
CREATE INDEX idx_osm_stats_cache_expires ON youth_osm_stats(cache_expires_at);

-- 2. Work Days Tracking (20 days limit per youth)
CREATE TABLE IF NOT EXISTS youth_work_days (
  work_day_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  work_date DATE NOT NULL,
  buildings_count INTEGER DEFAULT 0,
  hours_worked DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by VARCHAR(50),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  UNIQUE(youth_id, work_date)
);

CREATE INDEX idx_work_days_youth ON youth_work_days(youth_id);
CREATE INDEX idx_work_days_date ON youth_work_days(work_date);
CREATE INDEX idx_work_days_status ON youth_work_days(status);

-- 3. Settlement Work Configuration (manages start dates and targets)
CREATE TABLE IF NOT EXISTS settlement_work_config (
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement VARCHAR(100) NOT NULL UNIQUE,
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
  start_date DATE NOT NULL,
  end_date DATE,
  daily_target INTEGER DEFAULT 200, -- e.g., 200 buildings for digitization
  project_hashtag VARCHAR(100) DEFAULT '#DPW2025',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlement_config_settlement ON settlement_work_config(settlement);
CREATE INDEX idx_settlement_config_active ON settlement_work_config(is_active);

-- Triggers for updated_at
CREATE TRIGGER update_youth_osm_stats_updated_at 
BEFORE UPDATE ON youth_osm_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_work_days_updated_at 
BEFORE UPDATE ON youth_work_days
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_work_config_updated_at 
BEFORE UPDATE ON settlement_work_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Why This Design?**
- ✅ **Caching:** `youth_osm_stats` prevents hitting OSM API every refresh (5-min TTL)
- ✅ **Performance:** Proper indexes on commonly queried fields
- ✅ **Flexibility:** `settlement_work_config` allows different settings per settlement
- ✅ **Audit Trail:** Tracks approvals and status changes for work days
- ✅ **Data Integrity:** Foreign keys ensure referential integrity

---

### Phase 2: OSM API Integration Service
**Priority:** HIGH | **Estimated Time:** 4-6 hours

#### File: `src/lib/osm-service.ts`

```typescript
// OSM API Integration Service
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Constants
const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';
const CACHE_TTL_MINUTES = 5;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

export interface OSMStats {
  username: string;
  date: string;
  totalBuildings: number;
  changesetsAnalyzed: number;
  lastChangesetId?: number;
  lastUpdated: Date;
}

export interface OSMChangeset {
  id: number;
  uid: number;
  user: string;
  created_at: string;
  closed_at: string;
  comments_count: number;
  changes_count: number;
  tags: {
    comment?: string;
    created_by?: string;
  };
}

/**
 * Main function: Get today's building count for a mapper
 */
export async function getTodayBuildingCount(
  osmUsername: string,
  projectHashtag: string,
  timezone: string = 'Africa/Nairobi' // EAT (UTC+3)
): Promise<OSMStats> {
  
  // Step 1: Calculate today's date range in UTC
  const { startTime, endTime } = getTodayDateRange(timezone);
  
  console.log(`[OSM] Fetching data for ${osmUsername} from ${startTime} to ${endTime}`);
  
  // Step 2: Fetch changesets
  const changesets = await fetchUserChangesets(osmUsername, startTime, endTime);
  
  console.log(`[OSM] Found ${changesets.length} changesets`);
  
  // Step 3: Filter by project hashtag
  const projectChangesets = filterByHashtag(changesets, projectHashtag);
  
  console.log(`[OSM] ${projectChangesets.length} changesets match hashtag: ${projectHashtag}`);
  
  // Step 4: Count buildings from all matching changesets
  let totalBuildings = 0;
  let lastChangesetId: number | undefined;
  
  for (const changeset of projectChangesets) {
    try {
      const buildingCount = await countBuildingsInChangeset(changeset.id);
      totalBuildings += buildingCount;
      lastChangesetId = changeset.id;
      
      console.log(`[OSM] Changeset ${changeset.id}: ${buildingCount} buildings`);
      
      // Small delay to avoid rate limiting
      await delay(500);
    } catch (error) {
      console.error(`[OSM] Error processing changeset ${changeset.id}:`, error);
    }
  }
  
  return {
    username: osmUsername,
    date: new Date().toISOString().split('T')[0],
    totalBuildings,
    changesetsAnalyzed: projectChangesets.length,
    lastChangesetId,
    lastUpdated: new Date(),
  };
}

/**
 * Get today's date range in UTC based on timezone
 */
function getTodayDateRange(timezone: string): { startTime: string; endTime: string } {
  const now = new Date();
  
  // Convert to timezone (e.g., EAT is UTC+3)
  const offset = timezone === 'Africa/Nairobi' ? 3 : 0;
  
  // Start of today in target timezone
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0 - offset, 0, 0, 0);
  
  // Current time
  const endOfDay = new Date(now);
  
  return {
    startTime: startOfDay.toISOString(),
    endTime: endOfDay.toISOString(),
  };
}

/**
 * Fetch changesets from OSM API
 */
async function fetchUserChangesets(
  username: string,
  startTime: string,
  endTime: string
): Promise<OSMChangeset[]> {
  
  const url = `${OSM_API_BASE}/changesets`;
  const params = {
    display_name: username,
    time: `${startTime},${endTime}`,
    closed: 'true', // Only closed changesets (completed uploads)
  };
  
  try {
    const response = await axios.get(url, {
      params,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)',
      },
    });
    
    // Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const parsed = parser.parse(response.data);
    
    // Handle single or multiple changesets
    const changesetsData = parsed.osm?.changeset;
    if (!changesetsData) return [];
    
    const changesets = Array.isArray(changesetsData) ? changesetsData : [changesetsData];
    
    return changesets.map((cs: any) => ({
      id: parseInt(cs.id),
      uid: parseInt(cs.uid),
      user: cs.user,
      created_at: cs.created_at,
      closed_at: cs.closed_at,
      comments_count: parseInt(cs.comments_count || '0'),
      changes_count: parseInt(cs.changes_count || '0'),
      tags: cs.tag ? parseChangesettags(cs.tag) : {},
    }));
    
  } catch (error: any) {
    console.error('[OSM] Error fetching changesets:', error.message);
    throw new Error(`Failed to fetch changesets: ${error.message}`);
  }
}

/**
 * Parse changeset tags from XML
 */
function parseChangesetTags(tagData: any): Record<string, string> {
  if (!tagData) return {};
  
  const tags: Record<string, string> = {};
  const tagArray = Array.isArray(tagData) ? tagData : [tagData];
  
  for (const tag of tagArray) {
    if (tag.k && tag.v) {
      tags[tag.k] = tag.v;
    }
  }
  
  return tags;
}

/**
 * Filter changesets by project hashtag
 */
function filterByHashtag(changesets: OSMChangeset[], hashtag: string): OSMChangeset[] {
  return changesets.filter(cs => {
    const comment = cs.tags.comment || '';
    return comment.includes(hashtag);
  });
}

/**
 * Count buildings in a specific changeset
 */
async function countBuildingsInChangeset(changesetId: number): Promise<number> {
  const url = `${OSM_API_BASE}/changeset/${changesetId}/download`;
  
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)',
      },
    });
    
    // Parse OSM XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const parsed = parser.parse(response.data);
    
    // Count ways with building tag
    let buildingCount = 0;
    const ways = parsed.osmChange?.create?.way || parsed.osmChange?.modify?.way || [];
    const wayArray = Array.isArray(ways) ? ways : [ways];
    
    for (const way of wayArray) {
      if (hasBuildingTag(way.tag)) {
        buildingCount++;
      }
    }
    
    return buildingCount;
    
  } catch (error: any) {
    console.error(`[OSM] Error downloading changeset ${changesetId}:`, error.message);
    return 0; // Return 0 instead of failing the entire operation
  }
}

/**
 * Check if a way has a building tag
 */
function hasBuildingTag(tagData: any): boolean {
  if (!tagData) return false;
  
  const tags = Array.isArray(tagData) ? tagData : [tagData];
  
  return tags.some((tag: any) => tag.k === 'building');
}

/**
 * Utility: Delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get cached stats or fetch from OSM
 */
export async function getCachedOrFetchStats(
  youthId: string,
  osmUsername: string,
  projectHashtag: string,
  database: any // Database instance
): Promise<OSMStats> {
  
  const today = new Date().toISOString().split('T')[0];
  
  // Check cache
  const cached = await database.query(`
    SELECT * FROM youth_osm_stats 
    WHERE youth_id = $1 
    AND date = $2 
    AND cache_expires_at > CURRENT_TIMESTAMP
  `, [youthId, today]);
  
  if (cached.rows.length > 0) {
    console.log(`[OSM] Using cached data for ${osmUsername}`);
    const row = cached.rows[0];
    return {
      username: row.osm_username,
      date: row.date,
      totalBuildings: row.buildings_mapped,
      changesetsAnalyzed: row.changesets_analyzed,
      lastChangesetId: row.last_changeset_id,
      lastUpdated: row.last_updated,
    };
  }
  
  // Fetch fresh data
  console.log(`[OSM] Cache miss - fetching fresh data for ${osmUsername}`);
  const stats = await getTodayBuildingCount(osmUsername, projectHashtag);
  
  // Update cache
  await database.query(`
    INSERT INTO youth_osm_stats (
      youth_id, osm_username, date, buildings_mapped, 
      changesets_analyzed, last_changeset_id, last_updated, cache_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '5 minutes')
    ON CONFLICT (youth_id, date) 
    DO UPDATE SET
      buildings_mapped = $4,
      changesets_analyzed = $5,
      last_changeset_id = $6,
      last_updated = $7,
      cache_expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
  `, [
    youthId,
    stats.username,
    stats.date,
    stats.totalBuildings,
    stats.changesetsAnalyzed,
    stats.lastChangesetId,
    stats.lastUpdated,
  ]);
  
  return stats;
}
```

**Why This Implementation?**
- ✅ **Proper Error Handling:** Gracefully handles API failures
- ✅ **Rate Limiting Protection:** Delays between requests, caching
- ✅ **Timezone Aware:** Correctly calculates "today" in EAT
- ✅ **Hashtag Filtering:** Only counts work with project hashtag
- ✅ **XML Parsing:** Uses fast-xml-parser for efficiency
- ✅ **Logging:** Comprehensive logging for debugging

---

### Phase 3: API Endpoints
**Priority:** HIGH | **Estimated Time:** 3-4 hours

#### 3.1 GET `/api/work/stats/daily`

```typescript
// src/app/api/work/stats/daily/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { getCachedOrFetchStats } from '@/lib/osm-service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured and at least 32 characters');
}

export async function GET(request: NextRequest) {
  try {
    // Verify JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const youthId = decoded.youthId;

    // Get youth data
    const youthResult = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.osm_username,
        yp.program_type,
        yp.settlement,
        swc.daily_target,
        swc.project_hashtag
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND yp.program_type = swc.program_type
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1
    `, [youthId]);

    if (youthResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth not found' },
        { status: 404 }
      );
    }

    const youth = youthResult.rows[0];

    // Check if OSM username exists (required for digitization)
    if (youth.program_type === 'digitization' && !youth.osm_username) {
      return NextResponse.json({
        success: false,
        message: 'OSM username required. Please complete training and add your OSM username.',
        requiresOsmUsername: true,
      }, { status: 400 });
    }

    // Fetch stats (cached or fresh)
    const stats = await getCachedOrFetchStats(
      youth.youth_id,
      youth.osm_username,
      youth.project_hashtag || '#DPW2025',
      Database
    );

    return NextResponse.json({
      success: true,
      data: {
        today: stats.totalBuildings,
        target: youth.daily_target || 200,
        percentage: Math.round((stats.totalBuildings / (youth.daily_target || 200)) * 100),
        changesetsAnalyzed: stats.changesetsAnalyzed,
        lastUpdated: stats.lastUpdated,
        fromCache: true, // Can be enhanced based on actual source
      },
    });

  } catch (error: any) {
    console.error('[API] Error fetching daily stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

#### 3.2 GET `/api/work/days/count`

```typescript
// src/app/api/work/days/count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const youthId = decoded.youthId;

    // Count approved work days
    const result = await Database.query(`
      SELECT COUNT(*) as days_worked
      FROM youth_work_days
      WHERE youth_id = $1 
      AND status = 'approved'
    `, [youthId]);

    const daysWorked = parseInt(result.rows[0]?.days_worked || '0');
    const totalDays = 20;

    return NextResponse.json({
      success: true,
      data: {
        daysWorked,
        totalDays,
        remaining: totalDays - daysWorked,
        percentage: Math.round((daysWorked / totalDays) * 100),
      },
    });

  } catch (error: any) {
    console.error('[API] Error fetching work days:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch work days' },
      { status: 500 }
    );
  }
}
```

#### 3.3 POST `/api/work/stats/refresh`

```typescript
// src/app/api/work/stats/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/api/_lib/database';
import { getTodayBuildingCount } from '@/lib/osm-service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const youthId = decoded.youthId;

    // Get youth data
    const youthResult = await Database.query(`
      SELECT 
        yp.youth_id,
        yp.osm_username,
        swc.project_hashtag
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc 
        ON yp.settlement = swc.settlement 
        AND swc.is_active = TRUE
      WHERE yp.youth_id = $1
    `, [youthId]);

    if (youthResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Youth not found' },
        { status: 404 }
      );
    }

    const youth = youthResult.rows[0];

    if (!youth.osm_username) {
      return NextResponse.json({
        success: false,
        message: 'OSM username required',
      }, { status: 400 });
    }

    // Force fresh fetch (bypass cache)
    const stats = await getTodayBuildingCount(
      youth.osm_username,
      youth.project_hashtag || '#DPW2025'
    );

    // Update cache
    const today = new Date().toISOString().split('T')[0];
    await Database.query(`
      INSERT INTO youth_osm_stats (
        youth_id, osm_username, date, buildings_mapped, 
        changesets_analyzed, last_changeset_id, last_updated, cache_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '5 minutes')
      ON CONFLICT (youth_id, date) 
      DO UPDATE SET
        buildings_mapped = $4,
        changesets_analyzed = $5,
        last_changeset_id = $6,
        last_updated = $7,
        cache_expires_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
    `, [
      youthId,
      stats.username,
      today,
      stats.totalBuildings,
      stats.changesetsAnalyzed,
      stats.lastChangesetId,
      stats.lastUpdated,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        today: stats.totalBuildings,
        changesetsAnalyzed: stats.changesetsAnalyzed,
        lastUpdated: stats.lastUpdated,
      },
    });

  } catch (error: any) {
    console.error('[API] Error refreshing stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh stats' },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Dashboard Selection Page
**Priority:** HIGH | **Estimated Time:** 2-3 hours

#### File: `src/app/dashboard/youth/select/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";

export default function DashboardSelectPage() {
  const router = useRouter();
  const [youthData, setYouthData] = useState<any>(null);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkTrainingStatus() {
      const storedYouthData = localStorage.getItem('youthData');
      const token = localStorage.getItem('youthToken');
      
      if (!storedYouthData || !token) {
        router.push('/');
        return;
      }

      const parsed = JSON.parse(storedYouthData);
      setYouthData(parsed);

      // Check if training is completed
      try {
        const response = await fetch('/api/youth/training-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrainingCompleted(data.completed);
        }
      } catch (error) {
        console.error('Error checking training status:', error);
      }

      setIsLoading(false);
    }

    checkTrainingStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-white mb-4">
              Welcome, {youthData?.fullName}
            </h1>
            <p className="text-[#a3a3a3]">
              Choose your destination
            </p>
          </div>

          {/* Dashboard Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Training Dashboard */}
            <div 
              onClick={() => router.push('/dashboard/youth/training')}
              className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl p-8 cursor-pointer hover:border-[#dc2626] transition-all group"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <GraduationCap className="w-10 h-10 text-blue-500" />
                </div>
              </div>
              
              <h2 className="text-2xl font-heading font-bold text-white text-center mb-3">
                Training Dashboard
              </h2>
              
              <p className="text-[#a3a3a3] text-center mb-6">
                Access training modules, complete lessons, and track your learning progress
              </p>

              <div className="flex justify-center">
                <button className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors">
                  <span>Continue Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Work Dashboard */}
            <div 
              onClick={() => {
                if (trainingCompleted) {
                  router.push('/dashboard/youth/work');
                }
              }}
              className={`bg-[#1F2121] border border-[#2a2a2a] rounded-2xl p-8 ${
                trainingCompleted 
                  ? 'cursor-pointer hover:border-[#dc2626] group' 
                  : 'opacity-50 cursor-not-allowed'
              } transition-all`}
            >
              <div className="flex items-center justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  trainingCompleted 
                    ? 'bg-[#dc2626]/10 group-hover:bg-[#dc2626]/20' 
                    : 'bg-gray-500/10'
                }`}>
                  <Briefcase className={`w-10 h-10 ${
                    trainingCompleted ? 'text-[#dc2626]' : 'text-gray-500'
                  }`} />
                </div>
              </div>
              
              <h2 className="text-2xl font-heading font-bold text-white text-center mb-3">
                Work Dashboard
              </h2>
              
              <p className="text-[#a3a3a3] text-center mb-6">
                Track your daily work stats, buildings mapped, and work days progress
              </p>

              {trainingCompleted ? (
                <div className="flex justify-center">
                  <button className="flex items-center gap-2 text-[#dc2626] hover:text-[#ef4444] transition-colors">
                    <span>View Stats</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-500 text-sm text-center">
                    🔒 Complete training to unlock work dashboard
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

### Phase 5: Work Dashboard UI
**Priority:** HIGH | **Estimated Time:** 4-5 hours

#### File: `src/app/dashboard/youth/work/page.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { TrendingUp, Calendar, RefreshCw, MapPin } from "lucide-react";
import axios from "axios";

export default function WorkDashboardPage() {
  const router = useRouter();
  const [youthData, setYouthData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [workDays, setWorkDays] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const storedYouthData = localStorage.getItem('youthData');
      const token = localStorage.getItem('youthToken');
      
      if (!storedYouthData || !token) {
        router.push('/');
        return;
      }

      const parsed = JSON.parse(storedYouthData);
      setYouthData(parsed);

      // Fetch stats
      await fetchStats(token);
      await fetchWorkDays(token);

      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function fetchStats(token: string) {
    try {
      const response = await axios.get('/api/work/stats/daily', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.data?.requiresOsmUsername) {
        // Redirect to training to add OSM username
        router.push('/digitization/mapper');
      }
    }
  }

  async function fetchWorkDays(token: string) {
    try {
      const response = await axios.get('/api/work/days/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWorkDays(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching work days:', error);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    const token = localStorage.getItem('youthToken');
    
    try {
      const response = await axios.post('/api/work/stats/refresh', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats({
          ...stats,
          today: response.data.data.today,
          lastUpdated: response.data.data.lastUpdated,
        });
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading work dashboard...</div>
      </div>
    );
  }

  const percentage = stats?.percentage || 0;
  const progressWidth = Math.min(percentage, 100);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Work Dashboard
            </h1>
            <p className="text-[#a3a3a3]">
              {youthData?.fullName} • {youthData?.programType?.replace('_', ' ').toUpperCase()}
            </p>
          </div>

          {/* Today's Stats Card */}
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-white mb-1">
                  📊 Today's Activity
                </h2>
                <p className="text-[#a3a3a3] text-sm">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] hover:bg-[#ef4444] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Buildings Counter */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold text-white">
                  {stats?.today || 0}
                </span>
                <span className="text-2xl text-[#a3a3a3]">
                  / {stats?.target || 200}
                </span>
                <span className="text-lg text-[#a3a3a3]">Buildings Mapped</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#2a2a2a] rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#dc2626] to-[#ef4444] transition-all duration-500"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>

              <p className="text-[#a3a3a3] text-sm">
                {percentage}% of daily target
              </p>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#2a2a2a]">
              <div>
                <p className="text-[#a3a3a3] text-sm mb-1">Last Upload</p>
                <p className="text-white">
                  {stats?.lastUpdated 
                    ? new Date(stats.lastUpdated).toLocaleTimeString()
                    : 'No uploads yet'}
                </p>
              </div>
              <div>
                <p className="text-[#a3a3a3] text-sm mb-1">Changesets Analyzed</p>
                <p className="text-white">{stats?.changesetsAnalyzed || 0}</p>
              </div>
            </div>
          </div>

          {/* Work Days Card */}
          <div className="bg-[#1F2121] border border-[#2a2a2a] rounded-2xl p-8">
            <h2 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#dc2626]" />
              Work Days Progress
            </h2>

            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-white">
                    {workDays?.daysWorked || 0}
                  </span>
                  <span className="text-xl text-[#a3a3a3]">
                    / {workDays?.totalDays || 20} days
                  </span>
                </div>

                <div className="w-full h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${workDays?.percentage || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[#a3a3a3] text-sm">
              {workDays?.remaining || 20} days remaining
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

## 🎯 Implementation Checklist

### Database Setup
- [ ] Create migration file: `database/migrations/add-work-tracking-tables.sql`
- [ ] Run migration on development database
- [ ] Seed `settlement_work_config` table with initial data
- [ ] Add indexes for performance
- [ ] Test foreign key constraints

### Backend Services
- [ ] Install dependencies: `fast-xml-parser`, `axios`
- [ ] Create `src/lib/osm-service.ts`
- [ ] Add proper error handling and logging
- [ ] Implement caching logic
- [ ] Test OSM API integration with real username
- [ ] Handle rate limiting gracefully

### API Endpoints
- [ ] Create `/api/work/stats/daily/route.ts`
- [ ] Create `/api/work/days/count/route.ts`
- [ ] Create `/api/work/stats/refresh/route.ts`
- [ ] Create `/api/youth/training-status/route.ts`
- [ ] Add JWT authentication to all endpoints
- [ ] Test with Postman/Thunder Client

### Frontend Components
- [ ] Create dashboard selection page
- [ ] Create work dashboard page
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test responsive design
- [ ] Add accessibility features

### Testing
- [ ] Test with real OSM username
- [ ] Test caching behavior
- [ ] Test timezone handling
- [ ] Test hashtag filtering
- [ ] Load test OSM API calls
- [ ] Test error scenarios

### Deployment
- [ ] Update environment variables
- [ ] Run database migrations on production
- [ ] Monitor OSM API rate limits
- [ ] Set up error tracking (Sentry)
- [ ] Document API endpoints

---

## 📚 Dependencies to Install

```bash
npm install fast-xml-parser axios
npm install --save-dev @types/axios
```

---

## 🔧 Environment Variables to Add

```env
# OSM Configuration
OSM_API_BASE_URL=https://api.openstreetmap.org/api/0.6
OSM_DEFAULT_HASHTAG=#DPW2025
OSM_CACHE_TTL_MINUTES=5

# Timezone
APP_TIMEZONE=Africa/Nairobi
```

---

## ⚠️ Important Notes

### Code Quality Considerations
1. **No Duplication:** Reuse existing auth patterns from `/api/youth/auth`
2. **Consistent Error Handling:** Follow existing error response format
3. **Type Safety:** Add proper TypeScript interfaces
4. **Database Patterns:** Use existing `Database.query` pattern
5. **Component Structure:** Follow existing dashboard structure

### OSM API Best Practices
1. **Rate Limiting:** Max 1 request per second
2. **User-Agent:** Always include proper User-Agent header
3. **Caching:** Implement 5-minute cache minimum
4. **Error Handling:** Gracefully handle API failures
5. **Hashtag Enforcement:** Ensure mappers use correct hashtag

### Performance Optimization
1. **Database Indexes:** Add indexes before production
2. **Query Optimization:** Use prepared statements
3. **Caching Layer:** Implement Redis if traffic is high
4. **Lazy Loading:** Load stats only when needed
5. **Debounce Refresh:** Prevent rapid refresh clicks

---

## 🚀 Next Steps

1. **Review this plan** - Ensure alignment with project requirements
2. **Approve architecture** - Confirm database schema and API design
3. **Provide settlement data** - Share settlement start dates for `settlement_work_config`
4. **Begin implementation** - Start with Phase 1 (Database)
5. **Iterative testing** - Test each phase before moving to next

---

**Estimated Total Implementation Time:** 15-20 hours  
**Recommended Timeline:** 3-4 days

This plan ensures:
- ✅ No code duplication
- ✅ Follows existing patterns
- ✅ Maintains code quality
- ✅ Scalable architecture
- ✅ Proper error handling
- ✅ Performance optimization
- ✅ Security best practices

Ready to proceed with implementation?

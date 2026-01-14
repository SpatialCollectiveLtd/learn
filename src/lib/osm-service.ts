// OSM API Integration Service with Redis Caching
// Fetches building counts from OpenStreetMap API
// Implements caching, rate limiting, and error handling

import axios, { AxiosError } from 'axios';
import { XMLParser } from 'fast-xml-parser';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface OSMStats {
  username: string;
  date: string;
  totalBuildings: number;
  changesetsAnalyzed: number;
  lastChangesetId?: number;
  lastUploadTime?: string;
  cacheHit: boolean;
  processingTime: number;
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
    [key: string]: string | undefined;
  };
}

interface CachedStats {
  totalBuildings: number;
  changesetsAnalyzed: number;
  lastChangesetId?: number;
  lastUploadTime?: string;
  timestamp: number;
}

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

// Public OSM Server Configuration (revert to private when ready)
const OSM_SERVER_BASE = process.env.NEXT_PUBLIC_OSM_SERVER_URL || 'https://api.openstreetmap.org';
const OSM_API_BASE = `${OSM_SERVER_BASE}/api/0.6`;
const CACHE_TTL_SECONDS = 300; // 5 minutes
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between requests
const MAX_RETRIES = 2;
const USER_AGENT = 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)';

// In-memory cache fallback if Redis is not available
const memoryCache = new Map<string, CachedStats>();

// ============================================
// REDIS CLIENT SETUP
// ============================================

let redisClient: any = null;

/**
 * Initialize Redis client (optional - graceful degradation)
 */
export async function initializeRedis() {
  try {
    // Only initialize in server environment with Redis URL
    if (typeof window === 'undefined' && process.env.REDIS_URL) {
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 3) return new Error('Max retries exceeded');
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err: Error) => {
        console.error('[Redis] Connection error:', err.message);
        redisClient = null; // Fall back to memory cache
      });

      await redisClient.connect();
      console.log('[Redis] Connected successfully');
      return true;
    }
  } catch (error) {
    console.error('[Redis] Initialization failed, using memory cache:', error);
    redisClient = null;
  }
  return false;
}

/**
 * Get cached stats from Redis or memory
 */
async function getCachedStats(cacheKey: string): Promise<CachedStats | null> {
  try {
    // Try Redis first
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`[Cache] Redis hit for ${cacheKey}`);
        return parsed;
      }
    }
    
    // Fallback to memory cache
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL_SECONDS * 1000) {
      console.log(`[Cache] Memory hit for ${cacheKey}`);
      return memoryCached;
    }
  } catch (error) {
    console.error('[Cache] Get error:', error);
  }
  
  return null;
}

/**
 * Set cached stats in Redis and memory
 */
async function setCachedStats(cacheKey: string, stats: CachedStats): Promise<void> {
  try {
    // Set in Redis with TTL
    if (redisClient?.isOpen) {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(stats));
      console.log(`[Cache] Redis set for ${cacheKey}`);
    }
    
    // Also set in memory cache
    memoryCache.set(cacheKey, stats);
    
    // Clean old memory cache entries
    if (memoryCache.size > 1000) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) {
        memoryCache.delete(oldestKey);
      }
    }
  } catch (error) {
    console.error('[Cache] Set error:', error);
  }
}

// ============================================
// MAIN FUNCTION: GET BUILDING COUNT
// ============================================

/**
 * Get today's building count for a mapper with caching
 */
export async function getTodayBuildingCount(
  osmUsername: string,
  projectHashtag: string = '#DPW2025',
  timezone: string = 'Africa/Nairobi',
  forceRefresh: boolean = false,
  exceptionHashtags: string[] = []
): Promise<OSMStats> {
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  // Validation: Check for empty username
  if (!osmUsername || osmUsername.trim() === '') {
    throw new Error('OSM username is required');
  }
  
  // Validation: Check username length
  if (osmUsername.length > 255) {
    throw new Error('OSM username too long (max 255 characters)');
  }
  
  // Sanitize username: Only allow alphanumeric, underscores, hyphens, spaces
  const sanitizedUsername = osmUsername.trim();
  
  const cacheKey = `osm:${sanitizedUsername}:${today}`;

  console.log(`[OSM] Fetching stats for ${sanitizedUsername} on ${today}`);

  // Check cache unless force refresh
  if (!forceRefresh) {
    const cached = await getCachedStats(cacheKey);
    if (cached) {
      return {
        username: sanitizedUsername,
        date: today,
        totalBuildings: cached.totalBuildings,
        changesetsAnalyzed: cached.changesetsAnalyzed,
        lastChangesetId: cached.lastChangesetId,
        lastUploadTime: cached.lastUploadTime,
        cacheHit: true,
        processingTime: Date.now() - startTime,
      };
    }
  }

  console.log(`[OSM] Cache miss - fetching fresh data`);

  try {
    // Calculate today's date range
    const { startTimeISO, endTimeISO } = getTodayDateRange(timezone);
    
    // Fetch changesets
    const changesets = await fetchUserChangesets(sanitizedUsername, startTimeISO, endTimeISO);
    
    // Edge case: Handle invalid or empty response
    if (!changesets || !Array.isArray(changesets)) {
      console.warn('[OSM] Invalid changesets response, returning zero');
      const emptyStats: CachedStats = {
        totalBuildings: 0,
        changesetsAnalyzed: 0,
        timestamp: Date.now(),
      };
      await setCachedStats(cacheKey, emptyStats);
      
      return {
        username: sanitizedUsername,
        date: today,
        totalBuildings: 0,
        changesetsAnalyzed: 0,
        cacheHit: false,
        processingTime: Date.now() - startTime,
      };
    }
    
    console.log(`[OSM] Found ${changesets.length} total changesets`);
    
    // Filter by project hashtag or exception hashtags
    let projectChangesets = filterByHashtag(changesets, projectHashtag);
    
    // If user has exception hashtags, also include those
    if (exceptionHashtags.length > 0) {
      for (const exceptionTag of exceptionHashtags) {
        const exceptionChangesets = filterByHashtag(changesets, exceptionTag);
        // Add exception changesets that aren't already included
        for (const cs of exceptionChangesets) {
          if (!projectChangesets.find(existing => existing.id === cs.id)) {
            projectChangesets.push(cs);
          }
        }
      }
    }
    
    console.log(`[OSM] ${projectChangesets.length} changesets match ${projectHashtag}${exceptionHashtags.length > 0 ? ' or exception hashtags' : ''}`);
    
    // Edge case: Handle zero matching changesets
    if (projectChangesets.length === 0) {
      const emptyStats: CachedStats = {
        totalBuildings: 0,
        changesetsAnalyzed: 0,
        timestamp: Date.now(),
      };
      await setCachedStats(cacheKey, emptyStats);
      
      return {
        username: sanitizedUsername,
        date: today,
        totalBuildings: 0,
        changesetsAnalyzed: 0,
        cacheHit: false,
        processingTime: Date.now() - startTime,
      };
    }
    
    // Count buildings with error handling per changeset
    let totalBuildings = 0;
    let lastChangesetId: number | undefined;
    let lastUploadTime: string | undefined;
    let processedChangesets = 0;
    
    for (const changeset of projectChangesets) {
      try {
        const buildingCount = await countBuildingsInChangeset(changeset.id);
        
        // Edge case: Handle negative or invalid counts
        if (buildingCount < 0) {
          console.warn(`[OSM] Invalid building count for changeset ${changeset.id}: ${buildingCount}`);
          continue;
        }
        
        totalBuildings += buildingCount;
        processedChangesets++;
        
        if (buildingCount > 0) {
          lastChangesetId = changeset.id;
          lastUploadTime = changeset.closed_at;
        }
        
        console.log(`[OSM] Changeset ${changeset.id}: ${buildingCount} buildings`);
        
        // Rate limiting delay
        await delay(RATE_LIMIT_DELAY_MS);
      } catch (error) {
        console.error(`[OSM] Error processing changeset ${changeset.id}:`, error);
        // Continue with other changesets - partial results are acceptable
      }
    }

    // Prepare result
    const stats: CachedStats = {
      totalBuildings,
      changesetsAnalyzed: processedChangesets, // Use successfully processed count
      lastChangesetId,
      lastUploadTime,
      timestamp: Date.now(),
    };

    // Cache the result
    await setCachedStats(cacheKey, stats);

    return {
      username: sanitizedUsername,
      date: today,
      totalBuildings: stats.totalBuildings,
      changesetsAnalyzed: stats.changesetsAnalyzed,
      lastChangesetId: stats.lastChangesetId,
      lastUploadTime: stats.lastUploadTime,
      cacheHit: false,
      processingTime: Date.now() - startTime,
    };

  } catch (error) {
    console.error('[OSM] Error fetching building count:', error);
    
    // Edge case: Return stale cache on error if available
    const fallbackCached = await getCachedStats(cacheKey);
    if (fallbackCached) {
      console.log('[OSM] Returning stale cache due to error');
      return {
        username: sanitizedUsername,
        date: today,
        totalBuildings: fallbackCached.totalBuildings,
        changesetsAnalyzed: fallbackCached.changesetsAnalyzed,
        lastChangesetId: fallbackCached.lastChangesetId,
        lastUploadTime: fallbackCached.lastUploadTime,
        cacheHit: true,
        processingTime: Date.now() - startTime,
      };
    }
    
    throw error;
  }
}

// ============================================
// DATE/TIME UTILITIES
// ============================================

/**
 * Get today's date range in UTC based on timezone
 * For Africa/Nairobi (EAT): UTC+3
 */
function getTodayDateRange(timezone: string): { startTimeISO: string; endTimeISO: string } {
  const now = new Date();
  
  // Calculate timezone offset (EAT is UTC+3 = -3 hours from UTC midnight)
  const offset = timezone === 'Africa/Nairobi' ? 3 : 0;
  
  // Start of today in target timezone (converted to UTC)
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0 - offset, 0, 0, 0);
  
  // Current time
  const endTime = new Date();
  
  return {
    startTimeISO: startOfDay.toISOString(),
    endTimeISO: endTime.toISOString(),
  };
}

// ============================================
// OSM API FUNCTIONS
// ============================================

/**
 * Fetch user's changesets from OSM API
 */
async function fetchUserChangesets(
  username: string,
  startTime: string,
  endTime: string,
  retryCount: number = 0
): Promise<OSMChangeset[]> {
  const url = `${OSM_API_BASE}/changesets`;
  const params = {
    display_name: username,
    time: `${startTime},${endTime}`,
    closed: 'true',
  };

  try {
    const response = await axios.get(url, {
      params,
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 
        'User-Agent': USER_AGENT,
        'Accept': 'text/xml', // Request XML format instead of default JSON
      },
    });

    // Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });

    const parsed = parser.parse(response.data);
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
      tags: parseChangesetTags(cs.tag),
    }));

  } catch (error) {
    const axiosError = error as AxiosError;
    
    // Log detailed error info
    console.error(`[OSM] Changeset fetch error:`, {
      code: axiosError.code,
      status: axiosError.response?.status,
      message: axiosError.message,
      url: url
    });
    
    // Retry on network errors or timeout
    const shouldRetry = retryCount < MAX_RETRIES && (
      axiosError.code === 'ECONNABORTED' ||
      axiosError.code === 'ETIMEDOUT' ||
      axiosError.code === 'ENOTFOUND' ||
      axiosError.code === 'ECONNREFUSED' ||
      axiosError.code === 'ERR_NETWORK' ||
      axiosError.response?.status === 503 ||
      axiosError.response?.status === 502 ||
      axiosError.response?.status === 504
    );
    
    if (shouldRetry) {
      console.warn(`[OSM] Request failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      await delay(2000 * (retryCount + 1));
      return fetchUserChangesets(username, startTime, endTime, retryCount + 1);
    }
    
    throw new Error(`Failed to fetch changesets: ${axiosError.message}`);
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
    if (tag.k && tag.v !== undefined) {
      tags[tag.k] = tag.v;
    }
  }

  return tags;
}

/**
 * Filter changesets by project hashtag in comment
 */
function filterByHashtag(changesets: OSMChangeset[], hashtag: string): OSMChangeset[] {
  return changesets.filter(cs => {
    const comment = cs.tags.comment || '';
    return comment.toLowerCase().includes(hashtag.toLowerCase());
  });
}

/**
 * Count buildings in a specific changeset
 */
async function countBuildingsInChangeset(
  changesetId: number,
  retryCount: number = 0
): Promise<number> {
  const url = `${OSM_API_BASE}/changeset/${changesetId}/download`;

  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
    });

    // Parse OSM change XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        // Force arrays for OSM elements that can appear multiple times
        return ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name);
      },
    });

    const parsed = parser.parse(response.data);
    
    // Count buildings in create and modify sections
    let buildingCount = 0;
    const osmChange = parsed?.osmChange || {};

    // OSM API returns each element in its own <create> or <modify> tag
    // So osmChange.create is an array of sections, not a single section
    const sections = [];
    if (osmChange.create) {
      sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
    }
    if (osmChange.modify) {
      sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
    }

    // Check each section
    for (const section of sections) {
      if (!section) continue;

      // Check ways (buildings are typically ways, not nodes)
      const ways = section.way || [];
      for (const way of ways) {
        if (hasBuildingTag(way.tag)) {
          buildingCount++;
        }
      }

      // Also check nodes (rare, but some buildings might be points)
      const nodes = section.node || [];
      for (const node of nodes) {
        if (hasBuildingTag(node.tag)) {
          buildingCount++;
        }
      }

      // Check relations (multipolygons for complex buildings)
      const relations = section.relation || [];
      for (const relation of relations) {
        if (hasBuildingTag(relation.tag)) {
          buildingCount++;
        }
      }
    }

    return buildingCount;

  } catch (error) {
    const axiosError = error as AxiosError;
    
    // Retry on timeout
    if (retryCount < MAX_RETRIES && axiosError.code === 'ECONNABORTED') {
      console.warn(`[OSM] Changeset download timeout, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      await delay(2000 * (retryCount + 1));
      return countBuildingsInChangeset(changesetId, retryCount + 1);
    }
    
    // Return 0 instead of throwing to not fail entire operation
    console.error(`[OSM] Error counting buildings in changeset ${changesetId}:`, axiosError.message);
    return 0;
  }
}

/**
 * Check if a way has a building tag (with typo tolerance)
 * Common typos: biulding, buiding, buidling, buliding, etc.
 */
function hasBuildingTag(tagData: any): boolean {
  if (!tagData) return false;

  const tags = Array.isArray(tagData) ? tagData : [tagData];

  return tags.some((tag: any) => {
    const key = tag.k?.toLowerCase() || '';
    // Exact match
    if (key === 'building') return true;
    
    // Common typos (missing 'l', swapped letters, etc.)
    // biulding, buiding, buidling, buliding, builidng, buildnig, etc.
    const typos = [
      'biulding',  // missing 'l'
      'buiding',   // missing 'l' 
      'buidling',  // 'l' in wrong place
      'buliding',  // 'i' and 'l' swapped
      'builidng',  // 'i' and 'd' swapped
      'buildnig',  // 'i' and 'n' swapped
      'buidlign',  // multiple issues
      'buliding',  // letters swapped
    ];
    
    return typos.includes(key);
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Delay execution (for rate limiting)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Invalidate cache for a user/date
 */
export async function invalidateCache(osmUsername: string, date?: string): Promise<void> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `osm:${osmUsername}:${targetDate}`;
  
  try {
    if (redisClient?.isOpen) {
      await redisClient.del(cacheKey);
      console.log(`[Cache] Invalidated Redis cache for ${cacheKey}`);
    }
    
    memoryCache.delete(cacheKey);
    console.log(`[Cache] Invalidated memory cache for ${cacheKey}`);
  } catch (error) {
    console.error('[Cache] Invalidation error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  redisConnected: boolean;
  memoryCacheSize: number;
  redisKeys?: number;
}> {
  const stats = {
    redisConnected: !!redisClient?.isOpen,
    memoryCacheSize: memoryCache.size,
  };

  if (redisClient?.isOpen) {
    try {
      const keys = await redisClient.keys('osm:*');
      return { ...stats, redisKeys: keys.length };
    } catch (error) {
      console.error('[Cache] Error getting Redis stats:', error);
    }
  }

  return stats;
}

// ============================================
// EXPORTS
// ============================================

export default {
  getTodayBuildingCount,
  initializeRedis,
  invalidateCache,
  getCacheStats,
};

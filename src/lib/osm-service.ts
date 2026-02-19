import axios, { AxiosError } from 'axios';
import { XMLParser } from 'fast-xml-parser';





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





const OSM_SERVER_BASE = process.env.NEXT_PUBLIC_OSM_SERVER_URL || 'https://osm.spatialcollective.co.ke';
const OSM_API_BASE = `${OSM_SERVER_BASE}/api/0.6`;
const CACHE_TTL_SECONDS = 300; 
const REQUEST_TIMEOUT_MS = 30000; 
const RATE_LIMIT_DELAY_MS = 1000; 
const MAX_RETRIES = 2;
const USER_AGENT = 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)';


const memoryCache = new Map<string, CachedStats>();





let redisClient: any = null;


export async function initializeRedis() {
  try {
    
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
        
        redisClient = null; 
      });

      await redisClient.connect();
      
      return true;
    }
  } catch (error) {
    
    redisClient = null;
  }
  return false;
}


async function getCachedStats(cacheKey: string): Promise<CachedStats | null> {
  try {
    
    if (redisClient?.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        
        return parsed;
      }
    }
    
    
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_TTL_SECONDS * 1000) {
      
      return memoryCached;
    }
  } catch (error) {
    
  }
  
  return null;
}


async function setCachedStats(cacheKey: string, stats: CachedStats): Promise<void> {
  try {
    
    if (redisClient?.isOpen) {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(stats));
      
    }
    
    
    memoryCache.set(cacheKey, stats);
    
    
    if (memoryCache.size > 1000) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) {
        memoryCache.delete(oldestKey);
      }
    }
  } catch (error) {
    
  }
}






export async function getTodayBuildingCount(
  osmUsername: string,
  projectHashtag: string = '#DPW2025',
  timezone: string = 'Africa/Nairobi',
  forceRefresh: boolean = false,
  exceptionHashtags: string[] = []
): Promise<OSMStats> {
  const startTime = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  
  if (!osmUsername || osmUsername.trim() === '') {
    throw new Error('OSM username is required');
  }
  
  
  if (osmUsername.length > 255) {
    throw new Error('OSM username too long (max 255 characters)');
  }
  
  
  const sanitizedUsername = osmUsername.trim();
  
  const cacheKey = `osm:${sanitizedUsername}:${today}`;

  
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

  
  try {
    
    const { startTimeISO, endTimeISO } = getTodayDateRange(timezone);
    
    
    const changesets = await fetchUserChangesets(sanitizedUsername, startTimeISO, endTimeISO);
    
    
    if (!changesets || !Array.isArray(changesets)) {
      
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
    
    
    let projectChangesets = filterByHashtag(changesets, projectHashtag);
    
    
    if (exceptionHashtags.length > 0) {
      for (const exceptionTag of exceptionHashtags) {
        const exceptionChangesets = filterByHashtag(changesets, exceptionTag);
        
        for (const cs of exceptionChangesets) {
          if (!projectChangesets.find(existing => existing.id === cs.id)) {
            projectChangesets.push(cs);
          }
        }
      }
    }
    
    
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
    
    
    let totalBuildings = 0;
    let lastChangesetId: number | undefined;
    let lastUploadTime: string | undefined;
    let processedChangesets = 0;
    
    for (const changeset of projectChangesets) {
      try {
        const buildingCount = await countBuildingsInChangeset(changeset.id);
        
        
        if (buildingCount < 0) {
          
          continue;
        }
        
        totalBuildings += buildingCount;
        processedChangesets++;
        
        if (buildingCount > 0) {
          lastChangesetId = changeset.id;
          lastUploadTime = changeset.closed_at;
        }
        
        
        await delay(RATE_LIMIT_DELAY_MS);
      } catch (error) {
        
      }
    }

    
    const stats: CachedStats = {
      totalBuildings,
      changesetsAnalyzed: processedChangesets, 
      lastChangesetId,
      lastUploadTime,
      timestamp: Date.now(),
    };

    
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
    
    const fallbackCached = await getCachedStats(cacheKey);
    if (fallbackCached) {
      
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






function getTodayDateRange(timezone: string): { startTimeISO: string; endTimeISO: string } {
  const now = new Date();
  
  
  const offset = timezone === 'Africa/Nairobi' ? 3 : 0;
  
  
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0 - offset, 0, 0, 0);
  
  
  const endTime = new Date();
  
  return {
    startTimeISO: startOfDay.toISOString(),
    endTimeISO: endTime.toISOString(),
  };
}






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
        'Accept': 'text/xml', 
      },
    });

    
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
      
      await delay(2000 * (retryCount + 1));
      return fetchUserChangesets(username, startTime, endTime, retryCount + 1);
    }
    
    throw new Error(`Failed to fetch changesets: ${axiosError.message}`);
  }
}


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


function filterByHashtag(changesets: OSMChangeset[], hashtag: string): OSMChangeset[] {
  return changesets.filter(cs => {
    const comment = cs.tags.comment || '';
    return comment.toLowerCase().includes(hashtag.toLowerCase());
  });
}


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

    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        
        return ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name);
      },
    });

    const parsed = parser.parse(response.data);
    
    
    let buildingCount = 0;
    const osmChange = parsed?.osmChange || {};

    
    
    const sections = [];
    if (osmChange.create) {
      sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
    }
    if (osmChange.modify) {
      sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
    }

    
    for (const section of sections) {
      if (!section) continue;

      
      const ways = section.way || [];
      for (const way of ways) {
        if (hasBuildingTag(way.tag)) {
          buildingCount++;
        }
      }

      
      const nodes = section.node || [];
      for (const node of nodes) {
        if (hasBuildingTag(node.tag)) {
          buildingCount++;
        }
      }

      
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
    
    
    if (retryCount < MAX_RETRIES && axiosError.code === 'ECONNABORTED') {
      
      await delay(2000 * (retryCount + 1));
      return countBuildingsInChangeset(changesetId, retryCount + 1);
    }
    
    
    
    return 0;
  }
}


function hasBuildingTag(tagData: any): boolean {
  if (!tagData) return false;

  const tags = Array.isArray(tagData) ? tagData : [tagData];

  return tags.some((tag: any) => {
    const key = tag.k?.toLowerCase() || '';
    
    if (key === 'building') return true;
    
    
    const typos = [
      'biulding',   
      'buiding',    
      'buidling',   
      'buliding',   
      'builidng',   
      'buildnig',   
      'buidlign',   
      'buildiing',  
      'buildding',  
      'buillding',  
    ];
    
    return typos.includes(key);
  });
}






function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function invalidateCache(osmUsername: string, date?: string): Promise<void> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `osm:${osmUsername}:${targetDate}`;
  
  try {
    if (redisClient?.isOpen) {
      await redisClient.del(cacheKey);
      
    }
    
    memoryCache.delete(cacheKey);
    
  } catch (error) {
    
  }
}


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
      
    }
  }

  return stats;
}





export default {
  getTodayBuildingCount,
  initializeRedis,
  invalidateCache,
  getCacheStats,
};

// Direct database refresh - recalculate all stats using fixed counting logic
// This calls OSM API directly and updates the database

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);
const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';
const USER_AGENT = 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)';

async function refreshAllStatsDirect() {
  console.log('\n=== Direct Database Refresh for Jan 8, 2026 ===\n');
  
  // Get all youth with today's stats showing 0 buildings
  const youthResult = await sql`
    SELECT yp.youth_id, yp.full_name, yp.osm_username, yos.buildings_mapped
    FROM youth_participants yp
    LEFT JOIN youth_osm_stats yos ON yp.youth_id = yos.youth_id AND yos.date = '2026-01-08'
    WHERE yp.osm_username IS NOT NULL
    AND yp.osm_username != ''
    ORDER BY yp.youth_id
  `;
  
  console.log(`Found ${youthResult.length} youth to check\n`);
  
  const updates = [];
  
  for (const youth of youthResult) {
    const currentBuildings = youth.buildings_mapped || 0;
    console.log(`\n${youth.youth_id} (${youth.osm_username}): Currently ${currentBuildings} buildings`);
    
    try {
      // Get today's date range (Africa/Nairobi timezone)
      const startOfDay = new Date('2026-01-08T00:00:00+03:00'); // EAT midnight
      const endOfDay = new Date('2026-01-08T23:59:59+03:00');   // EAT end of day
      
      const startTimeISO = startOfDay.toISOString();
      const endTimeISO = endOfDay.toISOString();
      
      // Fetch changesets from OSM
      const changesets = await fetchUserChangesets(youth.osm_username, startTimeISO, endTimeISO);
      
      // Filter by #DPW2025 hashtag
      const projectChangesets = changesets.filter(cs => {
        const comment = cs.tags.comment || '';
        return comment.toLowerCase().includes('#dpw2025');
      });
      
      console.log(`  Found ${changesets.length} total changesets, ${projectChangesets.length} with #DPW2025`);
      
      if (projectChangesets.length === 0) {
        console.log(`  ℹ️  No changesets for today - keeping at ${currentBuildings}`);
        continue;
      }
      
      // Count buildings in each changeset
      let totalBuildings = 0;
      for (const cs of projectChangesets) {
        const buildingsInCs = await countBuildingsInChangeset(cs.id);
        totalBuildings += buildingsInCs;
        console.log(`    Changeset #${cs.id}: ${buildingsInCs} buildings`);
        
        // Rate limit
        await delay(1000);
      }
      
      if (totalBuildings !== currentBuildings) {
        console.log(`  🔄 UPDATE: ${currentBuildings} → ${totalBuildings} buildings`);
        updates.push({
          youth_id: youth.youth_id,
          old_count: currentBuildings,
          new_count: totalBuildings,
        });
        
        // Update youth_osm_stats
        await sql`
          INSERT INTO youth_osm_stats (youth_id, date, buildings_mapped, osm_username)
          VALUES (${youth.youth_id}, '2026-01-08', ${totalBuildings}, ${youth.osm_username})
          ON CONFLICT (youth_id, date)
          DO UPDATE SET 
            buildings_mapped = ${totalBuildings}
        `;
        
        // Update or create work day
        const targetMet = totalBuildings >= 200;
        await sql`
          INSERT INTO youth_work_days (youth_id, work_date, buildings_count, target_met, status)
          VALUES (${youth.youth_id}, '2026-01-08', ${totalBuildings}, ${targetMet}, 'approved')
          ON CONFLICT (youth_id, work_date)
          DO UPDATE SET 
            buildings_count = ${totalBuildings},
            target_met = ${targetMet},
            status = 'approved'
        `;
      } else {
        console.log(`  ✅ CORRECT: ${totalBuildings} buildings (no update needed)`);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }
  
  console.log('\n=== REFRESH COMPLETE ===\n');
  console.log('Updates applied:');
  console.table(updates);
  console.log(`\nTotal youth updated: ${updates.length}`);
}

async function fetchUserChangesets(username, startTime, endTime) {
  const url = `${OSM_API_BASE}/changesets`;
  const params = {
    display_name: username,
    time: `${startTime},${endTime}`,
    closed: 'true',
  };

  const response = await axios.get(url, {
    params,
    timeout: 30000,
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/xml' },
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(response.data);
  const changesetsData = parsed.osm?.changeset;
  
  if (!changesetsData) return [];

  const changesets = Array.isArray(changesetsData) ? changesetsData : [changesetsData];

  return changesets.map((cs) => ({
    id: parseInt(cs.id),
    tags: parseChangesetTags(cs.tag),
  }));
}

function parseChangesetTags(tagData) {
  if (!tagData) return {};

  const tags = {};
  const tagArray = Array.isArray(tagData) ? tagData : [tagData];

  for (const tag of tagArray) {
    if (tag.k && tag.v !== undefined) {
      tags[tag.k] = tag.v;
    }
  }

  return tags;
}

async function countBuildingsInChangeset(changesetId) {
  const url = `${OSM_API_BASE}/changeset/${changesetId}/download`;

  const response = await axios.get(url, {
    timeout: 30000,
    headers: { 'User-Agent': USER_AGENT },
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name) => ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name),
  });

  const parsed = parser.parse(response.data);
  const osmChange = parsed?.osmChange || {};

  // OSM API returns each element in its own <create> or <modify> tag
  const sections = [];
  if (osmChange.create) {
    sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
  }
  if (osmChange.modify) {
    sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
  }

  let buildingCount = 0;

  for (const section of sections) {
    if (!section) continue;

    const ways = section.way || [];
    for (const way of ways) {
      if (hasBuildingTag(way.tag)) buildingCount++;
    }

    const nodes = section.node || [];
    for (const node of nodes) {
      if (hasBuildingTag(node.tag)) buildingCount++;
    }

    const relations = section.relation || [];
    for (const relation of relations) {
      if (hasBuildingTag(relation.tag)) buildingCount++;
    }
  }

  return buildingCount;
}

function hasBuildingTag(tagData) {
  if (!tagData) return false;

  const tags = Array.isArray(tagData) ? tagData : [tagData];

  return tags.some((tag) => {
    const key = tag.k?.toLowerCase() || '';
    return key === 'building';
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

refreshAllStatsDirect().catch(console.error);

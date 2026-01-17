// Fix Kayole digitization work configuration and sync KAY1154SO stats
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Fetch changeset download and count buildings
async function fetchAndCountBuildings(changesetId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Count nodes/ways with building tag
        // Look for <tag k="building" patterns
        const createMatches = data.match(/<(node|way)[^>]*>[\s\S]*?<tag k="building"[^>]*\/>[\s\S]*?<\/(node|way)>/g);
        const modifyMatches = data.match(/<modify>[\s\S]*?<tag k="building"[^>]*\/>[\s\S]*?<\/modify>/g);
        
        // Simpler approach: count all <tag k="building" occurrences in create sections
        const buildingTags = (data.match(/<tag k="building"/g) || []).length;
        
        resolve({ buildings: buildingTags, rawLength: data.length });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function syncKAY1154SO() {
  console.log('=== Syncing KAY1154SO (Steven Odhiambo) Stats ===\n');
  
  // Fetch today's changesets from OSM API
  const today = '2026-01-16';
  const osmUsername = 'Steven Odhiambo';
  
  const changesetsUrl = `https://api.openstreetmap.org/api/0.6/changesets?display_name=${encodeURIComponent(osmUsername)}&time=${today}`;
  
  console.log('Fetching changesets from:', changesetsUrl);
  
  const changesets = await new Promise((resolve, reject) => {
    https.get(changesetsUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Parse XML to get changeset IDs
        const idMatches = data.match(/changeset id="(\d+)"/g) || [];
        const ids = idMatches.map(m => m.match(/\d+/)[0]);
        resolve(ids);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
  
  console.log(`Found ${changesets.length} changesets for today:`, changesets);
  
  let totalBuildings = 0;
  
  for (const csId of changesets) {
    console.log(`\nFetching changeset ${csId}...`);
    try {
      const result = await fetchAndCountBuildings(csId);
      console.log(`  Buildings: ${result.buildings} (data size: ${result.rawLength} bytes)`);
      totalBuildings += result.buildings;
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n✅ Total buildings mapped today: ${totalBuildings}`);
  
  // Update database
  const result = await pool.query(`
    INSERT INTO youth_osm_stats (stats_id, youth_id, osm_username, date, buildings_mapped, changesets_analyzed, last_changeset_id, updated_at)
    VALUES (gen_random_uuid(), 'KAY1154SO', 'Steven Odhiambo', $1::date, $2, $3, $4, NOW())
    ON CONFLICT (youth_id, date) 
    DO UPDATE SET 
      buildings_mapped = $2,
      changesets_analyzed = $3,
      last_changeset_id = $4,
      updated_at = NOW()
    RETURNING *
  `, [today, totalBuildings, changesets.length, changesets[0]]);
  
  console.log('\nDatabase updated:', {
    youth_id: result.rows[0].youth_id,
    date: result.rows[0].date,
    buildings_mapped: result.rows[0].buildings_mapped
  });
}

async function updateKayoleConfig() {
  console.log('\n=== Updating Kayole Digitization Configuration ===\n');
  
  // Kayole digitization started Dec 9, 2025
  // Today is Jan 16, 2026
  // If we want day 16 of 20 to be today, and end on Jan 22:
  // Working days (excluding weekends): 
  // Week 1: Dec 9-12 (4 days) = Day 1-4
  // Week 2: Dec 15-19 (5 days) = Day 5-9
  // Week 3: Dec 22-26 (5 days, including Christmas) = Day 10-14 (or fewer if holidays)
  // Actual: Looks like they started Dec 9 and have been working
  
  // Based on youth_work_days showing 19 days for KAY1154SO with last day Jan 15,
  // today (Jan 16) would be day 20 for them.
  
  // Let's check actual work days from youth_work_days
  const kayWorkDays = await pool.query(`
    SELECT DISTINCT work_date FROM youth_work_days 
    WHERE youth_id LIKE 'KAY%'
    ORDER BY work_date
  `);
  
  console.log('Distinct work dates for Kayole users:');
  kayWorkDays.rows.forEach((r, i) => {
    const dateStr = new Date(r.work_date).toISOString().split('T')[0];
    console.log(`  Day ${i + 1}: ${dateStr}`);
  });
  
  // Update the config with correct end date
  // If today is day 16, and they have 4 more days (17,18,19,20), 
  // working days would be: Jan 17, 20, 21, 22 (skipping weekend Jan 18-19)
  const endDate = '2026-01-22';
  
  console.log(`\nUpdating Kayole digitization end_date to ${endDate}...`);
  
  const configUpdate = await pool.query(`
    UPDATE settlement_work_config 
    SET end_date = $1::date, updated_at = NOW()
    WHERE settlement = 'Kayole' AND program_type = 'digitization'
    RETURNING settlement, program_type, start_date, end_date, total_work_days
  `, [endDate]);
  
  console.log('Updated config:', configUpdate.rows[0]);
}

async function checkKayoleProgress() {
  console.log('\n=== Kayole Digitization Progress Summary ===\n');
  
  const progress = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.osm_username,
      COUNT(DISTINCT ywd.work_date) as days_worked,
      20 as total_days,
      20 - COUNT(DISTINCT ywd.work_date) as days_remaining
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
    WHERE yp.youth_id LIKE 'KAY%' 
    AND yp.program_type = 'digitization' 
    AND yp.is_active = TRUE
    GROUP BY yp.youth_id, yp.full_name, yp.osm_username
    ORDER BY days_worked DESC, yp.youth_id
  `);
  
  console.log('Youth ID       | Full Name                | OSM Username         | Progress');
  console.log('-'.repeat(90));
  progress.rows.forEach(r => {
    const status = r.days_worked >= 20 ? '✅ COMPLETED' : 
                   r.days_worked >= 16 ? '🔄 Day ' + r.days_worked : 
                   '⚠️ Behind (' + r.days_worked + ')';
    console.log(`${r.youth_id.padEnd(14)} | ${(r.full_name || '').padEnd(24)} | ${(r.osm_username || 'NONE').padEnd(20)} | ${r.days_worked}/20 ${status}`);
  });
}

async function main() {
  try {
    await syncKAY1154SO();
    await updateKayoleConfig();
    await checkKayoleProgress();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

main();

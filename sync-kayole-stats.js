// Sync KAY1154SO's today stats from OSM and update Kayole work days
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fetchOSMChangeset(changesetId) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function countBuildingsInChangeset(xmlData) {
  // Count building tags in the changeset
  const buildingMatches = xmlData.match(/k="building"/g);
  return buildingMatches ? buildingMatches.length : 0;
}

async function syncKAY1154SO() {
  console.log('=== Syncing KAY1154SO Stats for Today ===\n');
  
  // Today's changesets for Steven Odhiambo
  const changesets = [
    { id: 177286549, changes: 22 },
    { id: 177286327, changes: 589 },
    { id: 177285174, changes: 429 }
  ];
  
  let totalBuildings = 0;
  
  for (const cs of changesets) {
    console.log(`Fetching changeset ${cs.id}...`);
    try {
      const xmlData = await fetchOSMChangeset(cs.id);
      const buildings = countBuildingsInChangeset(xmlData);
      console.log(`  Changeset ${cs.id}: ${buildings} buildings`);
      totalBuildings += buildings;
    } catch (error) {
      console.log(`  Error fetching ${cs.id}: ${error.message}`);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nTotal buildings for today: ${totalBuildings}`);
  
  // Update youth_osm_stats
  const today = new Date().toISOString().split('T')[0];
  
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
  `, [today, totalBuildings, changesets.length, changesets[0].id]);
  
  console.log('\nUpdated stats:', result.rows[0]);
}

async function updateKayoleWorkDays() {
  console.log('\n=== Updating Kayole Digitization Work Days ===\n');
  
  // Get all active Kayole digitization users
  const kayUsers = await pool.query(`
    SELECT youth_id, full_name 
    FROM youth_participants 
    WHERE youth_id LIKE 'KAY%' 
    AND program_type = 'digitization' 
    AND is_active = TRUE
  `);
  
  console.log(`Found ${kayUsers.rows.length} active Kayole digitization users\n`);
  
  // Work period: Jan 1 - Jan 22, 2026 (20 working days, excluding weekends)
  // Today is Jan 16 = Day 16 out of 20
  // Working days: Jan 1-3, 6-10, 13-17, 20-22 = 20 days
  const startDate = '2026-01-01';
  const endDate = '2026-01-22';
  const totalDays = 20;
  const currentDay = 16; // Today is day 16
  
  // Update settlement_work_config for Kayole digitization
  console.log('Updating settlement_work_config...');
  const configResult = await pool.query(`
    UPDATE settlement_work_config 
    SET 
      program_start_date = $1::date,
      program_end_date = $2::date,
      max_work_days = $3,
      updated_at = NOW()
    WHERE settlement = 'Kayole' AND program_type = 'digitization'
    RETURNING *
  `, [startDate, endDate, totalDays]);
  
  if (configResult.rows.length === 0) {
    // Insert if doesn't exist
    console.log('Config not found, inserting...');
    await pool.query(`
      INSERT INTO settlement_work_config (settlement, program_type, program_start_date, program_end_date, max_work_days, daily_target, project_hashtag, timezone, is_active)
      VALUES ('Kayole', 'digitization', $1::date, $2::date, $3, 200, '#DPW2025', 'Africa/Nairobi', TRUE)
      ON CONFLICT (settlement, program_type) DO UPDATE SET
        program_start_date = $1::date,
        program_end_date = $2::date,
        max_work_days = $3,
        updated_at = NOW()
    `, [startDate, endDate, totalDays]);
  }
  
  console.log(`\nWork period: ${startDate} to ${endDate}`);
  console.log(`Total work days: ${totalDays}`);
  console.log(`Today (Jan 16) is Day ${currentDay}\n`);
  
  // Check current work days for these users
  const workDaySummary = await pool.query(`
    SELECT ywd.youth_id, COUNT(*) as days_recorded
    FROM youth_work_days ywd
    JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
    WHERE yp.youth_id LIKE 'KAY%' 
    AND yp.program_type = 'digitization' 
    AND yp.is_active = TRUE
    GROUP BY ywd.youth_id
    ORDER BY ywd.youth_id
  `);
  
  console.log('Current work days by user:');
  workDaySummary.rows.forEach(r => {
    const remaining = totalDays - r.days_recorded;
    console.log(`  ${r.youth_id}: ${r.days_recorded}/${totalDays} (${remaining > 0 ? remaining + ' remaining' : 'COMPLETED'})`);
  });
  
  // List users who haven't started
  const usersWithWorkDays = new Set(workDaySummary.rows.map(r => r.youth_id));
  const usersWithoutWorkDays = kayUsers.rows.filter(u => !usersWithWorkDays.has(u.youth_id));
  
  if (usersWithoutWorkDays.length > 0) {
    console.log(`\nUsers without any work days recorded:`);
    usersWithoutWorkDays.forEach(u => console.log(`  ${u.youth_id}: ${u.full_name}`));
  }
}

async function main() {
  try {
    await syncKAY1154SO();
    await updateKayoleWorkDays();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();

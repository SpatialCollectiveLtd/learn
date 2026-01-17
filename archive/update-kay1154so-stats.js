// Update KAY1154SO stats with correct building count (including typo variant)
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function updateStats() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const today = '2026-01-16';
    const buildings = 145; // 2 + 76 + 67 from all 3 changesets
    const changesets = 3;
    const lastChangesetId = '177286549';
    
    console.log('=== Updating KAY1154SO Stats ===');
    console.log(`Date: ${today}`);
    console.log(`Buildings mapped: ${buildings}`);
    console.log(`Note: User is using "buildiing" tag (typo) instead of "building"`);
    
    const result = await pool.query(`
      INSERT INTO youth_osm_stats (stats_id, youth_id, osm_username, date, buildings_mapped, changesets_analyzed, last_changeset_id, last_upload_time, updated_at)
      VALUES (gen_random_uuid(), 'KAY1154SO', 'Steven Odhiambo', $1::date, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (youth_id, date) 
      DO UPDATE SET 
        buildings_mapped = $2,
        changesets_analyzed = $3,
        last_changeset_id = $4,
        last_upload_time = NOW(),
        updated_at = NOW()
      RETURNING youth_id, date, buildings_mapped, changesets_analyzed
    `, [today, buildings, changesets, lastChangesetId]);
    
    console.log('\n✅ Database updated:', result.rows[0]);
    
    // Also add today's work day if not exists
    const workDayResult = await pool.query(`
      INSERT INTO youth_work_days (work_day_id, youth_id, work_date, buildings_count, daily_target, target_met, status, created_at)
      VALUES (gen_random_uuid(), 'KAY1154SO', $1::date, $2, 200, $3, 'approved', NOW())
      ON CONFLICT (youth_id, work_date) 
      DO UPDATE SET 
        buildings_count = $2,
        target_met = $3,
        updated_at = NOW()
      RETURNING work_date, buildings_count, target_met
    `, [today, buildings, buildings >= 200]);
    
    console.log('Work day recorded:', workDayResult.rows[0]);
    
    // Check total work days now
    const totalDays = await pool.query(`
      SELECT COUNT(*) as days FROM youth_work_days WHERE youth_id = 'KAY1154SO'
    `);
    console.log(`\nTotal work days for KAY1154SO: ${totalDays.rows[0].days}/20`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateStats();

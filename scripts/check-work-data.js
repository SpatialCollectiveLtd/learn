const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkWorkDaysData() {
  try {
    console.log('Checking youth_work_days table...\n');
    
    // Check if table exists and has data
    const count = await pool.query(`
      SELECT COUNT(*) as total FROM youth_work_days
    `);
    
    console.log(`Total work day records: ${count.rows[0].total}`);
    
    if (count.rows[0].total > 0) {
      // Show sample data
      const sample = await pool.query(`
        SELECT youth_id, work_date, buildings_count, status, target_met
        FROM youth_work_days
        ORDER BY work_date DESC
        LIMIT 10
      `);
      
      console.log('\nSample work days:');
      sample.rows.forEach(r => {
        console.log(`  ${r.youth_id} | ${r.work_date} | Buildings: ${r.buildings_count} | Status: ${r.status} | Target Met: ${r.target_met}`);
      });
    } else {
      console.log('\n❌ NO WORK DAY RECORDS IN DATABASE!');
      console.log('\nThis explains why dashboard shows 0/20 days.');
      console.log('\nNeed to either:');
      console.log('1. Import existing work day data from Dec 9-19, 2025');
      console.log('2. Create work day records manually');
      console.log('3. System will start tracking from Jan 7, 2026 onwards');
    }
    
    // Check OSM stats table
    const osmCount = await pool.query(`
      SELECT COUNT(*) as total FROM youth_osm_stats
    `);
    
    console.log(`\n\nOSM stats records: ${osmCount.rows[0].total}`);
    
    if (osmCount.rows[0].total === 0) {
      console.log('❌ NO OSM STATS CACHED');
      console.log('Stats will be fetched from OpenStreetMap API on demand');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkWorkDaysData();

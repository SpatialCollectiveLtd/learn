require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    console.log('\nUpdating youth_osm_stats...');
    const r1 = await pool.query(`
      UPDATE youth_osm_stats 
      SET date = '2026-01-09' 
      WHERE youth_id = 'KAY2805JK' 
        AND date::date = '2026-01-08'::date
    `);
    console.log(`✅ Updated ${r1.rowCount} records in youth_osm_stats`);
    
    console.log('\nUpdating youth_work_days...');
    const r2 = await pool.query(`
      UPDATE youth_work_days 
      SET work_date = '2026-01-09' 
      WHERE youth_id = 'KAY2805JK' 
        AND work_date::date = '2026-01-08'::date
    `);
    console.log(`✅ Updated ${r2.rowCount} records in youth_work_days`);
    
    console.log('\n=== Verification ===\n');
    const check = await pool.query(`
      SELECT date, buildings_mapped 
      FROM youth_osm_stats 
      WHERE youth_id = 'KAY2805JK'
    `);
    check.rows.forEach(row => {
      console.log(`Date: ${row.date.toISOString().split('T')[0]}, Buildings: ${row.buildings_mapped}`);
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

fix();

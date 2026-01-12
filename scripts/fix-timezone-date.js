require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    console.log('\nFixing date to use timezone-aware value...\n');
    
    // Update youth_osm_stats - set to Jan 9 midnight EAT
    const r1 = await pool.query(`
      UPDATE youth_osm_stats 
      SET date = '2026-01-09'::date
      WHERE youth_id = 'KAY2805JK' 
        AND TO_CHAR(date AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') = '2026-01-09'
        AND TO_CHAR(date, 'YYYY-MM-DD') = '2026-01-08'
    `);
    console.log(`✅ Updated ${r1.rowCount} records in youth_osm_stats`);
    
    // Update youth_work_days  
    const r2 = await pool.query(`
      UPDATE youth_work_days 
      SET work_date = '2026-01-09'::date
      WHERE youth_id = 'KAY2805JK' 
        AND TO_CHAR(work_date AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') = '2026-01-09'
        AND TO_CHAR(work_date, 'YYYY-MM-DD') = '2026-01-08'
    `);
    console.log(`✅ Updated ${r2.rowCount} records in youth_work_days`);
    
    console.log('\n=== Verification ===\n');
    const check = await pool.query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM-DD') as utc_date,
        TO_CHAR(date AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD') as eat_date,
        buildings_mapped 
      FROM youth_osm_stats 
      WHERE youth_id = 'KAY2805JK'
    `);
    check.rows.forEach(row => {
      console.log(`UTC Date: ${row.utc_date}, EAT Date: ${row.eat_date}, Buildings: ${row.buildings_mapped}`);
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

fix();

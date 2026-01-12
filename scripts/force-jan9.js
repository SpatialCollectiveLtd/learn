require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  await pool.query("UPDATE youth_osm_stats SET date = DATE '2026-01-09' WHERE youth_id = 'KAY2805JK'");
  await pool.query("UPDATE youth_work_days SET work_date = DATE '2026-01-09' WHERE youth_id = 'KAY2805JK' AND work_date < '2026-01-09'");
  console.log('✅ Updated to Jan 9');
  
  const r = await pool.query("SELECT date, work_date, buildings_count FROM youth_work_days WHERE youth_id = 'KAY2805JK' AND work_date >= '2026-01-08'");
  console.log('\nwork_days:', r.rows);
  
  const r2 = await pool.query("SELECT date, buildings_mapped FROM youth_osm_stats WHERE youth_id = 'KAY2805JK'");
  console.log('\nosm_stats:', r2.rows);
  
  pool.end();
})();

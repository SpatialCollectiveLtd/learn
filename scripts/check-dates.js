require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });

pool.query("SELECT youth_id, work_date::text as date_str, buildings_count FROM youth_work_days WHERE youth_id = 'KAY2805JK' ORDER BY work_date DESC LIMIT 3")
  .then(r => { 
    console.log('\n=== Work Days ===\n');
    r.rows.forEach(row => console.log(row));
    return pool.query("SELECT youth_id, date::text as date_str, buildings_mapped FROM youth_osm_stats WHERE youth_id = 'KAY2805JK'");
  })
  .then(r => {
    console.log('\n=== OSM Stats ===\n');
    r.rows.forEach(row => console.log(row));
    pool.end();
  });

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT 
    date, 
    date::date as date_only,
    TO_CHAR(date, 'YYYY-MM-DD') as formatted,
    TO_CHAR(date AT TIME ZONE 'Africa/Nairobi', 'YYYY-MM-DD HH24:MI:SS TZ') as eat_time,
    last_upload_time,
    buildings_mapped
  FROM youth_osm_stats
  WHERE youth_id = 'KAY2805JK'
`).then(r => {
  console.log('\n=== Date Analysis ===\n');
  console.log(JSON.stringify(r.rows[0], null, 2));
  pool.end();
});

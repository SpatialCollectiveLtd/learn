require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT youth_id, osm_username, date, last_upload_time, buildings_mapped
  FROM youth_osm_stats
  WHERE youth_id = 'KAY2805JK'
  ORDER BY date DESC
`).then(r => {
  console.log('\n=== Joe Kimani OSM Stats ===\n');
  r.rows.forEach(row => {
    console.log(JSON.stringify(row, null, 2));
  });
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});

// Check OSM stats table for KAY2333OO
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function test() {
  // Check youth_osm_stats table for this user
  const stats = await sql`
    SELECT * FROM youth_osm_stats 
    WHERE youth_id = 'KAY2333OO'
    ORDER BY date DESC
    LIMIT 5
  `;
  console.log('Recent OSM stats:', JSON.stringify(stats.rows, null, 2));
  
  // Check if exception_hashtags column exists and its value
  const youth = await sql`
    SELECT youth_id, osm_username, exception_hashtags
    FROM youth_participants 
    WHERE youth_id = 'KAY2333OO'
  `;
  console.log('\nYouth exception_hashtags:', JSON.stringify(youth.rows, null, 2));
}

test().catch(console.error);

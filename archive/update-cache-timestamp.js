// Force update the cache timestamp for KAY2333OO
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function fix() {
  console.log('📊 Updating cache timestamp for KAY2333OO...\n');
  
  const result = await sql`
    UPDATE youth_osm_stats 
    SET updated_at = NOW()
    WHERE youth_id = 'KAY2333OO'
    AND date = (
      SELECT MAX(date) FROM youth_osm_stats WHERE youth_id = 'KAY2333OO'
    )
    RETURNING *
  `;
  
  console.log('Updated:', JSON.stringify(result.rows, null, 2));
}

fix().catch(console.error);

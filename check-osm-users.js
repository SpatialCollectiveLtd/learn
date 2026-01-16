// Check other Kayole users' OSM usernames
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  // Check a few other Kayole users' OSM usernames
  const users = await sql`
    SELECT youth_id, full_name, osm_username 
    FROM youth_participants 
    WHERE settlement = 'Kayole' 
    AND program_type = 'digitization' 
    AND osm_username IS NOT NULL 
    LIMIT 10
  `;
  console.log('Sample Kayole users:');
  users.rows.forEach(u => {
    console.log(`  ${u.youth_id}: ${u.full_name} -> ${u.osm_username}`);
  });
}

check().catch(console.error);

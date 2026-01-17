// Find users with spaces in OSM username
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  const users = await sql`
    SELECT youth_id, osm_username
    FROM youth_participants 
    WHERE osm_username LIKE '% %'
    AND is_active = true
    LIMIT 10
  `;
  console.log('Users with spaces in OSM username:');
  users.rows.forEach(u => console.log(`  ${u.youth_id} -> "${u.osm_username}"`));
}

check().catch(console.error);

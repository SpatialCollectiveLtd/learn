const { sql } = require('@vercel/postgres');

async function getOsmUsernames() {
  try {
    const result = await sql`
      SELECT youth_id, osm_username, full_name 
      FROM youth_participants 
      WHERE osm_username IS NOT NULL 
      ORDER BY youth_id
    `;
    
    console.log('\n=== Youth with OSM Usernames ===\n');
    result.rows.forEach(row => {
      console.log(`${row.youth_id} - ${row.osm_username} (${row.full_name})`);
    });
    console.log(`\nTotal: ${result.rows.length} youth with OSM usernames\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fetching OSM usernames:', error);
    process.exit(1);
  }
}

getOsmUsernames();

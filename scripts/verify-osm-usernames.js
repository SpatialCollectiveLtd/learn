// Script to verify saved OSM usernames against OpenStreetMap
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyOsmUsername(username) {
  try {
    const response = await fetch(
      `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`,
      {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error(`Error checking ${username}:`, error.message);
    return null;
  }
}

async function checkAllUsernames() {
  try {
    const result = await pool.query(
      'SELECT youth_id, full_name, osm_username FROM youth_participants WHERE osm_username IS NOT NULL ORDER BY created_at DESC'
    );

    console.log(`Checking ${result.rows.length} OSM usernames...\n`);

    const results = [];
    for (const row of result.rows) {
      const isValid = await verifyOsmUsername(row.osm_username);
      const status = isValid === true ? '✓ VALID' : isValid === false ? '✗ INVALID' : '? UNKNOWN';
      
      results.push({
        youth_id: row.youth_id,
        name: row.full_name,
        username: row.osm_username,
        valid: isValid,
        status
      });

      console.log(`${status.padEnd(10)} | ${row.youth_id.padEnd(15)} | ${row.osm_username.padEnd(20)} | ${row.full_name}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n--- SUMMARY ---');
    const valid = results.filter(r => r.valid === true).length;
    const invalid = results.filter(r => r.valid === false).length;
    const unknown = results.filter(r => r.valid === null).length;
    
    console.log(`Total: ${results.length}`);
    console.log(`✓ Valid: ${valid}`);
    console.log(`✗ Invalid: ${invalid}`);
    console.log(`? Unknown: ${unknown}`);

    if (invalid > 0) {
      console.log('\nInvalid usernames that need correction:');
      results.filter(r => r.valid === false).forEach(r => {
        console.log(`  ${r.youth_id} | ${r.username} | ${r.name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllUsernames();

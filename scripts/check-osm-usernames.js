const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkOSMUsernames() {
  try {
    console.log('\n🔍 Checking OSM Usernames in Database\n');
    console.log('='.repeat(80));
    
    const result = await pool.query(`
      SELECT 
        youth_id,
        full_name,
        settlement,
        osm_username,
        module_assignment
      FROM youth_participants
      WHERE program_type = 'digitization'
        AND is_active = TRUE
        AND osm_username IS NOT NULL
      ORDER BY settlement, youth_id
      LIMIT 20
    `);
    
    console.log(`\nFound ${result.rows.length} youths with OSM usernames:\n`);
    
    result.rows.forEach(row => {
      console.log(`${row.youth_id} | ${row.full_name.padEnd(25)} | ${row.settlement.padEnd(20)} | ${row.osm_username}`);
    });
    
    // Also check osm_stats table
    console.log('\n\n📊 Recent OSM Stats Records:\n');
    console.log('='.repeat(80));
    
    const statsResult = await pool.query(`
      SELECT 
        youth_id,
        osm_username,
        date,
        buildings_mapped,
        changesets_analyzed,
        last_upload_time,
        updated_at
      FROM youth_osm_stats
      WHERE date >= CURRENT_DATE - INTERVAL '2 days'
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    
    if (statsResult.rows.length === 0) {
      console.log('❌ No recent OSM stats records found\n');
    } else {
      console.log(`Found ${statsResult.rows.length} recent stats records:\n`);
      statsResult.rows.forEach(row => {
        console.log(`${row.youth_id} | ${row.osm_username.padEnd(20)} | ${row.date} | Buildings: ${row.buildings_mapped} | Changesets: ${row.changesets_analyzed}`);
        console.log(`  Last upload: ${row.last_upload_time || 'N/A'}`);
        console.log(`  Updated: ${row.updated_at}`);
        console.log('');
      });
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkOSMUsernames();

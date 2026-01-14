const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const uniqueId = process.argv[2];

if (!uniqueId) {
  console.log('Usage: node scripts/check-youth-stats.js <UNIQUE_ID>');
  process.exit(1);
}

async function checkUser() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log(`\nChecking user: ${uniqueId}\n`);
  
  // Find the user
  const users = await sql`
    SELECT id, unique_id, first_name, last_name, osm_username, current_module 
    FROM youth 
    WHERE unique_id = ${uniqueId}
  `;
  
  if (users.length === 0) {
    console.log('❌ User not found in database');
    return;
  }
  
  const user = users[0];
  console.log('✅ User found:');
  console.log(`   Name: ${user.first_name} ${user.last_name}`);
  console.log(`   OSM Username: ${user.osm_username || 'NOT SET'}`);
  console.log(`   Module: ${user.current_module}`);
  
  // Check OSM stats
  const stats = await sql`
    SELECT date, buildings_count, source 
    FROM youth_osm_stats 
    WHERE youth_id = ${user.id} 
    ORDER BY date DESC 
    LIMIT 10
  `;
  
  console.log(`\n📊 Recent stats (last 10 days):`);
  if (stats.length === 0) {
    console.log('   No stats recorded');
  } else {
    stats.forEach(s => {
      console.log(`   ${s.date}: ${s.buildings_count} buildings (${s.source || 'osm'})`);
    });
  }
  
  // Check OSM API if username exists
  if (user.osm_username) {
    console.log(`\n🌐 Checking OSM API for user: ${user.osm_username}`);
    try {
      const response = await fetch(
        `https://api.openstreetmap.org/api/0.6/changesets?display_name=${encodeURIComponent(user.osm_username)}&limit=5`
      );
      const text = await response.text();
      
      // Count changesets
      const changesetMatches = text.match(/<changeset/g);
      const count = changesetMatches ? changesetMatches.length : 0;
      
      console.log(`   Recent changesets on public OSM: ${count}`);
      
      if (count > 0) {
        // Extract dates
        const dateMatches = text.match(/created_at="([^"]+)"/g);
        if (dateMatches) {
          console.log('   Last uploads:');
          dateMatches.slice(0, 5).forEach(d => {
            const date = d.match(/"([^"]+)"/)[1];
            console.log(`     - ${new Date(date).toLocaleString()}`);
          });
        }
      }
    } catch (err) {
      console.log(`   Error checking OSM: ${err.message}`);
    }
  }
}

checkUser().catch(console.error);

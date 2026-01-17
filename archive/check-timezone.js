// Check timezone handling for OSM stats
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  console.log('=== TIMEZONE CHECK ===\n');
  
  // Get current time info
  const timeInfo = await sql`
    SELECT 
      CURRENT_TIMESTAMP as utc_now,
      CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi' as nairobi_now,
      CURRENT_DATE as utc_date,
      (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date as nairobi_date
  `;
  console.log('Time info:', JSON.stringify(timeInfo.rows[0], null, 2));
  
  // Check all OSM stats dates for KAY2333OO
  const stats = await sql`
    SELECT 
      date,
      date::date as date_only,
      buildings_mapped
    FROM youth_osm_stats
    WHERE youth_id = 'KAY2333OO'
    ORDER BY date DESC
    LIMIT 5
  `;
  console.log('\nRecent stats:');
  stats.rows.forEach(s => {
    console.log(`  ${s.date} (date only: ${s.date_only}) - ${s.buildings_mapped} buildings`);
  });
  
  // Check if there's a stat for today in Nairobi time
  const todayStat = await sql`
    SELECT *
    FROM youth_osm_stats
    WHERE youth_id = 'KAY2333OO'
    AND date >= (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi' - INTERVAL '1 day')::date
  `;
  console.log('\nStats from yesterday to today:', JSON.stringify(todayStat.rows, null, 2));
}

check().catch(console.error);

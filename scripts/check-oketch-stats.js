// Check Oketch Ochieng (KAY2333OO) stats for today
// Changeset: https://www.openstreetmap.org/changeset/176978356
// 976 ways total - but how many are buildings?

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATA')));
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);

async function checkOketchStats() {
  console.log('\n=== Checking Oketch Ochieng (KAY2333OO) Stats ===\n');
  
  // Check youth record
  const youthResult = await sql`
    SELECT youth_id, full_name, osm_username
    FROM youth_participants
    WHERE youth_id = 'KAY2333OO'
  `;
  
  if (youthResult.length === 0) {
    console.log('❌ Youth KAY2333OO not found!');
    return;
  }
  
  console.log('Youth Record:');
  console.log(youthResult[0]);
  console.log('');
  
  // Check OSM stats for today (Jan 8, 2026)
  const osmStatsResult = await sql`
    SELECT youth_id, date, buildings_mapped, osm_username
    FROM youth_osm_stats
    WHERE youth_id = 'KAY2333OO'
    AND date = '2026-01-08'
  `;
  
  console.log('OSM Stats for Jan 8, 2026:');
  if (osmStatsResult.length === 0) {
    console.log('❌ No OSM stats found for today!');
  } else {
    console.log(osmStatsResult[0]);
  }
  console.log('');
  
  // Check work day for today
  const workDayResult = await sql`
    SELECT youth_id, work_date, buildings_count, target_met, status
    FROM youth_work_days
    WHERE youth_id = 'KAY2333OO'
    AND work_date = '2026-01-08'
  `;
  
  console.log('Work Day for Jan 8, 2026:');
  if (workDayResult.length === 0) {
    console.log('❌ No work day found for today!');
  } else {
    console.log(workDayResult[0]);
  }
  console.log('');
  
  // Check ALL youth stats for today to see if it's a systemic issue
  const allTodayStats = await sql`
    SELECT youth_id, osm_username, buildings_mapped
    FROM youth_osm_stats
    WHERE date = '2026-01-08'
    AND buildings_mapped > 0
    ORDER BY buildings_mapped DESC
    LIMIT 10
  `;
  
  console.log('Top 10 Youth with Buildings Mapped Today:');
  if (allTodayStats.length === 0) {
    console.log('❌ NO YOUTH HAVE BUILDINGS MAPPED TODAY!');
    console.log('🚨 THIS IS A SYSTEMIC ISSUE - COUNTING LOGIC BROKEN!');
  } else {
    console.table(allTodayStats);
  }
  console.log('');
  
  // Check count of youth with any stats today
  const countResult = await sql`
    SELECT 
      COUNT(*) as total_youth_today,
      SUM(CASE WHEN buildings_mapped > 0 THEN 1 ELSE 0 END) as youth_with_buildings,
      SUM(CASE WHEN buildings_mapped = 0 THEN 1 ELSE 0 END) as youth_with_zero_buildings
    FROM youth_osm_stats
    WHERE date = '2026-01-08'
  `;
  
  console.log('Summary for Jan 8, 2026:');
  console.log(countResult[0]);
  console.log('');
  
  if (countResult[0].youth_with_zero_buildings > countResult[0].youth_with_buildings) {
    console.log('🚨 ALERT: More youth have 0 buildings than > 0 buildings!');
    console.log('🚨 This suggests the building counting logic is BROKEN!');
  }
}

checkOketchStats().catch(console.error);

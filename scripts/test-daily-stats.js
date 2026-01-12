/**
 * Test daily stats API for a specific user
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function testDailyStats(youthId) {
  try {
    console.log(`\n=== Testing Daily Stats for ${youthId} ===\n`);
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`Today's date: ${today}\n`);
    
    // Check youth_osm_stats for today
    const osmStatsQuery = `
      SELECT date, buildings_mapped, last_changeset_id, last_upload_time
      FROM youth_osm_stats
      WHERE youth_id = $1 AND date = CURRENT_DATE
    `;
    const osmResult = await pool.query(osmStatsQuery, [youthId]);
    
    console.log('youth_osm_stats (today):');
    if (osmResult.rows.length === 0) {
      console.log('  ❌ No record for today');
    } else {
      const row = osmResult.rows[0];
      console.log(`  ✅ Date: ${row.date.toISOString().split('T')[0]}`);
      console.log(`  ✅ Buildings: ${row.buildings_mapped}`);
      console.log(`  ✅ Changeset: #${row.last_changeset_id}`);
      console.log(`  ✅ Upload Time: ${row.last_upload_time}`);
    }
    
    // Check youth_work_days for today
    const workDaysQuery = `
      SELECT work_date, buildings_count, status
      FROM youth_work_days
      WHERE youth_id = $1 AND work_date = CURRENT_DATE
    `;
    const workResult = await pool.query(workDaysQuery, [youthId]);
    
    console.log('\nyouth_work_days (today):');
    if (workResult.rows.length === 0) {
      console.log('  ❌ No record for today');
    } else {
      const row = workResult.rows[0];
      console.log(`  ✅ Date: ${row.work_date.toISOString().split('T')[0]}`);
      console.log(`  ✅ Buildings: ${row.buildings_count}`);
      console.log(`  ✅ Status: ${row.status}`);
    }
    
    // Check recent records
    console.log('\n--- Recent youth_osm_stats (Last 3 days) ---');
    const recentOsmQuery = `
      SELECT date, buildings_mapped
      FROM youth_osm_stats
      WHERE youth_id = $1
      ORDER BY date DESC
      LIMIT 3
    `;
    const recentOsm = await pool.query(recentOsmQuery, [youthId]);
    recentOsm.rows.forEach(r => {
      console.log(`  ${r.date.toISOString().split('T')[0]}: ${r.buildings_mapped} buildings`);
    });
    
    console.log('\n--- Recent youth_work_days (Last 3 days) ---');
    const recentWorkQuery = `
      SELECT work_date, buildings_count
      FROM youth_work_days
      WHERE youth_id = $1
      ORDER BY work_date DESC
      LIMIT 3
    `;
    const recentWork = await pool.query(recentWorkQuery, [youthId]);
    recentWork.rows.forEach(r => {
      console.log(`  ${r.work_date.toISOString().split('T')[0]}: ${r.buildings_count} buildings`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

const youthId = process.argv[2];
if (!youthId) {
  console.log('Usage: node test-daily-stats.js <youth_id>');
  process.exit(1);
}

testDailyStats(youthId.toUpperCase());

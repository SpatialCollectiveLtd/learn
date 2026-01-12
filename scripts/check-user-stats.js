/**
 * Check stats for a specific user by youth_id
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function checkUserStats(youthId) {
  try {
    console.log(`\n=== Checking stats for ${youthId} ===\n`);
    
    // Get user info
    const userQuery = `
      SELECT youth_id, full_name, osm_username, settlement, is_active
      FROM youth_participants 
      WHERE youth_id = $1
    `;
    const userResult = await pool.query(userQuery, [youthId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User Information:');
    console.log(`  Name: ${user.full_name}`);
    console.log(`  OSM Username: ${user.osm_username || '[Not Set]'}`);
    console.log(`  Settlement: ${user.settlement || '[Not Set]'}`);
    console.log(`  Active: ${user.is_active}`);
    
    // Get OSM stats
    const statsQuery = `
      SELECT 
        date,
        buildings_mapped,
        changesets_analyzed,
        last_changeset_id,
        last_upload_time,
        created_at,
        updated_at
      FROM youth_osm_stats 
      WHERE youth_id = $1
      ORDER BY date DESC
      LIMIT 10
    `;
    const statsResult = await pool.query(statsQuery, [youthId]);
    
    console.log('\n--- OSM Stats Table (Recent 10 days) ---');
    if (statsResult.rows.length === 0) {
      console.log('❌ No records in youth_osm_stats table');
    } else {
      statsResult.rows.forEach(stats => {
        console.log(`  ${stats.date}: ${stats.buildings_mapped || 0} buildings - ${stats.changesets_analyzed || 0} changesets`);
        if (stats.last_changeset_id) {
          console.log(`    Last changeset: #${stats.last_changeset_id}`);
        }
        if (stats.last_upload_time) {
          console.log(`    Last upload: ${stats.last_upload_time}`);
        }
      });
      console.log(`\nTotal days with stats: ${statsResult.rows.length}`);
    }
    
    // Get work days
    const workDaysQuery = `
      SELECT 
        work_date,
        buildings_count,
        status,
        target_met,
        created_at
      FROM youth_work_days 
      WHERE youth_id = $1
      ORDER BY work_date DESC
      LIMIT 10
    `;
    const workDaysResult = await pool.query(workDaysQuery, [youthId]);
    
    console.log('\n--- Recent Work Days (Last 10) ---');
    if (workDaysResult.rows.length === 0) {
      console.log('❌ No records in youth_work_days table');
    } else {
      workDaysResult.rows.forEach(day => {
        console.log(`  ${day.work_date}: ${day.buildings_count} buildings - ${day.status} - Target Met: ${day.target_met}`);
      });
      console.log(`\nTotal work days recorded: ${workDaysResult.rows.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

const youthId = process.argv[2];
if (!youthId) {
  console.log('Usage: node check-user-stats.js <youth_id>');
  console.log('Example: node check-user-stats.js KAY2805JK');
  process.exit(1);
}

checkUserStats(youthId.toUpperCase());

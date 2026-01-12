require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

const youthId = 'KAY2603GK';

async function checkUser() {
  try {
    console.log('\n=== Checking gillykarigo (KAY2603GK) ===\n');
    
    // Get user info
    const userQuery = `
      SELECT youth_id, full_name, osm_username, settlement, is_active
      FROM youth_participants 
      WHERE youth_id = $1
    `;
    const userResult = await pool.query(userQuery, [youthId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User Info:');
    console.log(`  Name: ${user.full_name}`);
    console.log(`  OSM Username: ${user.osm_username}`);
    console.log(`  Settlement: ${user.settlement}`);
    console.log(`  Active: ${user.is_active}`);
    
    // Check today's stats
    console.log('\n--- Today\'s Stats (CURRENT_DATE) ---');
    const todayQuery = `
      SELECT date, buildings_mapped, last_changeset_id, last_upload_time
      FROM youth_osm_stats
      WHERE youth_id = $1 AND date = CURRENT_DATE
    `;
    const todayResult = await pool.query(todayQuery, [youthId]);
    
    if (todayResult.rows.length === 0) {
      console.log('❌ NO stats for today (CURRENT_DATE)');
    } else {
      const row = todayResult.rows[0];
      console.log(`✅ Buildings: ${row.buildings_mapped}`);
      console.log(`   Changeset: #${row.last_changeset_id}`);
      console.log(`   Upload Time: ${row.last_upload_time}`);
    }
    
    // Check all recent stats
    console.log('\n--- All Recent Stats (Last 5 days) ---');
    const recentQuery = `
      SELECT date::text as date_str, buildings_mapped, last_changeset_id
      FROM youth_osm_stats
      WHERE youth_id = $1
      ORDER BY date DESC
      LIMIT 5
    `;
    const recentResult = await pool.query(recentQuery, [youthId]);
    
    if (recentResult.rows.length === 0) {
      console.log('❌ NO stats records at all');
    } else {
      recentResult.rows.forEach(row => {
        console.log(`  ${row.date_str}: ${row.buildings_mapped} buildings (changeset #${row.last_changeset_id || 'none'})`);
      });
    }
    
    // Check work days
    console.log('\n--- Recent Work Days (Last 5) ---');
    const workQuery = `
      SELECT work_date::text as date_str, buildings_count, status
      FROM youth_work_days
      WHERE youth_id = $1
      ORDER BY work_date DESC
      LIMIT 5
    `;
    const workResult = await pool.query(workQuery, [youthId]);
    
    if (workResult.rows.length === 0) {
      console.log('❌ NO work days recorded');
    } else {
      workResult.rows.forEach(row => {
        console.log(`  ${row.date_str}: ${row.buildings_count} buildings - ${row.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUser();

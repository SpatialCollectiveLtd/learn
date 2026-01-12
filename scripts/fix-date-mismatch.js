/**
 * Fix date mismatch - update Jan 8 records to Jan 9 for changesets uploaded on Jan 9
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function fixDateMismatch() {
  try {
    console.log('\n=== Fixing Date Mismatch ===\n');
    
    // Find records where upload time is Jan 9 but date is Jan 8
    const findQuery = `
      SELECT youth_id, osm_username, date, last_upload_time, buildings_mapped
      FROM youth_osm_stats
      WHERE date = '2026-01-08'
        AND last_upload_time >= '2026-01-09 00:00:00'
        AND last_upload_time < '2026-01-10 00:00:00'
    `;
    
    const result = await pool.query(findQuery);
    
    console.log(`Found ${result.rows.length} records to fix:\n`);
    result.rows.forEach(row => {
      console.log(`  ${row.osm_username} (${row.youth_id})`);
      console.log(`    Current date: ${row.date.toISOString().split('T')[0]}`);
      console.log(`    Upload time: ${row.last_upload_time}`);
      console.log(`    Buildings: ${row.buildings_mapped}`);
      console.log('');
    });
    
    if (result.rows.length === 0) {
      console.log('No records to fix!');
      return;
    }
    
    // Fix youth_osm_stats
    console.log('Updating youth_osm_stats...');
    const updateStatsQuery = `
      UPDATE youth_osm_stats
      SET date = '2026-01-09', updated_at = CURRENT_TIMESTAMP
      WHERE date = '2026-01-08'
        AND last_upload_time >= '2026-01-09 00:00:00'
        AND last_upload_time < '2026-01-10 00:00:00'
    `;
    const statsUpdate = await pool.query(updateStatsQuery);
    console.log(`✅ Updated ${statsUpdate.rowCount} records in youth_osm_stats\n`);
    
    // Fix youth_work_days (only if no Jan 9 record exists)
    console.log('Updating youth_work_days...');
    for (const row of result.rows) {
      // Check if Jan 9 record exists
      const checkQuery = `
        SELECT youth_id FROM youth_work_days
        WHERE youth_id = $1 AND work_date = '2026-01-09'
      `;
      const checkResult = await pool.query(checkQuery, [row.youth_id]);
      
      if (checkResult.rows.length > 0) {
        console.log(`  ${row.osm_username}: Jan 9 record already exists, skipping`);
      } else {
        // Update Jan 8 to Jan 9
        const updateWorkQuery = `
          UPDATE youth_work_days
          SET work_date = '2026-01-09', updated_at = CURRENT_TIMESTAMP
          WHERE youth_id = $1 AND work_date = '2026-01-08'
        `;
        await pool.query(updateWorkQuery, [row.youth_id]);
        console.log(`  ✅ ${row.osm_username}: Updated work_date from Jan 8 to Jan 9`);
      }
    }
    
    console.log('\n=== Fix Complete ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixDateMismatch();

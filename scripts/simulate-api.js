/**
 * Simulate the actual API query that the dashboard uses
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function simulateAPI() {
  try {
    const youthId = 'KAY2805JK';
    
    console.log('\n=== Simulating API /api/work/stats/daily ===\n');
    
    // This is what the API does - uses CURRENT_DATE
    const query = `
      SELECT 
        date, 
        buildings_mapped, 
        last_changeset_id
      FROM youth_osm_stats
      WHERE youth_id = '${youthId}' AND date = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      console.log('✅ FOUND today\'s record!');
      console.log(`   Buildings: ${result.rows[0].buildings_mapped}`);
      console.log(`   Changeset: #${result.rows[0].last_changeset_id}`);
      console.log(`\n✅ Dashboard will show: ${result.rows[0].buildings_mapped} buildings`);
    } else {
      console.log('❌ NO record for today');
      console.log('   Dashboard will show: 0 buildings');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

simulateAPI();

/**
 * Check database for recent OSM stats
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkDbStats() {
  const pool = new Pool({ 
    connectionString: process.env.NEON_DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  console.log('Checking Database for recent OSM stats...');
  console.log('='.repeat(70));
  
  // Check recent stats
  const stats = await pool.query(`
    SELECT 
      yos.youth_id,
      yp.osm_username,
      yos.date,
      yos.buildings_mapped
    FROM youth_osm_stats yos
    JOIN youth_participants yp ON yos.youth_id = yp.youth_id
    WHERE yos.date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY yos.date DESC, yos.buildings_mapped DESC
    LIMIT 20
  `);
  
  if (stats.rows.length === 0) {
    console.log('No OSM stats in last 7 days');
  } else {
    console.log('Recent stats from database (last 7 days):');
    for (const row of stats.rows) {
      console.log('  ', row.date.toISOString().split('T')[0], '|', row.youth_id, '|', row.osm_username, '|', row.buildings_mapped, 'buildings');
    }
  }
  
  // Check most recent stats overall
  console.log('\n\nMost recent stats in database (any date):');
  const recentStats = await pool.query(`
    SELECT 
      yos.youth_id,
      yp.osm_username,
      yos.date,
      yos.buildings_mapped
    FROM youth_osm_stats yos
    JOIN youth_participants yp ON yos.youth_id = yp.youth_id
    ORDER BY yos.date DESC
    LIMIT 10
  `);
  
  for (const row of recentStats.rows) {
    console.log('  ', row.date.toISOString().split('T')[0], '|', row.youth_id, '|', row.osm_username, '|', row.buildings_mapped, 'buildings');
  }
  
  // Check today specifically
  console.log('\n\nToday\'s stats (2026-01-14):');
  const todayStats = await pool.query(`
    SELECT 
      yos.youth_id,
      yp.osm_username,
      yos.buildings_mapped
    FROM youth_osm_stats yos
    JOIN youth_participants yp ON yos.youth_id = yp.youth_id
    WHERE yos.date = CURRENT_DATE
    ORDER BY yos.buildings_mapped DESC
  `);
  
  if (todayStats.rows.length === 0) {
    console.log('  No stats recorded for today yet');
  } else {
    for (const row of todayStats.rows) {
      console.log('  ', row.youth_id, '|', row.osm_username, '|', row.buildings_mapped, 'buildings');
    }
  }
  
  await pool.end();
}

checkDbStats().catch(e => console.log('Error:', e.message));

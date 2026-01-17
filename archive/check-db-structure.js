// Check database tables and how work days are tracked
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // List all tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('=== All Tables ===');
    console.log(tables.rows.map(x => x.table_name).join('\n'));
    
    // Check youth_osm_stats structure
    console.log('\n=== youth_osm_stats Columns ===');
    const statsCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'youth_osm_stats' ORDER BY ordinal_position
    `);
    statsCols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    // Check KAY1154SO OSM profile
    console.log('\n=== KAY1154SO Details ===');
    const user = await pool.query(`
      SELECT youth_id, full_name, osm_username, settlement, program_type
      FROM youth_participants WHERE youth_id = 'KAY1154SO'
    `);
    if (user.rows.length > 0) {
      console.log(user.rows[0]);
    }
    
    // Check their OSM stats
    console.log('\n=== KAY1154SO OSM Stats (All) ===');
    const stats = await pool.query(`
      SELECT * FROM youth_osm_stats 
      WHERE youth_id = 'KAY1154SO' 
      ORDER BY date DESC
    `);
    console.log('Total stats rows:', stats.rows.length);
    stats.rows.forEach(s => {
      console.log(`  Date: ${s.date}, Buildings: ${s.buildings_mapped}`);
    });
    
    // Check how many distinct dates we have stats for all KAY users
    console.log('\n=== Work Days by KAY User (from youth_osm_stats) ===');
    const workByUser = await pool.query(`
      SELECT youth_id, COUNT(DISTINCT date) as work_days, SUM(buildings_mapped) as total_buildings
      FROM youth_osm_stats
      WHERE youth_id LIKE 'KAY%'
      GROUP BY youth_id
      ORDER BY youth_id
    `);
    workByUser.rows.forEach(r => {
      console.log(`${r.youth_id}: ${r.work_days} days, ${r.total_buildings} buildings`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();

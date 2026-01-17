// Check youth_work_days and youth_work_summary tables
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check youth_work_days structure
    console.log('=== youth_work_days Columns ===');
    const wdCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'youth_work_days' ORDER BY ordinal_position
    `);
    wdCols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    // Check youth_work_summary structure
    console.log('\n=== youth_work_summary Columns ===');
    const wsCols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'youth_work_summary' ORDER BY ordinal_position
    `);
    wsCols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    // Check KAY users in youth_work_summary
    console.log('\n=== KAY Users Work Summary ===');
    const summary = await pool.query(`
      SELECT * FROM youth_work_summary 
      WHERE youth_id LIKE 'KAY%'
      ORDER BY youth_id
    `);
    console.log('Total rows:', summary.rows.length);
    summary.rows.forEach(r => {
      console.log(`${r.youth_id}: ${r.days_completed || 0}/${r.total_days || 20} days, Start: ${r.start_date}, End: ${r.end_date}`);
    });
    
    // Check KAY users in youth_work_days
    console.log('\n=== KAY Users Work Days (sample) ===');
    const workDays = await pool.query(`
      SELECT youth_id, COUNT(*) as days
      FROM youth_work_days
      WHERE youth_id LIKE 'KAY%'
      GROUP BY youth_id
      ORDER BY youth_id
    `);
    workDays.rows.forEach(r => {
      console.log(`${r.youth_id}: ${r.days} days recorded`);
    });
    
    // Check KAY1154SO specifically
    console.log('\n=== KAY1154SO Work Days Detail ===');
    const kay = await pool.query(`
      SELECT * FROM youth_work_days WHERE youth_id = 'KAY1154SO' ORDER BY work_date DESC
    `);
    console.log('Total work days:', kay.rows.length);
    kay.rows.forEach(r => {
      console.log(`  ${r.work_date}: Status=${r.status}, Buildings=${r.buildings_mapped}`);
    });
    
    // Check KAY1154SO's OSM account on openstreetmap
    const user = await pool.query(`SELECT osm_username FROM youth_participants WHERE youth_id = 'KAY1154SO'`);
    console.log('\n=== KAY1154SO OSM Username ===');
    console.log('OSM Username:', user.rows[0]?.osm_username);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();

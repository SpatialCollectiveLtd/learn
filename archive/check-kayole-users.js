// Check all Kayole digitization users and KAY1154SO stats
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // First get column names
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'youth_participants' ORDER BY ordinal_position
    `);
    console.log('Available columns:', cols.rows.map(x => x.column_name).join(', '));
    
    // Check all KAY users
    const result = await pool.query(`
      SELECT youth_id, full_name, osm_username, settlement, program_type, module_assignment, is_active
      FROM youth_participants 
      WHERE youth_id LIKE 'KAY%' AND program_type = 'digitization' AND is_active = TRUE
      ORDER BY youth_id
    `);
    
    console.log('\n=== Kayole Digitization Users ===');
    console.log('Total:', result.rows.length);
    result.rows.forEach(r => {
      console.log(`${r.youth_id} | ${r.full_name.padEnd(25)} | OSM: ${(r.osm_username || 'NONE').padEnd(20)} | Module: ${r.module_assignment}`);
    });
    
    // Check work_days table
    console.log('\n=== Work Days Table ===');
    const workDays = await pool.query(`
      SELECT wd.youth_id, COUNT(*) as days_completed
      FROM work_days wd
      JOIN youth_participants yp ON wd.youth_id = yp.youth_id
      WHERE yp.youth_id LIKE 'KAY%' AND yp.program_type = 'digitization'
      GROUP BY wd.youth_id
      ORDER BY wd.youth_id
    `);
    workDays.rows.forEach(r => {
      console.log(`${r.youth_id}: ${r.days_completed} work days completed`);
    });
    
    // Check KAY1154SO specifically
    console.log('\n=== KAY1154SO Full Details ===');
    const kay = await pool.query(`SELECT * FROM youth_participants WHERE youth_id = 'KAY1154SO'`);
    if (kay.rows.length > 0) {
      const user = kay.rows[0];
      console.log('Youth ID:', user.youth_id);
      console.log('Full Name:', user.full_name);
      console.log('OSM Username:', user.osm_username);
      console.log('Settlement:', user.settlement);
      console.log('Program:', user.program_type);
      console.log('Module:', user.module_assignment);
      console.log('Is Active:', user.is_active);
    } else {
      console.log('User not found!');
    }
    
    // Check their work days
    console.log('\n=== KAY1154SO Work Days ===');
    const kayWorkDays = await pool.query(`
      SELECT * FROM work_days WHERE youth_id = 'KAY1154SO' ORDER BY work_date DESC LIMIT 20
    `);
    console.log('Work days recorded:', kayWorkDays.rows.length);
    kayWorkDays.rows.forEach(w => {
      console.log(`  ${w.work_date} - Status: ${w.status}, Buildings: ${w.buildings_mapped || 0}`);
    });
    
    // Check their OSM stats in database
    console.log('\n=== KAY1154SO OSM Stats in Database ===');
    const stats = await pool.query(`
      SELECT date, buildings_mapped, changesets_analyzed, updated_at
      FROM youth_osm_stats 
      WHERE youth_id = 'KAY1154SO' 
      ORDER BY date DESC 
      LIMIT 10
    `);
    console.log('Stats rows:', stats.rows.length);
    if (stats.rows.length > 0) {
      stats.rows.forEach(s => {
        const dateStr = new Date(s.date).toISOString().split('T')[0];
        console.log(`  Date: ${dateStr}, Buildings: ${s.buildings_mapped}, Changesets: ${s.changesets_analyzed}`);
      });
    } else {
      console.log('No stats found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();

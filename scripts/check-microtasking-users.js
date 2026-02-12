const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.learn_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkMicrotasking() {
  try {
    console.log('Checking Microtasking Users...');

    // Count
    const countRes = await pool.query(`
      SELECT count(*) as count 
      FROM youth_participants 
      WHERE program_type = 'microtasking' AND is_active = true
    `);
    console.log(`Active Microtasking Youths: ${countRes.rows[0].count}`);

    // Sample
    const sampleRes = await pool.query(`
      SELECT youth_id, full_name, settlement, module_assignment
      FROM youth_participants 
      WHERE program_type = 'microtasking' AND is_active = true
      LIMIT 10
    `);
    
    if (sampleRes.rows.length > 0) {
      console.log('Sample Users:');
      sampleRes.rows.forEach(r => console.log(`- ${r.youth_id} (${r.full_name}) - ${r.settlement} [${r.module_assignment}]`));
    } else {
      console.log('No active microtasking users found.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkMicrotasking();

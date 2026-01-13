require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function check() {
  try {
    // Check all program types
    const result = await pool.query(`
      SELECT DISTINCT program_type, module_assignment 
      FROM youth_participants
    `);
    console.log('All program types and module assignments:');
    console.log(result.rows);
    
    // Check a mobile mapper
    const mobile = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment, settlement 
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' 
      LIMIT 3
    `);
    console.log('\nMobile mapping users:');
    console.log(mobile.rows);
    
    // Check training progress table structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_training_progress'
    `);
    console.log('\nTraining progress columns:');
    console.log(columns.rows);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();

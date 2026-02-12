const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.learn_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPrograms() {
  try {
    console.log('Checking Program Types...');

    const res = await pool.query(`
      SELECT program_type, count(*) as count 
      FROM youth_participants 
      GROUP BY program_type
    `);
    
    console.log('Program Types found:');
    console.table(res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkPrograms();

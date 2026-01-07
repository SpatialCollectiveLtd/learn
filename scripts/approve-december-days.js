const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function approveDays() {
  try {
    console.log('Approving all December work days...\n');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'approve-december-work-days.sql'),
      'utf8'
    );
    
    const result = await pool.query(sql);
    
    console.log('✅ All December work days approved!\n');
    console.log('Results by settlement:');
    console.table(result[1].rows);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

approveDays();

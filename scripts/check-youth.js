const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkYouth() {
  const result = await pool.query(`
    SELECT youth_id, full_name, program_type, odk_token 
    FROM youth_participants 
    WHERE program_type = 'mobile_mapping' 
    LIMIT 5
  `);
  console.log('Mobile mapping youth:');
  result.rows.forEach(r => console.log(r));
  pool.end();
}

checkYouth();

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkRegina() {
  const result = await pool.query(`
    SELECT youth_id, full_name, program_type, odk_token, odk_actor_id, odk_configured_at
    FROM youth_participants 
    WHERE youth_id = 'KAY348RN'
  `);
  console.log('Regina:', result.rows[0] || 'NOT FOUND');
  pool.end();
}

checkRegina();

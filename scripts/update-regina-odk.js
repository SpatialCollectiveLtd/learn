/**
 * Update Regina's ODK token from the test we ran earlier
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateRegina() {
  const client = await pool.connect();
  try {
    // Update Regina's ODK token (from our test earlier)
    const token = 'uRS9gIVpqsMJ0J5VyEpSdI5g4nZa$pp0l6cAfe9D6FvrjiSt5bo$4vkI2mh5egSc';
    const result = await client.query(`
      UPDATE youth_participants 
      SET odk_token = $1, odk_actor_id = 7088, odk_configured_at = NOW() 
      WHERE youth_id = 'KAY348RN' 
      RETURNING youth_id, full_name, odk_configured_at
    `, [token]);
    
    if (result.rows.length > 0) {
      console.log('✓ Updated Regina:', result.rows[0]);
    } else {
      console.log('Regina not found in database');
    }
  } finally {
    client.release();
    pool.end();
  }
}

updateRegina();

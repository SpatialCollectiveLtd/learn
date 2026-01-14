/**
 * Add ODK token columns to youth_participants table
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addOdkColumns() {
  const client = await pool.connect();
  try {
    // Add odk columns if they don't exist
    await client.query(`
      ALTER TABLE youth_participants 
      ADD COLUMN IF NOT EXISTS odk_token TEXT,
      ADD COLUMN IF NOT EXISTS odk_actor_id INTEGER,
      ADD COLUMN IF NOT EXISTS odk_configured_at TIMESTAMP WITH TIME ZONE
    `);
    console.log('✓ Added ODK columns to youth_participants');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants' 
      AND column_name LIKE 'odk%'
    `);
    console.log('ODK columns:', result.rows);
  } finally {
    client.release();
    pool.end();
  }
}

addOdkColumns().catch(console.error);

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addOsmUsernameColumn() {
  try {
    console.log('Adding osm_username column to youth_participants table...');
    
    const sql = fs.readFileSync('database/add-osm-username-column.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✓ Column added successfully');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants' 
      AND column_name = 'osm_username'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Verification successful:', result.rows[0]);
    } else {
      console.log('⚠ Column not found after creation');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addOsmUsernameColumn();

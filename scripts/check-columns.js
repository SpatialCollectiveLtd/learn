const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'youth_participants' 
    ORDER BY ordinal_position
  `);
  console.log('Columns:', result.rows.map(x => x.column_name).join(', '));
  pool.end();
}

checkColumns();

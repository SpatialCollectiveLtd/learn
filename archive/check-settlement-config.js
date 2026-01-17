// Check settlement_work_config structure and current data
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Get columns
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'settlement_work_config' ORDER BY ordinal_position
    `);
    console.log('=== settlement_work_config Columns ===');
    cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    
    // Get current data
    console.log('\n=== Current settlement_work_config Data ===');
    const data = await pool.query(`SELECT * FROM settlement_work_config`);
    data.rows.forEach(r => {
      console.log(JSON.stringify(r, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();

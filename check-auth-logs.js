const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLogs() {
  try {
    const result = await pool.query(`
      SELECT user_id, action, success, error_message, created_at 
      FROM auth_logs 
      WHERE user_type = 'staff' 
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    
    console.log('\n📋 Recent Staff Login Attempts:\n');
    console.table(result.rows);
    
    const scLogins = result.rows.filter(r => r.user_id && r.user_id.startsWith('SC'));
    if (scLogins.length > 0) {
      console.log('\n⚠️  SC### Login Attempts Found:');
      console.table(scLogins);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkLogs();

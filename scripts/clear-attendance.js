const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearAttendance() {
  try {
    // Check current count
    const countBefore = await pool.query('SELECT COUNT(*) FROM attendance_records');
    console.log('Current attendance records:', countBefore.rows[0].count);
    
    // Delete all records
    const result = await pool.query('DELETE FROM attendance_records');
    console.log('\n✅ Deleted', result.rowCount, 'attendance records');
    
    // Verify
    const countAfter = await pool.query('SELECT COUNT(*) FROM attendance_records');
    console.log('Remaining records:', countAfter.rows[0].count);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

clearAttendance();

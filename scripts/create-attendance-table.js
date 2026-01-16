/**
 * Create attendance_records table for tracking daily attendance
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('Creating attendance_records table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        youth_id VARCHAR(20) NOT NULL REFERENCES youth_participants(youth_id),
        attendance_date DATE NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submitted_by VARCHAR(50) NOT NULL,
        notes TEXT,
        UNIQUE(youth_id, attendance_date)
      )
    `);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_attendance_youth ON attendance_records(youth_id)`);
    
    console.log('✓ Table created successfully');
    
    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

main();

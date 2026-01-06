const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('Running migration: add-module-assignment.sql');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'add-module-assignment.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the results
    const result = await pool.query(`
      SELECT 
        program_type,
        module_assignment,
        COUNT(*) as count
      FROM youth_participants
      WHERE program_type = 'digitization'
      GROUP BY program_type, module_assignment
      ORDER BY module_assignment;
    `);
    
    console.log('\n=== Module Assignment Summary ===');
    console.table(result.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();

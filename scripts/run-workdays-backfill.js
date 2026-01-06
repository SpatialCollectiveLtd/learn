const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runBackfill() {
  try {
    console.log('Running work days backfill migration...\n');
    
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migrations', 'backfill-december-work-days.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Show results
    const summary = await pool.query(`
      SELECT 
        yp.settlement,
        COUNT(DISTINCT ywd.work_date) as work_days,
        COUNT(DISTINCT ywd.youth_id) as youths,
        20 - COUNT(DISTINCT ywd.work_date) as days_remaining,
        MIN(ywd.work_date) as first_day,
        MAX(ywd.work_date) as last_day
      FROM youth_work_days ywd
      JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
      WHERE yp.program_type = 'digitization'
      GROUP BY yp.settlement
      ORDER BY yp.settlement
    `);
    
    console.log('Work Days Summary:');
    console.log('='.repeat(100));
    console.table(summary.rows);
    
    console.log('\nNext work day: January 7, 2026 (tomorrow)');
    console.log('Fresh building tracking starts tomorrow.');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runBackfill();

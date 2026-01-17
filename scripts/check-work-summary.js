const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkWorkSummary() {
  // Check columns
  const columns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'youth_work_summary'
    ORDER BY ordinal_position
  `);
  
  console.log('youth_work_summary columns:');
  columns.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
  
  // Check sample data
  console.log('\nSample data from youth_work_summary:');
  const sample = await pool.query(`
    SELECT * FROM youth_work_summary 
    WHERE youth_id IN (SELECT youth_id FROM youth_participants WHERE program_type = 'mobile_mapping' LIMIT 1)
    LIMIT 1
  `);
  
  if (sample.rows.length > 0) {
    console.log(JSON.stringify(sample.rows[0], null, 2));
  } else {
    console.log('No data found');
  }
  
  // Also check youth_work_days
  console.log('\nyouth_work_days columns:');
  const workDaysColumns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'youth_work_days'
    ORDER BY ordinal_position
  `);
  workDaysColumns.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
  
  pool.end();
}

checkWorkSummary().catch(console.error);

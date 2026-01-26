require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkConfig() {
  console.log('\n=== Current Digitization Settlement Config ===\n');
  
  const result = await pool.query(`
    SELECT settlement, program_type, start_date, total_work_days, daily_target
    FROM settlement_work_config 
    WHERE program_type = 'digitization'
    ORDER BY settlement
  `);
  
  result.rows.forEach(row => {
    console.log(`${row.settlement}:`);
    console.log(`  Start Date: ${row.start_date}`);
    console.log(`  Total Work Days: ${row.total_work_days}`);
    console.log(`  Daily Target: ${row.daily_target}`);
    console.log('');
  });
  
  // Check sample youth work days
  console.log('\n=== Sample Youth Work Days (Kariobangi) ===\n');
  
  const sampleYouth = await pool.query(`
    SELECT yp.youth_id, yp.full_name, yp.settlement,
           COUNT(ywd.work_date) as days_worked_2025,
           COUNT(CASE WHEN ywd.work_date >= '2026-01-01' THEN 1 END) as days_worked_2026
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
    WHERE yp.settlement = 'Kariobangi Machakos' 
      AND yp.program_type = 'digitization'
      AND yp.is_active = TRUE
    GROUP BY yp.youth_id, yp.full_name, yp.settlement
    ORDER BY yp.youth_id
    LIMIT 5
  `);
  
  sampleYouth.rows.forEach(row => {
    const total = row.days_worked_2025 + row.days_worked_2026;
    const remaining = 20 - total;
    console.log(`${row.youth_id} - ${row.full_name}:`);
    console.log(`  Days worked in 2025: ${row.days_worked_2025}`);
    console.log(`  Days worked in 2026: ${row.days_worked_2026}`);
    console.log(`  Total: ${total}/20 (${remaining} remaining)`);
    console.log('');
  });
  
  await pool.end();
}

checkConfig().catch(console.error);

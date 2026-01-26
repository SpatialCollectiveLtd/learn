/**
 * Update Digitization Work Configuration for 2026
 * 
 * All digitization users resumed work on January 7, 2026
 * They worked some days in 2025 and need to complete 20 total days
 * Kariobangi: 5 days in 2025, need 15 more (ends Jan 27, 2026)
 * Kayole: Check actual days worked
 * Huruma: Check actual days worked
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateDigitizationConfig() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Updating Digitization Work Configuration for 2026\n');
    console.log('='.repeat(70));
    
    // 1. Update start date to January 7, 2026 for all digitization settlements
    console.log('\n1. Updating start_date to January 7, 2026...\n');
    
    await client.query(`
      UPDATE settlement_work_config
      SET start_date = '2026-01-07'
      WHERE program_type = 'digitization'
    `);
    
    console.log('✅ Start date updated for all digitization settlements');
    
    // 2. Verify the update
    const config = await client.query(`
      SELECT settlement, program_type, start_date, total_work_days
      FROM settlement_work_config
      WHERE program_type = 'digitization'
      ORDER BY settlement
    `);
    
    console.log('\n📋 Updated Configuration:\n');
    config.rows.forEach(row => {
      console.log(`${row.settlement}:`);
      console.log(`  Start Date: ${row.start_date}`);
      console.log(`  Total Days: ${row.total_work_days}`);
      console.log('');
    });
    
    // 3. Check work days per settlement
    console.log('\n=== Work Days Analysis (by Settlement) ===\n');
    
    const settlements = ['Kariobangi Machakos', 'Kayole', 'Mji wa Huruma'];
    
    for (const settlement of settlements) {
      console.log(`${settlement}:`);
      
      const analysis = await client.query(`
        SELECT 
          COUNT(DISTINCT yp.youth_id) as total_youth,
          COUNT(CASE WHEN ywd.work_date < '2026-01-01' THEN ywd.work_day_id END) as days_2025,
          COUNT(CASE WHEN ywd.work_date >= '2026-01-01' THEN ywd.work_day_id END) as days_2026,
          COUNT(ywd.work_day_id) as total_days
        FROM youth_participants yp
        LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
        WHERE yp.settlement = $1
          AND yp.program_type = 'digitization'
          AND yp.is_active = TRUE
      `, [settlement]);
      
      const row = analysis.rows[0];
      console.log(`  Total Youth: ${row.total_youth}`);
      console.log(`  Days worked in 2025: ${row.days_2025}`);
      console.log(`  Days worked in 2026: ${row.days_2026}`);
      console.log(`  Total days recorded: ${row.total_days}`);
      console.log('');
    }
    
    // 4. Calculate expected end dates
    console.log('\n=== Expected End Dates (15 working days from Jan 7) ===\n');
    console.log('Start: January 7, 2026 (Tuesday)');
    console.log('Working days needed: 15 (excluding weekends)');
    console.log('Expected end: January 27, 2026 (Monday)');
    console.log('\nBreakdown:');
    console.log('  Jan 7-10 (Tue-Fri): 4 days');
    console.log('  Jan 13-17 (Mon-Fri): 5 days  = 9 total');
    console.log('  Jan 20-24 (Mon-Fri): 5 days  = 14 total');
    console.log('  Jan 27 (Mon): 1 day          = 15 total');
    console.log('');
    console.log('As of today (Jan 26 - Sunday):');
    console.log('  Completed work days: 14/15');
    console.log('  Tomorrow (Jan 27 - Monday) will be day 15');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Configuration Updated Successfully!');
    console.log('');
    console.log('📌 Next Steps:');
    console.log('  1. Users will now see correct day counts');
    console.log('  2. Dashboard shows: (2025 days + 2026 days) / 20');
    console.log('  3. For Kariobangi: (5 + 14) = 19/20 days');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateDigitizationConfig();

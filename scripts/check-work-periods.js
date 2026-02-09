require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkWorkPeriods() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔍 CHECKING WORK PERIOD CONFIGURATION');
    console.log('='.repeat(80));

    // Check current settlement_work_config
    const config = await pool.query(`
      SELECT 
        settlement,
        program_type,
        start_date,
        total_work_days,
        daily_target,
        created_at
      FROM settlement_work_config
      WHERE program_type = 'mobile_mapping'
      ORDER BY settlement
    `);

    console.log('\n📅 CURRENT WORK PERIOD CONFIG (Mobile Mapping):');
    if (config.rowCount === 0) {
      console.log('   ⚠️  No configurations found!');
    } else {
      config.rows.forEach(row => {
        const startDate = new Date(row.start_date);
        const endDate = new Date(startDate);
        // Add total_work_days - 1 (since start date is day 1)
        endDate.setDate(endDate.getDate() + (row.total_work_days - 1));
        
        console.log(`\n   ${row.settlement.toUpperCase()}:`);
        console.log(`      Start Date: ${startDate.toISOString().split('T')[0]}`);
        console.log(`      Total Days: ${row.total_work_days}`);
        console.log(`      Calculated End: ${endDate.toISOString().split('T')[0]}`);
        console.log(`      Daily Target: ${row.daily_target}`);
      });
    }

    // What the dates SHOULD be according to user
    console.log('\n📋 EXPECTED WORK PERIODS (User Provided):');
    console.log('\n   KAYOLE SOWETO:');
    console.log('      Start: 2026-01-14');
    console.log('      End: 2026-02-10 (20 work days)');
    
    console.log('\n   MJI WA HURUMA:');
    console.log('      Start: 2026-01-22');
    console.log('      End: 2026-02-18 (20 work days)');
    
    console.log('\n   KARIOBANGI MACHAKOS:');
    console.log('      Start: 2026-01-26');
    console.log('      End: 2026-02-20 (20 work days)');

    // Calculate what the dates should be
    console.log('\n🔢 VERIFICATION (20 work days including start date):');
    
    const kayoleStart = new Date('2026-01-14');
    const kayoleEnd = new Date(kayoleStart);
    kayoleEnd.setDate(kayoleEnd.getDate() + 19); // 19 days after start = 20 total
    console.log(`\n   KAYOLE: ${kayoleStart.toISOString().split('T')[0]} → ${kayoleEnd.toISOString().split('T')[0]}`);
    
    const hurumaStart = new Date('2026-01-22');
    const hurumaEnd = new Date(hurumaStart);
    hurumaEnd.setDate(hurumaEnd.getDate() + 19);
    console.log(`   HURUMA: ${hurumaStart.toISOString().split('T')[0]} → ${hurumaEnd.toISOString().split('T')[0]}`);
    
    const kariobangiStart = new Date('2026-01-26');
    const kariobangiEnd = new Date(kariobangiStart);
    kariobangiEnd.setDate(kariobangiEnd.getDate() + 19);
    console.log(`   KARIOBANGI: ${kariobangiStart.toISOString().split('T')[0]} → ${kariobangiEnd.toISOString().split('T')[0]}`);

    // Check work days submitted
    console.log('\n📊 WORK DAYS SUBMITTED BY SETTLEMENT:');
    const workDays = await pool.query(`
      SELECT 
        yp.settlement,
        COUNT(DISTINCT wd.work_date) as days_submitted,
        MIN(wd.work_date) as first_day,
        MAX(wd.work_date) as last_day
      FROM youth_work_days wd
      JOIN youth_participants yp ON wd.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
      GROUP BY yp.settlement
      ORDER BY yp.settlement
    `);

    workDays.rows.forEach(row => {
      console.log(`\n   ${row.settlement.toUpperCase()}:`);
      console.log(`      Days submitted: ${row.days_submitted}`);
      console.log(`      First work day: ${row.first_day ? new Date(row.first_day).toISOString().split('T')[0] : 'N/A'}`);
      console.log(`      Last work day: ${row.last_day ? new Date(row.last_day).toISOString().split('T')[0] : 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkWorkPeriods();

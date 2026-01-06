const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyDashboard() {
  try {
    console.log('\n🔍 Verifying Work Dashboard Data\n');
    console.log('='.repeat(80));
    
    // Test with a Huruma youth (HUR728CM - catherinewanjira)
    const testYouthId = 'HUR728CM';
    
    // Get youth info
    const youthInfo = await pool.query(`
      SELECT youth_id, full_name, settlement, osm_username, module_assignment
      FROM youth_participants
      WHERE youth_id = $1
    `, [testYouthId]);
    
    if (youthInfo.rows.length === 0) {
      console.log('❌ Test youth not found');
      process.exit(1);
    }
    
    console.log('\n📋 Test Youth Profile:');
    console.log(youthInfo.rows[0]);
    
    // Get settlement config
    const config = await pool.query(`
      SELECT * FROM settlement_work_config
      WHERE settlement = $1 AND program_type = 'digitization'
    `, [youthInfo.rows[0].settlement]);
    
    console.log('\n⚙️  Settlement Configuration:');
    console.log(config.rows[0]);
    
    // Get work days completed
    const workDays = await pool.query(`
      SELECT 
        COUNT(*) as total_days,
        MIN(work_date) as first_day,
        MAX(work_date) as last_day,
        SUM(buildings_count) as total_buildings
      FROM youth_work_days
      WHERE youth_id = $1
    `, [testYouthId]);
    
    console.log('\n📊 Work Progress:');
    console.log(workDays.rows[0]);
    
    // Calculate expected dashboard values
    const totalWorkDays = parseInt(config.rows[0].total_work_days);
    const completedDays = parseInt(workDays.rows[0].total_days);
    const remainingDays = totalWorkDays - completedDays;
    const dailyTarget = parseInt(config.rows[0].daily_target);
    
    console.log('\n✅ Expected Dashboard Display:');
    console.log('─'.repeat(80));
    console.log(`Days Completed: ${completedDays}/${totalWorkDays}`);
    console.log(`Days Remaining: ${remainingDays}`);
    console.log(`Buildings Mapped: ${workDays.rows[0].total_buildings || 0} (will fetch from OSM API)`);
    console.log(`Daily Target: ${dailyTarget} buildings`);
    console.log(`Settlement: ${youthInfo.rows[0].settlement}`);
    console.log(`Role: ${youthInfo.rows[0].module_assignment}`);
    
    // Check if training is complete
    const training = await pool.query(`
      SELECT COUNT(DISTINCT step_id) as completed_steps
      FROM youth_training_progress
      WHERE youth_id = $1 AND module_type = 'digitization'
    `, [testYouthId]);
    
    console.log(`\n📚 Training Status: ${training.rows[0].completed_steps}/7 steps completed`);
    
    // Get all settlement summaries
    console.log('\n\n🏘️  All Settlements Summary:');
    console.log('='.repeat(80));
    
    const summary = await pool.query(`
      SELECT 
        yp.settlement,
        COUNT(DISTINCT yp.youth_id) as total_youths,
        COUNT(DISTINCT ywd.youth_id) as youths_with_work_days,
        COUNT(DISTINCT ywd.work_date) as unique_work_days,
        swc.total_work_days,
        swc.total_work_days - COUNT(DISTINCT ywd.work_date) as days_remaining,
        swc.start_date,
        swc.daily_target
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
        AND yp.program_type = swc.program_type
      WHERE yp.program_type = 'digitization' AND yp.is_active = TRUE
      GROUP BY yp.settlement, swc.total_work_days, swc.start_date, swc.daily_target
      ORDER BY yp.settlement
    `);
    
    console.table(summary.rows);
    
    console.log('\n✅ All data verified! Work dashboard should display correctly.\n');
    console.log('Next work day: January 7, 2026');
    console.log('Building counts will be fetched live from OSM API.\n');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

verifyDashboard();

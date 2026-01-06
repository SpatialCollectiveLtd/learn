const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test with Catherine Mararo from screenshot (Mji wa Huruma)
const TEST_YOUTH_ID = 'HUR728CM';

async function debugWorkDashboard() {
  try {
    console.log('='.repeat(80));
    console.log('DEBUGGING WORK DASHBOARD - OSM STATS & DATES');
    console.log('='.repeat(80));
    
    // Step 1: Get youth info
    const youthResult = await pool.query(`
      SELECT youth_id, full_name, osm_username, settlement, program_type
      FROM youth_participants
      WHERE youth_id = $1
    `, [TEST_YOUTH_ID]);
    
    const youth = youthResult.rows[0];
    console.log('\nStep 1: Youth Information');
    console.log('-'.repeat(80));
    console.log(`Youth ID: ${youth.youth_id}`);
    console.log(`Name: ${youth.full_name}`);
    console.log(`Settlement: ${youth.settlement}`);
    console.log(`OSM Username: ${youth.osm_username || 'NOT SET'}`);
    
    // Step 2: Check settlement_work_config
    console.log('\nStep 2: Settlement Work Configuration');
    console.log('-'.repeat(80));
    
    const configResult = await pool.query(`
      SELECT settlement, program_type, start_date, total_work_days, daily_target, 
             project_hashtag, is_active
      FROM settlement_work_config
      WHERE settlement = $1 AND program_type = $2
    `, [youth.settlement, youth.program_type]);
    
    if (configResult.rows.length === 0) {
      console.log('❌ NO WORK CONFIGURATION FOUND!');
      console.log(`   Missing config for: ${youth.settlement} + ${youth.program_type}`);
      
      // Show all existing configs
      const allConfigs = await pool.query(`
        SELECT settlement, program_type, start_date, total_work_days, is_active
        FROM settlement_work_config
        ORDER BY settlement, program_type
      `);
      
      console.log('\nExisting configurations:');
      if (allConfigs.rows.length === 0) {
        console.log('   ❌ NO CONFIGURATIONS IN DATABASE!');
      } else {
        allConfigs.rows.forEach(c => {
          console.log(`   - ${c.settlement} | ${c.program_type} | Start: ${c.start_date} | Days: ${c.total_work_days} | Active: ${c.is_active}`);
        });
      }
    } else {
      const config = configResult.rows[0];
      console.log(`Settlement: ${config.settlement}`);
      console.log(`Program: ${config.program_type}`);
      console.log(`Start Date: ${config.start_date}`);
      console.log(`Total Work Days: ${config.total_work_days}`);
      console.log(`Daily Target: ${config.daily_target}`);
      console.log(`Project Hashtag: ${config.project_hashtag}`);
      console.log(`Active: ${config.is_active ? '✅' : '❌'}`);
      
      // Calculate work period
      const startDate = new Date(config.start_date);
      const today = new Date();
      const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, config.total_work_days - daysPassed);
      
      console.log(`\nWork Period Calculation:`);
      console.log(`  Start Date: ${startDate.toDateString()}`);
      console.log(`  Today: ${today.toDateString()}`);
      console.log(`  Days Passed: ${daysPassed}`);
      console.log(`  Days Remaining: ${daysRemaining}/${config.total_work_days}`);
    }
    
    // Step 3: Check all settlements with configs
    console.log('\n\nStep 3: ALL Settlement Configurations');
    console.log('-'.repeat(80));
    
    const allSettlements = await pool.query(`
      SELECT DISTINCT settlement FROM youth_participants 
      WHERE program_type = 'digitization' 
      ORDER BY settlement
    `);
    
    for (const row of allSettlements.rows) {
      const settlement = row.settlement;
      const config = await pool.query(`
        SELECT start_date, total_work_days, daily_target, is_active
        FROM settlement_work_config
        WHERE settlement = $1 AND program_type = 'digitization'
      `, [settlement]);
      
      if (config.rows.length === 0) {
        console.log(`❌ ${settlement}: NO CONFIG`);
      } else {
        const c = config.rows[0];
        console.log(`✅ ${settlement}: Start ${c.start_date} | ${c.total_work_days} days | Target: ${c.daily_target} | Active: ${c.is_active}`);
      }
    }
    
    // Step 4: Sample OSM data check (if we had the username)
    if (youth.osm_username) {
      console.log('\n\nStep 4: OSM Username Check');
      console.log('-'.repeat(80));
      console.log(`OSM Username: ${youth.osm_username}`);
      console.log('NOTE: Actual OSM stats require API call to OpenStreetMap');
      console.log('      This would be done by /api/work/stats/daily endpoint');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

debugWorkDashboard();

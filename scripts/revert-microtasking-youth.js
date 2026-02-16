/**
 * Check and revert the 25 youth moved from mobile mapping to microtasking
 * Purpose: Demonstrate the work history visibility issue and revert the changes
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// The 25 youth IDs from the CSV
const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function checkCurrentStatus() {
  console.log('\n🔍 CHECKING CURRENT STATUS OF 25 YOUTH\n');
  console.log('='.repeat(80));
  
  const result = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.program_type,
      yp.settlement,
      
      -- Work days count
      COUNT(ywd.work_day_id) as work_days_count,
      MIN(ywd.work_date) as first_work_date,
      MAX(ywd.work_date) as last_work_date,
      SUM(ywd.buildings_count) as total_buildings,
      
      -- Settlement config check
      swc.daily_target,
      swc.start_date as config_start_date,
      swc.is_active as config_active
      
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
    LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement AND yp.program_type = swc.program_type
    WHERE yp.youth_id = ANY($1)
    GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.settlement, swc.daily_target, swc.start_date, swc.is_active
    ORDER BY yp.youth_id
  `, [youthIds]);

  console.log('Current Status:');
  console.log('-'.repeat(80));
  
  result.rows.forEach(youth => {
    const workStatus = youth.work_days_count > 0 
      ? `${youth.work_days_count} days (${youth.first_work_date} to ${youth.last_work_date})`
      : 'No work days found';
      
    const configStatus = youth.config_active 
      ? `✅ Config exists (target: ${youth.daily_target})`
      : '❌ No config found';
      
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${youth.program_type.padEnd(15)} | ${workStatus.padEnd(30)} | ${configStatus}`);
  });

  const summary = {
    total: result.rows.length,
    withWork: result.rows.filter(y => y.work_days_count > 0).length,
    withConfig: result.rows.filter(y => y.config_active).length,
    totalWorkDays: result.rows.reduce((sum, y) => sum + parseInt(y.work_days_count || 0), 0),
    totalBuildings: result.rows.reduce((sum, y) => sum + parseInt(y.total_buildings || 0), 0)
  };

  console.log('\n📊 SUMMARY:');
  console.log(`   Total Youth: ${summary.total}`);
  console.log(`   Youth with Work History: ${summary.withWork} (${Math.round(summary.withWork/summary.total*100)}%)`);
  console.log(`   Youth with Config: ${summary.withConfig} (${Math.round(summary.withConfig/summary.total*100)}%)`);
  console.log(`   Total Work Days: ${summary.totalWorkDays}`);
  console.log(`   Total Buildings: ${summary.totalBuildings}`);

  return result.rows;
}

async function checkWorkHistoryDetails() {
  console.log('\n📋 DETAILED WORK HISTORY CHECK\n');
  console.log('='.repeat(80));
  
  // Check if these youth have work days but no config (the invisible data problem)
  const result = await pool.query(`
    SELECT 
      ywd.youth_id,
      yp.full_name,
      yp.program_type as current_program,
      COUNT(*) as work_days,
      MIN(ywd.work_date) as first_work,
      MAX(ywd.work_date) as last_work,
      SUM(ywd.buildings_count) as buildings,
      AVG(ywd.buildings_count) as avg_buildings,
      
      -- Check if settlement has mobile_mapping config
      (SELECT EXISTS(
        SELECT 1 FROM settlement_work_config 
        WHERE settlement = yp.settlement 
        AND program_type = 'mobile_mapping' 
        AND is_active = TRUE
      )) as has_mobile_mapping_config,
      
      -- Check if settlement has microtasking config
      (SELECT EXISTS(
        SELECT 1 FROM settlement_work_config 
        WHERE settlement = yp.settlement 
        AND program_type = 'microtasking' 
        AND is_active = TRUE
      )) as has_microtasking_config
      
    FROM youth_work_days ywd
    JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
    WHERE ywd.youth_id = ANY($1) 
    AND ywd.status = 'approved'
    GROUP BY ywd.youth_id, yp.full_name, yp.program_type, yp.settlement
    ORDER BY work_days DESC
  `, [youthIds]);

  console.log('Work History Analysis:');
  console.log('-'.repeat(120));
  console.log('Youth ID     | Name                 | Current Program | Work Days | Period              | Buildings | MM Config | MT Config');
  console.log('-'.repeat(120));

  result.rows.forEach(youth => {
    const period = `${youth.first_work} to ${youth.last_work}`;
    const mmConfig = youth.has_mobile_mapping_config ? '✅' : '❌';
    const mtConfig = youth.has_microtasking_config ? '✅' : '❌';
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${youth.current_program.padEnd(15)} | ${String(youth.work_days).padEnd(9)} | ${period.padEnd(19)} | ${String(youth.buildings).padEnd(9)} | ${mmConfig.padEnd(9)} | ${mtConfig}`);
  });

  console.log('\n🔍 ANALYSIS:');
  const youthWithWork = result.rows.length;
  const currentMicrotasking = result.rows.filter(y => y.current_program === 'microtasking').length;
  const hasMMConfig = result.rows.filter(y => y.has_mobile_mapping_config).length;
  const hasMTConfig = result.rows.filter(y => y.has_microtasking_config).length;
  
  console.log(`   Youth with work history: ${youthWithWork}/${youthIds.length}`);
  console.log(`   Currently microtasking: ${currentMicrotasking}/${youthIds.length}`);
  console.log(`   Have mobile_mapping config: ${hasMMConfig}/${youthIds.length}`);
  console.log(`   Have microtasking config: ${hasMTConfig}/${youthIds.length}`);
  
  if (youthWithWork > 0 && currentMicrotasking > 0 && hasMTConfig === 0) {
    console.log(`\n⚠️  ISSUE DETECTED: Youth have work history but are assigned to microtasking without proper config!`);
    console.log(`   This is the "invisible work history" problem - work exists but can't be accessed.`);
  }

  return result.rows;
}

async function revertToMobileMapping() {
  console.log('\n🔄 REVERTING 25 YOUTH BACK TO MOBILE MAPPING\n');
  console.log('='.repeat(60));
  
  try {
    console.log('Updating program_type from microtasking back to mobile_mapping...');
    
    const result = await pool.query(`
      UPDATE youth_participants 
      SET 
        program_type = 'mobile_mapping',
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = ANY($1) 
      AND program_type = 'microtasking'
      RETURNING youth_id, full_name, program_type
    `, [youthIds]);

    console.log(`\n✅ Successfully reverted ${result.rows.length} youth back to mobile_mapping:`);
    result.rows.forEach((youth, index) => {
      console.log(`   ${index + 1}. ${youth.youth_id} - ${youth.full_name}`);
    });

    if (result.rows.length < youthIds.length) {
      console.log(`\n⚠️  Note: Only ${result.rows.length}/${youthIds.length} youth were reverted.`);
      console.log(`   The remaining youth may already be mobile_mapping or not found.`);
    }

    return result.rows;
    
  } catch (error) {
    console.error('❌ Error during revert:', error.message);
    throw error;
  }
}

async function verifyAfterRevert() {
  console.log('\n✅ VERIFICATION AFTER REVERT\n');
  console.log('='.repeat(80));
  
  const result = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.program_type,
      
      -- Work days should now be visible
      COUNT(ywd.work_day_id) as work_days_count,
      MIN(ywd.work_date) as first_work_date,
      MAX(ywd.work_date) as last_work_date,
      SUM(ywd.buildings_count) as total_buildings,
      
      -- Settlement config should now work
      swc.daily_target,
      swc.start_date as config_start_date,
      swc.is_active as config_active
      
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
    LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement AND yp.program_type = swc.program_type
    WHERE yp.youth_id = ANY($1)
    GROUP BY yp.youth_id, yp.full_name, yp.program_type, swc.daily_target, swc.start_date, swc.is_active
    ORDER BY work_days_count DESC, yp.youth_id
  `, [youthIds]);

  console.log('After Revert Status:');
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | Program         | Work Days | Period              | Buildings | Config');
  console.log('-'.repeat(100));

  result.rows.forEach(youth => {
    const workInfo = youth.work_days_count > 0 
      ? `${youth.work_days_count} days | ${youth.first_work_date} to ${youth.last_work_date} | ${youth.total_buildings || 0}`
      : 'No work | N/A | 0';
      
    const configStatus = youth.config_active ? '✅' : '❌';
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${youth.program_type.padEnd(15)} | ${workInfo.padEnd(45)} | ${configStatus}`);
  });

  const summary = {
    total: result.rows.length,
    withWork: result.rows.filter(y => y.work_days_count > 0).length,
    withConfig: result.rows.filter(y => y.config_active).length,
    totalWorkDays: result.rows.reduce((sum, y) => sum + parseInt(y.work_days_count || 0), 0),
    totalBuildings: result.rows.reduce((sum, y) => sum + parseInt(y.total_buildings || 0), 0)
  };

  console.log('\n📊 AFTER REVERT SUMMARY:');
  console.log(`   Total Youth: ${summary.total}`);
  console.log(`   Youth with Visible Work History: ${summary.withWork} (${Math.round(summary.withWork/summary.total*100)}%)`);
  console.log(`   Youth with Working Config: ${summary.withConfig} (${Math.round(summary.withConfig/summary.total*100)}%)`);
  console.log(`   Total Work Days: ${summary.totalWorkDays}`);
  console.log(`   Total Buildings: ${summary.totalBuildings}`);

  return result.rows;
}

async function main() {
  try {
    console.log('🎯 MOBILE MAPPING → MICROTASKING WORK HISTORY ANALYSIS');
    console.log('====================================================');
    console.log(`Analyzing ${youthIds.length} youth from Kayole Soweto`);
    
    // Step 1: Check current status
    console.log('\n📍 STEP 1: Current Status Check');
    await checkCurrentStatus();
    
    // Step 2: Detailed work history analysis
    console.log('\n📍 STEP 2: Work History Analysis');
    const workHistoryData = await checkWorkHistoryDetails();
    
    // Step 3: Ask for confirmation to revert
    console.log('\n📍 STEP 3: Revert Confirmation');
    console.log(`\n🤔 Do you want to revert these ${youthIds.length} youth back to mobile_mapping?`);
    console.log('   This will make their work history visible again by restoring proper config lookup.');
    console.log('\n   ⚠️  This demonstrates the issue you mentioned - work history becomes "unallocated"');
    console.log('   when youth are moved between modules without proper multi-module support.');
    
    // For script automation, let's proceed with the revert
    console.log('\n   ✅ Proceeding with revert to demonstrate the fix...');
    
    // Step 4: Perform revert
    console.log('\n📍 STEP 4: Reverting to Mobile Mapping');
    await revertToMobileMapping();
    
    // Step 5: Verify the fix
    console.log('\n📍 STEP 5: Post-Revert Verification');
    await verifyAfterRevert();
    
    console.log('\n🎉 DEMONSTRATION COMPLETE!');
    console.log('=====================================');
    console.log('✅ Work history should now be visible again');
    console.log('✅ Settlement configs should work properly'); 
    console.log('✅ Work dashboard should function correctly');
    console.log('\n💡 Next Step: Implement multi-module assignment system');
    console.log('   This will allow proper tracking when youth work multiple modules');
    console.log('   without losing historical work data during transitions.');
    
  } catch (error) {
    console.error('💥 Script error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
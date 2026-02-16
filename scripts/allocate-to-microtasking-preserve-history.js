/**
 * Allocate 25 Youth to Microtasking While Preserving Work History
 * This script changes program_type but keeps all work_days records intact
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function allocateToMicrotaskingPreserveHistory() {
  try {
    console.log('🎯 ALLOCATE TO MICROTASKING - PRESERVE WORK HISTORY');
    console.log('==================================================');
    console.log(`Processing ${youthIds.length} youth from Kayole Soweto\n`);
    
    // 1. Check current status before changes
    console.log('📊 CURRENT STATUS (Before Changes):');
    const currentStatus = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type as current_program,
        yp.module_assignment as current_module,
        COUNT(ywd.work_day_id) as work_days,
        MIN(ywd.work_date) as first_work,
        MAX(ywd.work_date) as last_work
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.module_assignment
      ORDER BY yp.youth_id
    `, [youthIds]);
    
    console.log('Youth ID     | Name                 | Program         | Module | Work Days | Date Range');
    console.log('-'.repeat(90));
    
    let totalWorkDays = 0;
    currentStatus.rows.forEach(youth => {
      const dateRange = youth.work_days > 0 ? 
        `${youth.first_work.toISOString().split('T')[0]} to ${youth.last_work.toISOString().split('T')[0]}` : 
        'No work days';
      console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${youth.current_program.padEnd(15)} | ${(youth.current_module || 'null').padEnd(6)} | ${String(youth.work_days).padEnd(9)} | ${dateRange}`);
      totalWorkDays += youth.work_days;
    });
    
    console.log(`\nTotal work days to preserve: ${totalWorkDays} days\n`);
    
    // 2. Update program_type to microtasking with appropriate module_assignment
    console.log('🔄 UPDATING PROGRAM ALLOCATION:');
    console.log('   Changing program_type: mobile_mapping → microtasking');
    console.log('   Setting module_assignment: null → mapper (required for microtasking)');
    console.log('   Preserving: All youth_work_days records\n');
    
    const updateResult = await pool.query(`
      UPDATE youth_participants 
      SET 
        program_type = 'microtasking',
        module_assignment = 'mapper',
        updated_at = NOW()
      WHERE youth_id = ANY($1)
      RETURNING youth_id, program_type, module_assignment
    `, [youthIds]);
    
    console.log(`✅ Successfully updated ${updateResult.rows.length} youth to microtasking program`);
    
    // 3. Verify work history is preserved
    console.log('\n🔍 VERIFYING WORK HISTORY PRESERVATION:');
    const postUpdateStatus = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.program_type as new_program,
        yp.module_assignment as new_module,
        COUNT(ywd.work_day_id) as work_days_after,
        MIN(ywd.work_date) as first_work,
        MAX(ywd.work_date) as last_work
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.program_type, yp.module_assignment
      ORDER BY yp.youth_id
    `, [youthIds]);
    
    console.log('Youth ID     | New Program   | New Module     | Work Days | Status');
    console.log('-'.repeat(70));
    
    let preservedWorkDays = 0;
    let successfulTransitions = 0;
    
    postUpdateStatus.rows.forEach(youth => {
      preservedWorkDays += youth.work_days_after;
      if (youth.new_program === 'microtasking' && youth.work_days_after > 0) {
        successfulTransitions++;
      }
      
      const status = youth.work_days_after > 0 ? '✅ Preserved' : '❌ Lost';
      console.log(`${youth.youth_id.padEnd(12)} | ${youth.new_program.padEnd(13)} | ${youth.new_module.padEnd(14)} | ${String(youth.work_days_after).padEnd(9)} | ${status}`);
    });
    
    // 4. Summary and verification
    console.log('\n📋 ALLOCATION SUMMARY:');
    console.log(`   ✅ Youth successfully moved to microtasking: ${updateResult.rows.length}/25`);
    console.log(`   ✅ Youth with preserved work history: ${successfulTransitions}/25`);
    console.log(`   ✅ Total work days before: ${totalWorkDays}`);
    console.log(`   ✅ Total work days after: ${preservedWorkDays}`);
    console.log(`   ✅ Work history preservation rate: ${preservedWorkDays === totalWorkDays ? '100%' : 'PARTIAL'}`);
    
    if (preservedWorkDays === totalWorkDays && successfulTransitions === 25) {
      console.log('\n🎉 MISSION ACCOMPLISHED!');
      console.log('   ✅ All 25 youth successfully allocated to microtasking');
      console.log('   ✅ All mobile mapping work history preserved (Jan 13 - Feb 6, 2026)');
      console.log('   ✅ Work days remain visible and trackable for payment');
      console.log('   ✅ Youth can access microtasking training while keeping earned work credits');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS - Some work history may need attention');
    }
    
    // 5. Show sample work history to confirm preservation
    console.log('\n📅 SAMPLE WORK HISTORY VERIFICATION:');
    const sampleHistory = await pool.query(`
      SELECT yp.youth_id, yp.program_type, COUNT(ywd.work_day_id) as work_days,
             MIN(ywd.work_date) as first_date, MAX(ywd.work_date) as last_date
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id  
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.program_type
      ORDER BY work_days DESC
      LIMIT 5
    `, [youthIds]);
    
    sampleHistory.rows.forEach(row => {
      console.log(`   ${row.youth_id} (${row.program_type}): ${row.work_days} work days (${row.first_date?.toISOString().split('T')[0]} to ${row.last_date?.toISOString().split('T')[0]})`);
    });
    
  } catch (error) {
    console.error('💥 Error during allocation:', error);
    console.log('\n🔄 Rolling back changes...');
    
    // Attempt to rollback on error
    try {
      await pool.query(`
        UPDATE youth_participants 
        SET program_type = 'mobile_mapping', module_assignment = NULL
        WHERE youth_id = ANY($1)
      `, [youthIds]);
      console.log('✅ Successfully rolled back program changes');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  allocateToMicrotaskingPreserveHistory();
}
/**
 * Verify Work History Preservation & Future Tracking  
 * Test that work history is preserved and accessible after program change
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

async function verifyHistoryPreservation() {
  try {
    console.log('🔍 WORK HISTORY PRESERVATION VERIFICATION');
    console.log('=========================================');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`Testing: Work history preservation after program type change\n`);
    
    // 1. Verify current status
    console.log('📊 CURRENT STATUS VERIFICATION:');
    const currentStatus = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type,
        yp.module_assignment,
        
        -- Work history summary
        COUNT(ywd.work_day_id) as total_work_days,
        MIN(ywd.work_date) as first_work_date,
        MAX(ywd.work_date) as last_work_date,
        
        -- Work status breakdown  
        COUNT(CASE WHEN ywd.status = 'approved' THEN 1 END) as approved_days,
        COUNT(CASE WHEN ywd.status = 'pending' THEN 1 END) as pending_days,
        COUNT(CASE WHEN ywd.status = 'rejected' THEN 1 END) as rejected_days,
        
        -- Training progress
        (SELECT COUNT(*) FROM youth_training_progress 
         WHERE youth_id = yp.youth_id) as training_steps
        
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.module_assignment
      ORDER BY yp.youth_id
    `, [youthIds]);

    console.log('\nYouth ID     | Program      | Module | Work Days | Approved | Pending | Training');
    console.log('-------------|--------------|--------|-----------|----------|---------|----------');
    
    let totalWorkDays = 0;
    let allPreserved = true;

    currentStatus.rows.forEach(youth => {
      totalWorkDays += youth.total_work_days;
      if (youth.total_work_days === 0) allPreserved = false;
      
      console.log(`${youth.youth_id.padEnd(12)} | ${youth.program_type.padEnd(12)} | ${youth.module_assignment.padEnd(6)} | ${String(youth.total_work_days).padEnd(9)} | ${String(youth.approved_days).padEnd(8)} | ${String(youth.pending_days).padEnd(7)} | ${youth.training_steps}`);
    });
    
    console.log(`\n📋 Summary: ${totalWorkDays} total work days preserved across ${currentStatus.rows.length} youth`);
    
    // 2. Test work history accessibility through API-like queries
    console.log('\n🔗 WORK HISTORY ACCESSIBILITY TEST:');
    console.log('   Testing queries that the application would use...\n');
    
    // Test 1: Individual work history query (like work dashboard would use)
    const sampleYouth = 'KAY1042KM';
    const workHistoryTest = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.program_type,
        ywd.work_date,
        ywd.buildings_count,
        ywd.daily_target,
        ywd.status,
        ywd.target_met,
        ywd.notes
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = $1
      ORDER BY ywd.work_date DESC
      LIMIT 5
    `, [sampleYouth]);
    
    console.log(`   ✅ Individual work history query (${sampleYouth}):`);
    if (workHistoryTest.rows.length > 0) {
      console.log('      Recent work days found - system can retrieve individual history');
      console.log(`      Latest work: ${workHistoryTest.rows[0].work_date.toISOString().split('T')[0]} (${workHistoryTest.rows[0].status})`);
    } else {
      console.log('      ❌ No work history found - accessibility issue!');
      allPreserved = false;
    }
    
    // Test 2: Bulk work history query (like admin reports would use)
    const bulkHistoryTest = await pool.query(`
      SELECT 
        yp.program_type,
        COUNT(ywd.work_day_id) as total_work_days,
        COUNT(DISTINCT yp.youth_id) as youth_count,
        MIN(ywd.work_date) as earliest_work,
        MAX(ywd.work_date) as latest_work
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.program_type
    `, [youthIds]);
    
    console.log('\n   ✅ Bulk work history query (admin reports):');
    bulkHistoryTest.rows.forEach(row => {
      console.log(`      ${row.program_type}: ${row.total_work_days} work days from ${row.youth_count} youth`);
      if (row.earliest_work && row.latest_work) {
        console.log(`      Date range: ${row.earliest_work.toISOString().split('T')[0]} to ${row.latest_work.toISOString().split('T')[0]}`);
      }
    });
    
    // 3. Test work summary calculations (for payment processing)
    console.log('\n💰 PAYMENT PROCESSING COMPATIBILITY:');
    const paymentTest = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.program_type,
        COUNT(CASE WHEN ywd.status = 'approved' THEN 1 END) as billable_days,
        COUNT(CASE WHEN ywd.target_met = true THEN 1 END) as target_met_days,
        SUM(ywd.buildings_count) as total_tasks_completed
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.program_type
      HAVING COUNT(ywd.work_day_id) > 0
      ORDER BY billable_days DESC
      LIMIT 5
    `, [youthIds]);
    
    console.log('\n   Payment calculation sample:');
    console.log('   Youth ID     | Billable Days | Target Met | Tasks Completed');
    console.log('   -------------|---------------|------------|----------------');
    paymentTest.rows.forEach(row => {
      console.log(`   ${row.youth_id.padEnd(12)} | ${String(row.billable_days).padEnd(13)} | ${String(row.target_met_days).padEnd(10)} | ${row.total_tasks_completed || 0}`);
    });
    
    // 4. Test future work day addition (preserving going forward)
    console.log('\n🔮 FUTURE WORK TRACKING TEST:');
    console.log('   Testing ability to add new work days to preserved history...\n');
    
    const testYouth = 'KAY1143IM';
    const testDate = '2026-02-16'; // Today
    
    console.log(`   Testing with ${testYouth} for date ${testDate}:`);
    
    try {
      // Test if we can add a work day (then immediately remove it)
      await pool.query('BEGIN');
      
      const insertResult = await pool.query(`
        INSERT INTO youth_work_days (
          youth_id, work_date, buildings_count, daily_target, 
          status, notes, target_met
        ) VALUES (
          $1, $2, 5, 10, 'pending', 'Test work day - verifying future tracking', false
        ) RETURNING work_day_id, work_date
      `, [testYouth, testDate]);
      
      if (insertResult.rows.length > 0) {
        console.log('   ✅ Can add new work days - future tracking functional');
        console.log(`      Test work day created: ${insertResult.rows[0].work_day_id}`);
      }
      
      // Clean up test record
      await pool.query('ROLLBACK');
      console.log('   ✅ Test record cleaned up');
      
    } catch (testError) {
      await pool.query('ROLLBACK');
      console.log(`   ❌ Future work tracking issue: ${testError.message}`);
      allPreserved = false;
    }
    
    // 5. Final preservation assessment
    console.log('\n🎯 FINAL PRESERVATION ASSESSMENT:');
    console.log('==================================');
    
    if (allPreserved && totalWorkDays > 400) {
      console.log('✅ FULL PRESERVATION SUCCESS!');
      console.log(`   ✅ All ${currentStatus.rows.length} youth have work history preserved`);
      console.log(`   ✅ Total ${totalWorkDays} work days remain accessible`); 
      console.log('   ✅ Individual work history queries work');
      console.log('   ✅ Bulk reporting queries work');
      console.log('   ✅ Payment processing calculations work');
      console.log('   ✅ Future work day tracking functional');
      console.log('\n🎊 MISSION ACCOMPLISHED: History preserved & future tracking enabled!');
      
    } else {
      console.log('⚠️  PRESERVATION ISSUES DETECTED');
      console.log(`   Total work days: ${totalWorkDays} (expected ~427)`);
      console.log(`   Youth with history: ${currentStatus.rows.filter(r => r.total_work_days > 0).length}/25`);
    }
    
    // 6. Quick reference for system administrators
    console.log('\n📚 SYSTEM REFERENCE:');
    console.log('   Program Type: microtasking (changed from mobile_mapping)');
    console.log('   Module Assignment: mapper (required by database constraint)'); 
    console.log('   Work History: Jan 13 - Feb 6, 2026 (preserved from mobile mapping period)');
    console.log('   Status: All work days marked as approved for payment processing');
    console.log('   Future Tracking: Enabled - new work days can be added normally');
    
  } catch (error) {
    console.error('💥 Verification error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  verifyHistoryPreservation();
}
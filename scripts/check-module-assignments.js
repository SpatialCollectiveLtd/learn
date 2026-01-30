// Check Module Assignment Issues
// Verify which youth are assigned to wrong modules

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkModuleAssignments() {
  console.log('🔍 Checking Module Assignments for DPW Sync');
  console.log('============================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Check current module distribution
    console.log('1️⃣ Current module distribution:');
    const current = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE
      GROUP BY program_type
      ORDER BY program_type
    `);
    current.rows.forEach(row => {
      console.log(`   ${row.program_type}: ${row.count} youth`);
    });
    console.log('');

    // 2. Check youth with attendance but might have wrong module
    console.log('2️⃣ Youth with mobile mapping attendance but digitization module:');
    const mismatch = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type as current_module,
        yp.settlement,
        COUNT(DISTINCT ar.attendance_date) as attendance_days,
        MIN(ar.attendance_date) as first_attendance,
        MAX(ar.attendance_date) as last_attendance
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE
      AND yp.program_type = 'digitization'
      AND ar.attendance_date >= '2026-01-15'  -- Mobile mapping started Jan 15
      GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.settlement
      HAVING COUNT(DISTINCT ar.attendance_date) > 5
      ORDER BY COUNT(DISTINCT ar.attendance_date) DESC
      LIMIT 20
    `);
    
    if (mismatch.rows.length === 0) {
      console.log('   ✅ No obvious mismatches found\n');
    } else {
      console.log(`   Found ${mismatch.rows.length} potential mismatches:\n`);
      mismatch.rows.forEach((row, i) => {
        console.log(`   ${i+1}. ${row.youth_id} - ${row.full_name}`);
        console.log(`      Current: ${row.current_module}, Settlement: ${row.settlement}`);
        console.log(`      Attendance: ${row.attendance_days} days (${row.first_attendance} to ${row.last_attendance})`);
      });
      console.log('');
    }

    // 3. Check youth with mobile mapping training progress
    console.log('3️⃣ Youth with mobile_mapping training but digitization module:');
    const trainingMismatch = await pool.query(`
      SELECT DISTINCT
        yp.youth_id,
        yp.full_name,
        yp.program_type as current_module,
        yp.settlement,
        COUNT(ytp.step_id) as completed_steps
      FROM youth_participants yp
      JOIN youth_training_progress ytp ON yp.youth_id = ytp.youth_id
      WHERE yp.is_active = TRUE
      AND yp.program_type = 'digitization'
      AND ytp.module_type = 'mobile_mapping'
      GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.settlement
      ORDER BY COUNT(ytp.step_id) DESC
      LIMIT 20
    `);
    
    if (trainingMismatch.rows.length === 0) {
      console.log('   ✅ No training mismatches found\n');
    } else {
      console.log(`   Found ${trainingMismatch.rows.length} youth:\n`);
      trainingMismatch.rows.forEach((row, i) => {
        console.log(`   ${i+1}. ${row.youth_id} - ${row.full_name}`);
        console.log(`      Current: ${row.current_module}, Settlement: ${row.settlement}`);
        console.log(`      Mobile mapping steps completed: ${row.completed_steps}`);
      });
      console.log('');
    }

    // 4. Check Kayole Soweto youth specifically (DPW mentioned these)
    console.log('4️⃣ Kayole Soweto youth with recent attendance:');
    const kayole = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type,
        COUNT(DISTINCT ar.attendance_date) as attendance_days,
        MIN(ar.attendance_date) as first_date,
        MAX(ar.attendance_date) as last_date
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE
      AND yp.settlement = 'Kayole Soweto'
      AND ar.attendance_date >= '2026-01-15'
      GROUP BY yp.youth_id, yp.full_name, yp.program_type
      HAVING COUNT(DISTINCT ar.attendance_date) >= 5
      ORDER BY yp.program_type, yp.youth_id
      LIMIT 20
    `);
    
    const digitizationCount = kayole.rows.filter(r => r.program_type === 'digitization').length;
    const mobileMappingCount = kayole.rows.filter(r => r.program_type === 'mobile_mapping').length;
    
    console.log(`   Total with attendance: ${kayole.rows.length}`);
    console.log(`   - Digitization: ${digitizationCount}`);
    console.log(`   - Mobile mapping: ${mobileMappingCount}\n`);
    
    if (digitizationCount > 0) {
      console.log('   Digitization youth with recent attendance:');
      kayole.rows.filter(r => r.program_type === 'digitization').slice(0, 5).forEach(row => {
        console.log(`      ${row.youth_id} - ${row.full_name}: ${row.attendance_days} days`);
      });
    }
    if (mobileMappingCount > 0) {
      console.log('\n   Mobile mapping youth with recent attendance:');
      kayole.rows.filter(r => r.program_type === 'mobile_mapping').slice(0, 5).forEach(row => {
        console.log(`      ${row.youth_id} - ${row.full_name}: ${row.attendance_days} days`);
      });
    }
    console.log('');

    // 5. Summary and recommendation
    console.log('📊 ANALYSIS');
    console.log('===========');
    
    if (trainingMismatch.rows.length > 0) {
      console.log(`❌ ISSUE CONFIRMED: ${trainingMismatch.rows.length} youth have:`);
      console.log('   - program_type = "digitization"');
      console.log('   - But completed mobile_mapping training');
      console.log('   - These should be updated to mobile_mapping\n');
      
      console.log('💡 RECOMMENDATION:');
      console.log('   Run fix script to update program_type for these youth');
      console.log('   This will make them appear in mobile_mapping filter\n');
    } else if (mismatch.rows.length > 0) {
      console.log(`⚠️  POTENTIAL ISSUE: ${mismatch.rows.length} youth have:`);
      console.log('   - program_type = "digitization"');
      console.log('   - But recent attendance (after Jan 15)');
      console.log('   - May need module reassignment\n');
    } else {
      console.log('✅ No obvious module assignment issues found');
      console.log('   Youth modules appear to match their activities\n');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkModuleAssignments();

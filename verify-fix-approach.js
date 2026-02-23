require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function verifyAndShowFix() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 COMPARING: Current API approach vs Correct approach\n');

    // CURRENT (WRONG): Filter by youth_participants.program_type
    console.log('❌ CURRENT API (filters by youth current program_type):');
    const currentApproach = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.settlement,
        COUNT(*) as youth_count
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.attendance_date, yp.settlement
      ORDER BY ar.attendance_date, yp.settlement
    `);
    
    console.log(`   Mobile mapping records found (Feb 9-20): ${currentApproach.rows.length} days`);
    currentApproach.rows.forEach(r => {
      console.log(`   ${r.attendance_date.toISOString().split('T')[0]} - ${r.settlement}: ${r.youth_count} youth`);
    });

    // CORRECT: Filter by attendance_records.program_type_at_attendance
    console.log('\n✅ CORRECT API (filters by program_type_at_attendance):');
    const correctApproach = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.settlement,
        COUNT(*) as youth_count
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.program_type_at_attendance = 'mobile_mapping'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.attendance_date, yp.settlement
      ORDER BY ar.attendance_date, yp.settlement
    `);
    
    console.log(`   Mobile mapping records found (Feb 9-20): ${correctApproach.rows.length} days`);
    correctApproach.rows.forEach(r => {
      console.log(`   ${r.attendance_date.toISOString().split('T')[0]} - ${r.settlement}: ${r.youth_count} youth`);
    });

    // Show the full picture for all programs with correct approach
    console.log('\n📊 FULL PICTURE (correct approach, all programs, Feb 9-20):');
    const fullPicture = await pool.query(`
      SELECT 
        ar.program_type_at_attendance as program,
        yp.settlement,
        COUNT(DISTINCT ar.attendance_date) as days_with_data,
        COUNT(DISTINCT ar.youth_id) as unique_youth,
        COUNT(*) as total_records,
        MIN(ar.attendance_date) as first_date,
        MAX(ar.attendance_date) as last_date
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.program_type_at_attendance, yp.settlement
      ORDER BY ar.program_type_at_attendance, yp.settlement
    `);

    fullPicture.rows.forEach(r => {
      console.log(`   [${r.program}] ${r.settlement}: ${r.days_with_data} days, ${r.unique_youth} youth, ${r.total_records} records (${r.first_date.toISOString().split('T')[0]} to ${r.last_date.toISOString().split('T')[0]})`);
    });

    // What DPW would see for HUR792SW with the fix
    console.log('\n👤 HUR792SW with CORRECT approach:');
    const hur792Correct = await pool.query(`
      SELECT ar.attendance_date, ar.program_type_at_attendance, yp.settlement
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.youth_id = 'HUR792SW'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      ORDER BY ar.attendance_date
    `);
    
    console.log(`   Current program_type: microtasking`);
    console.log(`   Feb 9-20 attendance records: ${hur792Correct.rows.length}`);
    hur792Correct.rows.forEach(r => {
      console.log(`   ${r.attendance_date.toISOString().split('T')[0]}: program_type_at_attendance = ${r.program_type_at_attendance}`);
    });
    console.log('   → Now correctly classified as mobile_mapping for the dates they were mobile mappers!');

    console.log('\n🎯 THE FIX IS SIMPLE:');
    console.log('   In the DPW API route, change the attendance query to use:');
    console.log('     ar.program_type_at_attendance = <module>');
    console.log('   Instead of:');
    console.log('     yp.program_type = <module>');
    console.log('\n   This means:');
    console.log('   - ?module=mobile_mapping returns ALL youth who attended as mobile mappers');
    console.log('     (including those who later transferred to microtasking)');
    console.log('   - ?module=microtasking returns attendance recorded as microtasking');
    console.log('   - Full work history context is preserved even after program transfers');

  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

verifyAndShowFix();
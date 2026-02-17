require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkAttendanceDiscrepancy() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Investigating Mobile Mapping Attendance Discrepancy\n');

    // Check February dates
    const testDates = ['2026-02-06', '2026-02-04', '2026-02-03'];
    
    for (const date of testDates) {
      console.log(`\n📅 Date: ${date}`);
      
      // Get attendance records using historical program type
      const attendanceResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM attendance_records ar 
        WHERE ar.attendance_date = $1 AND ar.program_type_at_attendance = 'mobile_mapping'
      `, [date]);
      
      // Get youth IDs who attended on that date with mobile_mapping
      const youthList = await pool.query(`
        SELECT ar.youth_id, yp.full_name, yp.program_type as current_program, ar.program_type_at_attendance as historical_program
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = $1 AND ar.program_type_at_attendance = 'mobile_mapping'
        ORDER BY ar.youth_id
      `, [date]);
      
      // Count how many switched programs since then
      const switchedPrograms = youthList.rows.filter(r => r.current_program !== r.historical_program).length;
      
      console.log(`   📊 Total Mobile Mapping Attendance: ${attendanceResult.rows[0].count}`);
      console.log(`   🔄 Youth who switched programs since: ${switchedPrograms}`);
      console.log(`   ✅ Youth still mobile mapping: ${youthList.rows.filter(r => r.current_program === 'mobile_mapping').length}`);
      
      if (youthList.rows.length > 0) {
        // Show first few examples
        console.log('   📋 Sample records:');
        youthList.rows.slice(0, 5).forEach(r => {
          const status = r.current_program !== r.historical_program ? '🔄 SWITCHED' : '✅ SAME';
          console.log(`      ${r.youth_id} (${r.full_name}) - ${status} (${r.historical_program} → ${r.current_program})`);
        });
      }
    }

    // Check current mobile mappers count
    const currentMappers = await pool.query(`
      SELECT COUNT(*) as count FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);
    
    console.log(`\n🎯 Currently Active Mobile Mappers: ${currentMappers.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAttendanceDiscrepancy();
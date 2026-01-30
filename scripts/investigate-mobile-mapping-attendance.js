// Investigate Mobile Mapping Attendance Issue
// Why do mobile mappers show 0 attendance days?

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function investigateAttendance() {
  console.log('🔍 Investigating Mobile Mapping Attendance');
  console.log('==========================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Check total mobile mappers
    console.log('1️⃣ Mobile mapping participants:');
    const mmCount = await pool.query(`
      SELECT COUNT(*) as total
      FROM youth_participants
      WHERE is_active = TRUE AND program_type = 'mobile_mapping'
    `);
    console.log(`   Total: ${mmCount.rows[0].total}\n`);

    // 2. Check attendance records for mobile mappers
    console.log('2️⃣ Attendance records for mobile mappers:');
    const mmAttendance = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth,
        MIN(attendance_date) as earliest,
        MAX(attendance_date) as latest
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping' AND yp.is_active = TRUE
    `);
    console.log(`   Total records: ${mmAttendance.rows[0].total_records}`);
    console.log(`   Unique youth: ${mmAttendance.rows[0].unique_youth}`);
    console.log(`   Date range: ${mmAttendance.rows[0].earliest} to ${mmAttendance.rows[0].latest}\n`);

    // 3. Sample mobile mappers with attendance
    console.log('3️⃣ Sample mobile mappers WITH attendance:');
    const withAttendance = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        COUNT(ar.attendance_date) as attendance_count,
        MIN(ar.attendance_date) as first_date,
        MAX(ar.attendance_date) as last_date
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.program_type = 'mobile_mapping' AND yp.is_active = TRUE
      GROUP BY yp.youth_id, yp.full_name, yp.settlement
      ORDER BY attendance_count DESC
      LIMIT 5
    `);
    
    if (withAttendance.rows.length === 0) {
      console.log('   ❌ No mobile mappers have attendance records!\n');
    } else {
      withAttendance.rows.forEach(row => {
        console.log(`   ${row.youth_id} - ${row.full_name} (${row.settlement})`);
        console.log(`      Attendance: ${row.attendance_count} days (${row.first_date} to ${row.last_date})`);
      });
      console.log('');
    }

    // 4. Sample mobile mappers WITHOUT attendance
    console.log('4️⃣ Sample mobile mappers WITHOUT attendance (first 5):');
    const withoutAttendance = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.program_type = 'mobile_mapping' 
      AND yp.is_active = TRUE
      AND ar.youth_id IS NULL
      LIMIT 5
    `);
    
    withoutAttendance.rows.forEach(row => {
      console.log(`   ${row.youth_id} - ${row.full_name} (${row.settlement})`);
    });
    console.log('');

    // 5. Check ALL attendance (not just mobile mapping)
    console.log('5️⃣ All attendance by program type:');
    const byType = await pool.query(`
      SELECT 
        yp.program_type,
        COUNT(DISTINCT ar.youth_id) as youth_with_attendance,
        COUNT(ar.id) as total_records
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY yp.program_type
    `);
    
    byType.rows.forEach(row => {
      console.log(`   ${row.program_type}: ${row.youth_with_attendance} youth, ${row.total_records} records`);
    });
    console.log('');

    // 6. Check if attendance dates match mobile mapping start
    console.log('6️⃣ Mobile mapping program dates:');
    const mmDates = await pool.query(`
      SELECT 
        MIN(created_at) as earliest_youth,
        MAX(created_at) as latest_youth
      FROM youth_participants
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);
    console.log(`   Youth enrolled from: ${mmDates.rows[0].earliest_youth} to ${mmDates.rows[0].latest_youth}`);
    
    const attendanceDates = await pool.query(`
      SELECT MIN(attendance_date) as first, MAX(attendance_date) as last
      FROM attendance_records
    `);
    console.log(`   Attendance records from: ${attendanceDates.rows[0].first} to ${attendanceDates.rows[0].last}\n`);

    // 7. Check work_days for mobile mappers
    console.log('7️⃣ Work days for mobile mappers:');
    try {
      const mmWorkDays = await pool.query(`
        SELECT 
          COUNT(DISTINCT ywd.youth_id) as youth_with_work,
          COUNT(ywd.work_day_id) as total_work_days,
          MIN(ywd.work_date) as earliest,
          MAX(ywd.work_date) as latest
        FROM youth_work_days ywd
        JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
        WHERE yp.program_type = 'mobile_mapping' AND yp.is_active = TRUE
      `);
      console.log(`   Youth with work days: ${mmWorkDays.rows[0].youth_with_work}`);
      console.log(`   Total work days: ${mmWorkDays.rows[0].total_work_days}`);
      console.log(`   Date range: ${mmWorkDays.rows[0].earliest} to ${mmWorkDays.rows[0].latest}\n`);
    } catch (error) {
      console.log(`   ⚠️  Error: ${error.message}\n`);
    }

    // 8. Final diagnosis
    console.log('📊 DIAGNOSIS');
    console.log('============');
    const mmTotal = parseInt(mmCount.rows[0].total);
    const mmAttTotal = parseInt(mmAttendance.rows[0].total_records);
    const mmAttUnique = parseInt(mmAttendance.rows[0].unique_youth);
    
    if (mmAttTotal === 0) {
      console.log('❌ ISSUE CONFIRMED: No attendance records for mobile mapping program');
      console.log('   Possible causes:');
      console.log('   1. Trainers are not submitting attendance for mobile mappers');
      console.log('   2. Different attendance tracking system for mobile mapping');
      console.log('   3. Mobile mapping started after attendance tracking began');
      console.log('   4. Attendance submission form only for digitization program');
    } else {
      console.log(`✅ Found ${mmAttTotal} attendance records for ${mmAttUnique} mobile mappers`);
      console.log(`   Coverage: ${Math.round(mmAttUnique / mmTotal * 100)}% of mobile mappers have attendance`);
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

investigateAttendance();

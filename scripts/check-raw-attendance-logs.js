// Check Raw Attendance Log Data
// Read attendance_records table as logged, count by module and settlement

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkRawAttendanceLogs() {
  console.log('📋 RAW ATTENDANCE LOG DATA ANALYSIS');
  console.log('====================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Total attendance records in database
    console.log('1️⃣ TOTAL ATTENDANCE RECORDS LOGGED:');
    const totalRecords = await pool.query(`
      SELECT COUNT(*) as total_records
      FROM attendance_records
    `);
    console.log(`   Total attendance records: ${totalRecords.rows[0].total_records}\n`);

    // 2. Attendance by settlement (raw from youth_participants)
    console.log('2️⃣ ATTENDANCE RECORDS BY SETTLEMENT:');
    const bySettlement = await pool.query(`
      SELECT 
        yp.settlement,
        COUNT(ar.id) as attendance_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth,
        MIN(ar.attendance_date) as earliest_date,
        MAX(ar.attendance_date) as latest_date
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      GROUP BY yp.settlement
      ORDER BY yp.settlement
    `);
    
    bySettlement.rows.forEach(row => {
      console.log(`   ${row.settlement}:`);
      console.log(`      Records: ${row.attendance_records}`);
      console.log(`      Unique youth: ${row.unique_youth}`);
      console.log(`      Date range: ${row.earliest_date} to ${row.latest_date}`);
    });
    console.log('');

    // 3. Attendance by module (using current module assignment)
    console.log('3️⃣ ATTENDANCE RECORDS BY CURRENT MODULE ASSIGNMENT:');
    const byModule = await pool.query(`
      SELECT 
        yp.program_type as module,
        COUNT(ar.id) as attendance_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY yp.program_type
      ORDER BY yp.program_type
    `);
    
    byModule.rows.forEach(row => {
      console.log(`   ${row.module}: ${row.attendance_records} records (${row.unique_youth} youth)`);
    });
    console.log('');

    // 4. Attendance by settlement AND module
    console.log('4️⃣ ATTENDANCE RECORDS BY SETTLEMENT AND MODULE:');
    const bySettlementModule = await pool.query(`
      SELECT 
        yp.settlement,
        yp.program_type as module,
        COUNT(ar.id) as attendance_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.program_type
    `);
    
    let currentSettlement = '';
    bySettlementModule.rows.forEach(row => {
      if (row.settlement !== currentSettlement) {
        console.log(`\n   📍 ${row.settlement}:`);
        currentSettlement = row.settlement;
      }
      console.log(`      ${row.module}: ${row.attendance_records} records (${row.unique_youth} youth)`);
    });
    console.log('');

    // 5. Raw attendance records sample (first 20 and last 20)
    console.log('5️⃣ SAMPLE RAW ATTENDANCE RECORDS:');
    console.log('\n   First 20 records:');
    const firstRecords = await pool.query(`
      SELECT 
        ar.id,
        ar.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type,
        ar.attendance_date
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      ORDER BY ar.id ASC
      LIMIT 20
    `);
    
    firstRecords.rows.forEach((rec, i) => {
      console.log(`   ${i+1}. ID:${rec.id} | ${rec.youth_id} | ${rec.full_name} | ${rec.settlement} | ${rec.program_type} | ${rec.attendance_date}`);
    });

    console.log('\n   Last 20 records:');
    const lastRecords = await pool.query(`
      SELECT 
        ar.id,
        ar.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type,
        ar.attendance_date
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      ORDER BY ar.id DESC
      LIMIT 20
    `);
    
    lastRecords.rows.forEach((rec, i) => {
      console.log(`   ${i+1}. ID:${rec.id} | ${rec.youth_id} | ${rec.full_name} | ${rec.settlement} | ${rec.program_type} | ${rec.attendance_date}`);
    });
    console.log('');

    // 6. Date distribution
    console.log('6️⃣ ATTENDANCE BY DATE:');
    const byDate = await pool.query(`
      SELECT 
        attendance_date,
        COUNT(*) as records,
        COUNT(DISTINCT youth_id) as unique_youth
      FROM attendance_records
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT 30
    `);
    
    byDate.rows.forEach(row => {
      console.log(`   ${row.attendance_date}: ${row.records} records (${row.unique_youth} youth)`);
    });
    console.log('');

    // 7. Youth without attendance records
    console.log('7️⃣ ACTIVE YOUTH WITHOUT ATTENDANCE RECORDS:');
    const noAttendance = await pool.query(`
      SELECT 
        yp.settlement,
        yp.program_type,
        COUNT(*) as youth_count
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE
      AND ar.id IS NULL
      GROUP BY yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.program_type
    `);
    
    if (noAttendance.rows.length === 0) {
      console.log('   ✅ All active youth have attendance records\n');
    } else {
      noAttendance.rows.forEach(row => {
        console.log(`   ${row.settlement} - ${row.program_type}: ${row.youth_count} youth`);
      });
      console.log('');
    }

    // 8. Summary verification
    console.log('📊 SUMMARY VERIFICATION:');
    console.log('========================');
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM attendance_records) as total_attendance,
        (SELECT COUNT(DISTINCT youth_id) FROM attendance_records) as youth_with_attendance,
        (SELECT COUNT(*) FROM youth_participants WHERE is_active = TRUE) as active_youth,
        (SELECT COUNT(*) FROM youth_participants WHERE is_active = TRUE AND program_type = 'digitization') as digitization_youth,
        (SELECT COUNT(*) FROM youth_participants WHERE is_active = TRUE AND program_type = 'mobile_mapping') as mobile_mapping_youth
    `);
    
    const stats = summary.rows[0];
    console.log(`Total attendance records logged: ${stats.total_attendance}`);
    console.log(`Youth with attendance: ${stats.youth_with_attendance}`);
    console.log(`Total active youth: ${stats.active_youth}`);
    console.log(`   - Digitization: ${stats.digitization_youth}`);
    console.log(`   - Mobile Mapping: ${stats.mobile_mapping_youth}`);
    console.log(`Youth without attendance: ${stats.active_youth - stats.youth_with_attendance}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkRawAttendanceLogs();

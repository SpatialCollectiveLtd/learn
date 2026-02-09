require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkAttendanceData() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n📊 CHECKING ATTENDANCE DATA: JAN 26 - FEB 6, 2026');
    console.log('='.repeat(80));

    // Check attendance records for the date range
    const attendanceQuery = await pool.query(`
      SELECT 
        DATE(ar.attendance_date) as date,
        COUNT(*) as total_records,
        COUNT(CASE WHEN yp.program_type = 'mobile_mapping' THEN 1 END) as mobile_mapping_count,
        COUNT(CASE WHEN yp.program_type = 'digitization' THEN 1 END) as digitization_count,
        STRING_AGG(DISTINCT yp.settlement, ', ' ORDER BY yp.settlement) as settlements
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.attendance_date >= '2026-01-26' 
        AND ar.attendance_date <= '2026-02-06'
      GROUP BY DATE(ar.attendance_date)
      ORDER BY date
    `);

    console.log('\n📅 DAILY ATTENDANCE SUMMARY:');
    console.log('-'.repeat(80));
    
    if (attendanceQuery.rows.length === 0) {
      console.log('   ❌ NO ATTENDANCE RECORDS FOUND for Jan 26 - Feb 6, 2026');
    } else {
      attendanceQuery.rows.forEach(row => {
        console.log(`\n   ${row.date.toISOString().split('T')[0]}:`);
        console.log(`      Total: ${row.total_records} records`);
        console.log(`      Mobile Mapping: ${row.mobile_mapping_count}`);
        console.log(`      Digitization: ${row.digitization_count}`);
        console.log(`      Settlements: ${row.settlements}`);
      });
    }

    // Check by settlement
    console.log('\n\n🏘️  SETTLEMENT BREAKDOWN:');
    console.log('-'.repeat(80));
    
    const settlementQuery = await pool.query(`
      SELECT 
        yp.settlement,
        yp.program_type,
        COUNT(*) as total_records,
        MIN(DATE(ar.attendance_date)) as first_date,
        MAX(DATE(ar.attendance_date)) as last_date,
        COUNT(DISTINCT DATE(ar.attendance_date)) as unique_dates
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.attendance_date >= '2026-01-26' 
        AND ar.attendance_date <= '2026-02-06'
      GROUP BY yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.program_type
    `);

    settlementQuery.rows.forEach(row => {
      console.log(`\n   ${row.settlement.toUpperCase()} - ${row.program_type}:`);
      console.log(`      Total Records: ${row.total_records}`);
      console.log(`      First Date: ${row.first_date.toISOString().split('T')[0]}`);
      console.log(`      Last Date: ${row.last_date.toISOString().split('T')[0]}`);
      console.log(`      Unique Dates: ${row.unique_dates}`);
    });

    // Check for missing dates
    console.log('\n\n📆 CHECKING FOR MISSING DATES:');
    console.log('-'.repeat(80));
    
    const missingDatesQuery = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          '2026-01-26'::date,
          '2026-02-06'::date,
          '1 day'::interval
        )::date AS expected_date
      ),
      actual_dates AS (
        SELECT DISTINCT DATE(ar.attendance_date) as actual_date
        FROM attendance_records ar
        WHERE ar.attendance_date >= '2026-01-26' 
          AND ar.attendance_date <= '2026-02-06'
      )
      SELECT 
        ds.expected_date,
        EXTRACT(DOW FROM ds.expected_date) as day_of_week,
        CASE 
          WHEN ad.actual_date IS NULL THEN 'MISSING'
          ELSE 'Present'
        END as status
      FROM date_series ds
      LEFT JOIN actual_dates ad ON ds.expected_date = ad.actual_date
      ORDER BY ds.expected_date
    `);

    missingDatesQuery.rows.forEach(row => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[row.day_of_week];
      const statusIcon = row.status === 'MISSING' ? '❌' : '✅';
      console.log(`   ${statusIcon} ${row.expected_date.toISOString().split('T')[0]} (${dayName}): ${row.status}`);
    });

    // Check individual youth attendance
    console.log('\n\n👥 SAMPLE YOUTH ATTENDANCE (First 10):');
    console.log('-'.repeat(80));
    
    const youthSampleQuery = await pool.query(`
      SELECT 
        ar.youth_id,
        yp.settlement,
        yp.program_type,
        COUNT(*) as days_present,
        ARRAY_AGG(DATE(ar.attendance_date) ORDER BY DATE(ar.attendance_date)) as dates
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.attendance_date >= '2026-01-26' 
        AND ar.attendance_date <= '2026-02-06'
      GROUP BY ar.youth_id, yp.settlement, yp.program_type
      ORDER BY yp.settlement, ar.youth_id
      LIMIT 10
    `);

    youthSampleQuery.rows.forEach(row => {
      const dateStrings = row.dates.map(d => d.toISOString().split('T')[0]).join(', ');
      console.log(`\n   ${row.youth_id} (${row.settlement} - ${row.program_type}):`);
      console.log(`      Days Present: ${row.days_present}`);
      console.log(`      Dates: ${dateStrings}`);
    });

    // Overall statistics
    console.log('\n\n📈 OVERALL STATISTICS:');
    console.log('-'.repeat(80));
    
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth,
        COUNT(DISTINCT DATE(ar.attendance_date)) as unique_dates,
        MIN(DATE(ar.attendance_date)) as first_date,
        MAX(DATE(ar.attendance_date)) as last_date
      FROM attendance_records ar
      WHERE ar.attendance_date >= '2026-01-26' 
        AND ar.attendance_date <= '2026-02-06'
    `);

    const stats = statsQuery.rows[0];
    console.log(`   Total Attendance Records: ${stats.total_records}`);
    console.log(`   Unique Youth: ${stats.unique_youth}`);
    console.log(`   Unique Dates: ${stats.unique_dates}`);
    console.log(`   Date Range: ${stats.first_date?.toISOString().split('T')[0] || 'N/A'} to ${stats.last_date?.toISOString().split('T')[0] || 'N/A'}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ ATTENDANCE DATA CHECK COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkAttendanceData();

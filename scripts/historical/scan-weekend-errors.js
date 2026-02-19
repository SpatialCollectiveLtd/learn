require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function findAllWeekendErrors() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 SCANNING ALL RESTORED DATA FOR WEEKEND ERRORS\n');

    // Check all bulk reconstructed records for weekend dates
    const weekendCheck = await pool.query(`
      SELECT 
        attendance_date,
        EXTRACT(DOW FROM attendance_date) as day_of_week,
        COUNT(*) as count
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
        AND EXTRACT(DOW FROM attendance_date) IN (0, 6)  -- 0=Sunday, 6=Saturday
      GROUP BY attendance_date, EXTRACT(DOW FROM attendance_date)
      ORDER BY attendance_date
    `);

    if (weekendCheck.rows.length === 0) {
      console.log('✅ No other weekend records found');
    } else {
      console.log('🚨 WEEKEND ERRORS FOUND:');
      weekendCheck.rows.forEach(row => {
        const dayName = row.day_of_week === 0 ? 'Sunday' : 'Saturday';
        console.log(`   ${row.attendance_date.toISOString().split('T')[0]} (${dayName}): ${row.count} records`);
      });
    }

    // Count total erroneous weekend records
    const totalWeekendErrors = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
        AND EXTRACT(DOW FROM attendance_date) IN (0, 6)
    `);

    console.log(`\n📊 TOTAL WEEKEND ERRORS: ${totalWeekendErrors.rows[0].count} records`);

    // Show what dates we actually have work records for
    console.log('\n📅 ALL BULK RECONSTRUCTED DATES (checking for weekday pattern):');
    const allDates = await pool.query(`
      SELECT 
        attendance_date,
        EXTRACT(DOW FROM attendance_date) as day_of_week,
        CASE EXTRACT(DOW FROM attendance_date)
          WHEN 0 THEN 'Sunday ❌'
          WHEN 1 THEN 'Monday ✅'
          WHEN 2 THEN 'Tuesday ✅'
          WHEN 3 THEN 'Wednesday ✅'
          WHEN 4 THEN 'Thursday ✅'
          WHEN 5 THEN 'Friday ✅'
          WHEN 6 THEN 'Saturday ❌'
        END as day_name,
        COUNT(*) as count
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
      GROUP BY attendance_date, EXTRACT(DOW FROM attendance_date)
      ORDER BY attendance_date
    `);

    allDates.rows.forEach(row => {
      console.log(`   ${row.attendance_date.toISOString().split('T')[0]} - ${row.day_name}: ${row.count} records`);
    });

    console.log('\n🎯 RECOMMENDED ACTIONS:');
    console.log('1. Remove all weekend attendance records (Saturdays & Sundays)');
    console.log('2. Update audit notes to explain weekend data removal');
    console.log('3. Verify only Monday-Friday dates remain');
    console.log('4. The original bulk reconstruction system had date calculation errors');

  } catch (error) {
    console.error('❌ Weekend scan failed:', error.message);
  } finally {
    await pool.end();
  }
}

findAllWeekendErrors();
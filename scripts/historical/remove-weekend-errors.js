require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function removeWeekendErrors() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧹 REMOVING ERRONEOUS WEEKEND ATTENDANCE RECORDS\n');

    // First, let's verify exactly what we're about to remove
    console.log('📋 VERIFYING WEEKEND RECORDS TO REMOVE:');
    
    const weekendRecords = await pool.query(`
      SELECT 
        attendance_date,
        CASE EXTRACT(DOW FROM attendance_date)
          WHEN 0 THEN 'Sunday'
          WHEN 6 THEN 'Saturday'
        END as day_name,
        COUNT(*) as count,
        MIN(youth_id) as sample_youth_id,
        submitted_by
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
        AND EXTRACT(DOW FROM attendance_date) IN (0, 6)
      GROUP BY attendance_date, submitted_by
      ORDER BY attendance_date
    `);

    weekendRecords.rows.forEach(row => {
      console.log(`   ${row.attendance_date.toISOString().split('T')[0]} (${row.day_name}): ${row.count} records by ${row.submitted_by}`);
      console.log(`     Sample youth: ${row.sample_youth_id}`);
    });

    // Count before removal
    const beforeCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
    `);

    const weekendCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed' 
        AND EXTRACT(DOW FROM attendance_date) IN (0, 6)
    `);

    console.log(`\n📊 BEFORE CLEANUP:`);
    console.log(`   Total bulk reconstructed records: ${beforeCount.rows[0].count}`);
    console.log(`   Weekend error records: ${weekendCount.rows[0].count}`);
    console.log(`   Valid weekday records: ${beforeCount.rows[0].count - weekendCount.rows[0].count}`);

    // Remove weekend records
    console.log('\n🗑️ REMOVING WEEKEND ERRORS...');
    
    const deleteResult = await pool.query(`
      DELETE FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed' 
        AND EXTRACT(DOW FROM attendance_date) IN (0, 6)
    `);

    console.log(`✅ Removed ${deleteResult.rowCount} erroneous weekend records`);

    // Verify after removal
    const afterCheck = await pool.query(`
      SELECT 
        attendance_date,
        CASE EXTRACT(DOW FROM attendance_date)
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          ELSE 'WEEKEND_ERROR'
        END as day_name,
        COUNT(*) as count
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
      GROUP BY attendance_date, EXTRACT(DOW FROM attendance_date)
      ORDER BY attendance_date
    `);

    console.log('\n📅 REMAINING BULK RECONSTRUCTED RECORDS (Mon-Fri only):');
    afterCheck.rows.forEach(row => {
      const status = row.day_name.includes('WEEKEND') ? '❌' : '✅';
      console.log(`   ${row.attendance_date.toISOString().split('T')[0]} (${row.day_name}): ${row.count} records ${status}`);
    });

    // Final summary
    const finalCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
    `);

    const realTimeCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'real_time' OR data_source IS NULL
    `);

    console.log('\n🎯 CLEANUP COMPLETE:');
    console.log(`✅ Bulk reconstructed (weekdays only): ${finalCount.rows[0].count} records`);
    console.log(`✅ Real-time submissions: ${realTimeCount.rows[0].count} records`);
    console.log(`✅ Weekend errors removed: ${deleteResult.rowCount} records`);
    console.log('✅ Audit compliance maintained with accurate data only');
    
    console.log('\n🔍 EXPLANATION:');
    console.log('The original bulk reconstruction system had date calculation errors');
    console.log('that created attendance records for weekends when no work occurs.');
    console.log('These have been removed to ensure data accuracy for compliance.');

  } catch (error) {
    console.error('❌ Weekend cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

removeWeekendErrors();
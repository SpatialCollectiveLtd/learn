require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkWorkDataTables() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 INVESTIGATING WORK DATA TABLES FOR API\n');

    // Check youth_work_days table
    console.log('📋 YOUTH WORK DAYS TABLE:');
    const workDays = await pool.query(`
      SELECT COUNT(*) as total_records,
             COUNT(DISTINCT youth_id) as unique_youth,
             MIN(work_date) as earliest_date,
             MAX(work_date) as latest_date
      FROM youth_work_days
    `);
    
    console.log(`   Total Records: ${workDays.rows[0].total_records}`);
    console.log(`   Unique Youth: ${workDays.rows[0].unique_youth}`);
    console.log(`   Date Range: ${workDays.rows[0].earliest_date} to ${workDays.rows[0].latest_date}`);

    // Check by program type
    const workByProgram = await pool.query(`
      SELECT yp.program_type, COUNT(ywd.*) as work_records
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      GROUP BY yp.program_type
      ORDER BY work_records DESC
    `);
    
    console.log('\n📊 WORK RECORDS BY PROGRAM:');
    workByProgram.rows.forEach(row => {
      console.log(`   ${row.program_type}: ${row.work_records} work days`);
    });

    // Check youth_work_summary table
    console.log('\n📋 YOUTH WORK SUMMARY TABLE:');
    const workSummary = await pool.query(`
      SELECT COUNT(*) as total_records,
             COUNT(DISTINCT youth_id) as unique_youth,
             SUM(total_buildings) as total_buildings,
             SUM(days_worked) as total_days
      FROM youth_work_summary
    `);
    
    console.log(`   Total Records: ${workSummary.rows[0].total_records}`);
    console.log(`   Unique Youth: ${workSummary.rows[0].unique_youth}`);
    console.log(`   Total Buildings: ${workSummary.rows[0].total_buildings}`);
    console.log(`   Total Days: ${workSummary.rows[0].total_days}`);

    // Check mobile mapping youth specifically
    console.log('\n📱 MOBILE MAPPING WORK DATA:');
    const mobileMapping = await pool.query(`
      SELECT 
        COUNT(*) as total_youth,
        COUNT(ywd.youth_id) as with_work_days,
        COUNT(yws.youth_id) as with_work_summary
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      LEFT JOIN youth_work_summary yws ON yp.youth_id = yws.youth_id
      WHERE yp.program_type = 'mobile_mapping'
    `);
    
    console.log(`   Total Mobile Mapping Youth: ${mobileMapping.rows[0].total_youth}`);
    console.log(`   With Work Days Records: ${mobileMapping.rows[0].with_work_days}`);
    console.log(`   With Work Summary Records: ${mobileMapping.rows[0].with_work_summary}`);

    // Check attendance vs work data discrepancy
    console.log('\n⚠️  ATTENDANCE VS WORK DATA COMPARISON:');
    const comparison = await pool.query(`
      SELECT 
        yp.program_type,
        COUNT(DISTINCT yp.youth_id) as total_youth,
        COUNT(DISTINCT ar.youth_id) as youth_with_attendance,
        COUNT(DISTINCT ywd.youth_id) as youth_with_work_days
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      GROUP BY yp.program_type
    `);
    
    comparison.rows.forEach(row => {
      console.log(`\n   ${row.program_type.toUpperCase()}:`);
      console.log(`     Total Youth: ${row.total_youth}`);
      console.log(`     With Attendance: ${row.youth_with_attendance}`);
      console.log(`     With Work Days: ${row.youth_with_work_days}`);
      
      const attendanceGap = row.youth_with_attendance - row.youth_with_work_days;
      if (attendanceGap > 0) {
        console.log(`     ⚠️  GAP: ${attendanceGap} youth have attendance but no work days!`);
      }
    });

    // Sample mobile mapping youth with attendance but no work data
    console.log('\n🕵️ SAMPLE MOBILE MAPPING YOUTH WITH MISSING WORK DATA:');
    const missingWork = await pool.query(`
      SELECT yp.youth_id, yp.full_name, 
             COUNT(ar.id) as attendance_count
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.id IS NOT NULL  -- Has attendance
        AND ywd.id IS NULL     -- But no work days
      GROUP BY yp.youth_id, yp.full_name
      ORDER BY attendance_count DESC
      LIMIT 10
    `);
    
    if (missingWork.rows.length > 0) {
      console.log('   Youth with attendance but no work records:');
      missingWork.rows.forEach(row => {
        console.log(`     ${row.youth_id} (${row.full_name}): ${row.attendance_count} attendance days`);
      });
      
      console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
      console.log('Mobile mapping youth have attendance records but no corresponding work_days records!');
      console.log('This explains why the API returns 0 work data for payments.');
    }

    // Check if work data exists in other forms (like OSM stats)
    console.log('\n🔍 CHECKING ALTERNATIVE WORK DATA SOURCES:');
    
    const osmStats = await pool.query(`
      SELECT COUNT(*) as records,
             COUNT(DISTINCT youth_id) as unique_youth,
             SUM(buildings_mapped) as total_buildings
      FROM youth_osm_stats
      WHERE youth_id IN (
        SELECT youth_id FROM youth_participants 
        WHERE program_type = 'mobile_mapping'
      )
    `);
    
    console.log(`   OSM Stats Records: ${osmStats.rows[0].records}`);
    console.log(`   Unique Youth with OSM Stats: ${osmStats.rows[0].unique_youth}`);
    console.log(`   Total Buildings from OSM: ${osmStats.rows[0].total_buildings}`);

    if (osmStats.rows[0].unique_youth > 0) {
      console.log('\n💡 POTENTIAL SOLUTION:');
      console.log('OSM stats data exists that could be used for payment calculations!');
      console.log('The API should include OSM building counts for mobile mapping payments.');
    }

    console.log('\n🎯 RECOMMENDATIONS FOR API UPDATE:');
    console.log('1. Include youth_osm_stats data in API response');
    console.log('2. Calculate work summary from attendance_records for mobile mapping');
    console.log('3. Add payment-specific fields (daily rates, total earnings)');
    console.log('4. Ensure all youth with attendance have calculable work data');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkWorkDataTables();
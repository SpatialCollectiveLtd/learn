require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkWorkDataTablesFixed() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 INVESTIGATING WORK DATA TABLES FOR API (FIXED)\n');

    // Sample mobile mapping youth with attendance but no work data
    console.log('🕵️ SAMPLE MOBILE MAPPING YOUTH WITH MISSING WORK DATA:');
    const missingWork = await pool.query(`
      SELECT yp.youth_id, yp.full_name, 
             COUNT(ar.youth_id) as attendance_count,
             COUNT(yws.youth_id) as has_work_summary
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      LEFT JOIN youth_work_summary yws ON yp.youth_id = yws.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.youth_id IS NOT NULL  -- Has attendance
        AND ywd.youth_id IS NULL     -- But no work days
      GROUP BY yp.youth_id, yp.full_name, yws.youth_id
      ORDER BY attendance_count DESC
      LIMIT 10
    `);
    
    if (missingWork.rows.length > 0) {
      console.log('   Youth with attendance but no work_days records:');
      missingWork.rows.forEach(row => {
        console.log(`     ${row.youth_id} (${row.full_name}): ${row.attendance_count} attendance, work_summary: ${row.has_work_summary > 0 ? 'Yes' : 'No'}`);
      });
    }

    // Check OSM stats for work data 
    console.log('\n🔍 CHECKING OSM STATS FOR MOBILE MAPPING WORK DATA:');
    
    const osmStats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT youth_id) as unique_youth,
        SUM(buildings_mapped) as total_buildings,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM youth_osm_stats
      WHERE youth_id IN (
        SELECT youth_id FROM youth_participants 
        WHERE program_type = 'mobile_mapping'
      )
    `);
    
    console.log(`   OSM Stats Records: ${osmStats.rows[0].total_records}`);
    console.log(`   Unique Youth with OSM Stats: ${osmStats.rows[0].unique_youth}`);
    console.log(`   Total Buildings from OSM: ${osmStats.rows[0].total_buildings}`);
    console.log(`   Date Range: ${osmStats.rows[0].earliest_date} to ${osmStats.rows[0].latest_date}`);

    // Check attendance as work indicator
    console.log('\n📅 ATTENDANCE AS WORK INDICATOR:');
    const attendanceWork = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        COUNT(DISTINCT ar.attendance_date) as attendance_days,
        yws.total_buildings,
        yws.days_worked as summary_days
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      LEFT JOIN youth_work_summary yws ON yp.youth_id = yws.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.youth_id IS NOT NULL
      GROUP BY yp.youth_id, yp.full_name, yws.total_buildings, yws.days_worked
      ORDER BY attendance_days DESC
      LIMIT 10
    `);

    console.log('   Sample Mobile Mapping Youth (attendance vs work_summary):');
    attendanceWork.rows.forEach(row => {
      console.log(`     ${row.youth_id}: ${row.attendance_days} attendance days, ${row.summary_days || 0} work summary days, ${row.total_buildings || 0} buildings`);
    });

    // Check what work data is available for payment calculations
    console.log('\n💰 WORK DATA AVAILABLE FOR PAYMENTS:');
    
    const paymentData = await pool.query(`
      SELECT 
        yp.program_type,
        COUNT(*) as total_youth,
        COUNT(CASE WHEN ar.youth_id IS NOT NULL THEN 1 END) as with_attendance,
        COUNT(CASE WHEN ywd.youth_id IS NOT NULL THEN 1 END) as with_work_days,
        COUNT(CASE WHEN yws.total_buildings > 0 THEN 1 END) as with_buildings,
        COUNT(CASE WHEN yos.youth_id IS NOT NULL THEN 1 END) as with_osm_stats
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id  
      LEFT JOIN youth_work_summary yws ON yp.youth_id = yws.youth_id
      LEFT JOIN youth_osm_stats yos ON yp.youth_id = yos.youth_id
      GROUP BY yp.program_type
      ORDER BY yp.program_type
    `);

    paymentData.rows.forEach(row => {
      console.log(`\n   ${row.program_type.toUpperCase()}:`);
      console.log(`     Total Youth: ${row.total_youth}`);
      console.log(`     With Attendance: ${row.with_attendance} (${Math.round(row.with_attendance/row.total_youth*100)}%)`);
      console.log(`     With Work Days: ${row.with_work_days} (${Math.round(row.with_work_days/row.total_youth*100)}%)`);
      console.log(`     With Buildings Mapped: ${row.with_buildings} (${Math.round(row.with_buildings/row.total_youth*100)}%)`);
      console.log(`     With OSM Stats: ${row.with_osm_stats} (${Math.round(row.with_osm_stats/row.total_youth*100)}%)`);
      
      if (row.with_attendance > row.with_work_days) {
        const gap = row.with_attendance - row.with_work_days;
        console.log(`     🚨 PAYMENT GAP: ${gap} youth have attendance but no work_days for payment!`);
      }
    });

    console.log('\n🎯 API UPDATE REQUIREMENTS:');
    console.log('1. ADD OSM stats data to API (buildings mapped from youth_osm_stats)');
    console.log('2. USE attendance records as work days for mobile mapping payments');
    console.log('3. ADD payment calculation fields (daily rates, total earnings)');
    console.log('4. INCLUDE alternative work metrics when work_days is empty');
    console.log('5. FLAG data sources for transparency (OSM vs work_days vs attendance)');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkWorkDataTablesFixed();
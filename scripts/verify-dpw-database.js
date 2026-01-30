// DPW Database Verification Script
// Checks if database has required data for API to function
// Part of Phase 0 diagnostic

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function verifyDatabase() {
  console.log('🔍 DPW Database Verification Script');
  console.log('=====================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    const connTest = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Connected to: ${connTest.rows[0].db_name}`);
    console.log(`   Server time: ${connTest.rows[0].current_time}\n`);

    // Check youth_participants table
    console.log('2️⃣ Checking youth_participants table...');
    const youthCount = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active,
        COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive
      FROM youth_participants
    `);
    console.log(`   Total youth: ${youthCount.rows[0].total}`);
    console.log(`   Active: ${youthCount.rows[0].active}`);
    console.log(`   Inactive: ${youthCount.rows[0].inactive}`);

    if (parseInt(youthCount.rows[0].active) === 0) {
      console.log('   ❌ WARNING: No active youth participants!\n');
    } else {
      console.log('   ✅ Has active youth\n');
    }

    // Check by module
    console.log('3️⃣ Youth by module (active only)...');
    const byModule = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as count,
        COUNT(CASE WHEN osm_username IS NOT NULL THEN 1 END) as with_osm_username
      FROM youth_participants
      WHERE is_active = TRUE
      GROUP BY program_type
      ORDER BY program_type
    `);
    
    if (byModule.rows.length === 0) {
      console.log('   ❌ No active youth by module\n');
    } else {
      byModule.rows.forEach(row => {
        console.log(`   ${row.program_type}: ${row.count} youth (${row.with_osm_username} with OSM username)`);
      });
      console.log('');
    }

    // Check by settlement
    console.log('4️⃣ Youth by settlement (active only)...');
    const bySettlement = await pool.query(`
      SELECT 
        settlement,
        COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE
      GROUP BY settlement
      ORDER BY settlement
    `);
    
    if (bySettlement.rows.length === 0) {
      console.log('   ❌ No settlement data\n');
    } else {
      bySettlement.rows.forEach(row => {
        console.log(`   ${row.settlement || '(null)'}: ${row.count} youth`);
      });
      console.log('');
    }

    // Check attendance_records table
    console.log('5️⃣ Checking attendance_records table...');
    const attendanceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT youth_id) as unique_youth,
        COUNT(DISTINCT attendance_date) as unique_dates,
        MIN(attendance_date) as earliest_date,
        MAX(attendance_date) as latest_date
      FROM attendance_records
    `);
    
    if (parseInt(attendanceStats.rows[0].total_records) === 0) {
      console.log('   ❌ WARNING: No attendance records!\n');
    } else {
      const stats = attendanceStats.rows[0];
      console.log(`   Total records: ${stats.total_records}`);
      console.log(`   Unique youth: ${stats.unique_youth}`);
      console.log(`   Date range: ${stats.earliest_date} to ${stats.latest_date}`);
      console.log(`   ✅ Has attendance data\n`);
    }

    // Check recent attendance (last 30 days)
    console.log('6️⃣ Recent attendance (last 30 days)...');
    const recentAttendance = await pool.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(DISTINCT youth_id) as unique_youth,
        COUNT(DISTINCT attendance_date) as unique_dates
      FROM attendance_records
      WHERE attendance_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    console.log(`   Records: ${recentAttendance.rows[0].count}`);
    console.log(`   Unique youth: ${recentAttendance.rows[0].unique_youth}`);
    console.log(`   Unique dates: ${recentAttendance.rows[0].unique_dates}\n`);

    // Check youth_work_days table
    console.log('7️⃣ Checking youth_work_days table...');
    try {
      const workDaysStats = await pool.query(`
        SELECT 
          COUNT(*) as total_work_days,
          COUNT(DISTINCT youth_id) as unique_youth,
          MIN(work_date) as earliest_date,
          MAX(work_date) as latest_date,
          COUNT(CASE WHEN buildings_count > 0 THEN 1 END) as days_with_buildings
        FROM youth_work_days
      `);
      
      if (parseInt(workDaysStats.rows[0].total_work_days) === 0) {
        console.log('   ⚠️  No work days recorded\n');
      } else {
        const stats = workDaysStats.rows[0];
        console.log(`   Total work days: ${stats.total_work_days}`);
        console.log(`   Unique youth: ${stats.unique_youth}`);
        console.log(`   Date range: ${stats.earliest_date} to ${stats.latest_date}`);
        console.log(`   Days with buildings: ${stats.days_with_buildings}`);
        console.log(`   ✅ Has work days data\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Table not found or error: ${error.message}\n`);
    }

    // Check youth_work_summary
    console.log('8️⃣ Checking youth_work_summary...');
    try {
      const workSummary = await pool.query(`
        SELECT COUNT(*) as count FROM youth_work_summary
      `);
      console.log(`   Records in view: ${workSummary.rows[0].count}`);
      console.log(`   ✅ View exists\n`);
    } catch (error) {
      console.log(`   ⚠️  View not found or error: ${error.message}\n`);
    }

    // Check youth_training_progress
    console.log('9️⃣ Checking youth_training_progress table...');
    try {
      const trainingStats = await pool.query(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT youth_id) as unique_youth,
          module_type,
          COUNT(*) as count
        FROM youth_training_progress
        GROUP BY module_type
      `);
      
      if (trainingStats.rows.length === 0) {
        console.log('   ⚠️  No training progress records\n');
      } else {
        trainingStats.rows.forEach(row => {
          console.log(`   ${row.module_type}: ${row.count} completion records`);
        });
        console.log(`   ✅ Has training progress data\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Table not found or error: ${error.message}\n`);
    }

    // Check signed_contracts
    console.log('🔟 Checking signed_contracts table...');
    const contractStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_valid = TRUE THEN 1 END) as valid,
        COUNT(DISTINCT youth_id) as unique_youth
      FROM signed_contracts
    `);
    console.log(`   Total contracts: ${contractStats.rows[0].total}`);
    console.log(`   Valid contracts: ${contractStats.rows[0].valid}`);
    console.log(`   Unique youth: ${contractStats.rows[0].unique_youth}\n`);

    // Sample a few youth records to verify data structure
    console.log('1️⃣1️⃣ Sample youth records (first 3 active)...');
    const sampleYouth = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement, osm_username
      FROM youth_participants
      WHERE is_active = TRUE
      ORDER BY youth_id
      LIMIT 3
    `);
    
    if (sampleYouth.rows.length === 0) {
      console.log('   ❌ No sample records available\n');
    } else {
      sampleYouth.rows.forEach((youth, index) => {
        console.log(`   ${index + 1}. ${youth.youth_id} - ${youth.full_name}`);
        console.log(`      Module: ${youth.program_type}, Settlement: ${youth.settlement}`);
        console.log(`      OSM: ${youth.osm_username || '(none)'}`);
      });
      console.log('');
    }

    // Check for data issues
    console.log('1️⃣2️⃣ Checking for potential data issues...');
    const issues = [];

    // Active youth without OSM username (for digitization)
    const noOsm = await pool.query(`
      SELECT COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE 
      AND program_type = 'digitization'
      AND (osm_username IS NULL OR osm_username = '')
    `);
    if (parseInt(noOsm.rows[0].count) > 0) {
      issues.push(`${noOsm.rows[0].count} digitization youth without OSM username`);
    }

    // Active youth without settlement
    const noSettlement = await pool.query(`
      SELECT COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE 
      AND (settlement IS NULL OR settlement = '')
    `);
    if (parseInt(noSettlement.rows[0].count) > 0) {
      issues.push(`${noSettlement.rows[0].count} youth without settlement`);
    }

    // Attendance records for inactive youth
    const attendanceInactive = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records ar
      LEFT JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = FALSE OR yp.youth_id IS NULL
    `);
    if (parseInt(attendanceInactive.rows[0].count) > 0) {
      issues.push(`${attendanceInactive.rows[0].count} attendance records for inactive/missing youth`);
    }

    if (issues.length === 0) {
      console.log('   ✅ No data issues found\n');
    } else {
      console.log('   ⚠️  Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('');
    }

    // Final summary
    console.log('📊 SUMMARY');
    console.log('==========');
    const activeYouth = parseInt(youthCount.rows[0].active);
    const totalAttendance = parseInt(attendanceStats.rows[0].total_records);
    
    if (activeYouth === 0) {
      console.log('❌ CRITICAL: No active youth participants - API will return empty results');
    } else if (totalAttendance === 0) {
      console.log('⚠️  WARNING: No attendance records - API will return youth but no attendance data');
    } else {
      console.log('✅ Database appears healthy for DPW API');
      console.log(`   ${activeYouth} active youth with ${totalAttendance} attendance records`);
    }

    console.log('\n✅ Database verification complete!\n');

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

verifyDatabase();

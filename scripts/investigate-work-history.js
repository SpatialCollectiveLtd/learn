/**
 * Deep investigation of work history for the 25 youth
 * Purpose: Find ALL work history that should be visible after reverting to mobile_mapping
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// The 25 youth IDs from the CSV
const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function findAllWorkHistory() {
  console.log('\n🔍 COMPLETE WORK HISTORY INVESTIGATION\n');
  console.log('='.repeat(100));
  
  // Check ALL work days for these youth, regardless of status
  const workHistory = await pool.query(`
    SELECT 
      ywd.youth_id,
      yp.full_name,
      ywd.work_date,
      ywd.buildings_count,
      ywd.status,
      ywd.target_met,
      ywd.daily_target,
      ywd.approved_by,
      ywd.approved_at,
      ywd.notes
    FROM youth_work_days ywd
    JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
    WHERE ywd.youth_id = ANY($1)
    ORDER BY ywd.youth_id, ywd.work_date DESC
  `, [youthIds]);

  console.log(`Found ${workHistory.rows.length} total work day records for the 25 youth:`);
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | Work Date  | Buildings | Status    | Target Met | Approved By');
  console.log('-'.repeat(100));

  const byYouth = workHistory.rows.reduce((acc, record) => {
    if (!acc[record.youth_id]) acc[record.youth_id] = [];
    acc[record.youth_id].push(record);
    return acc;
  }, {});

  for (const [youthId, records] of Object.entries(byYouth)) {
    const youth = records[0]; // Get youth info from first record
    console.log(`\n📍 ${youthId} - ${youth.full_name || 'NO NAME'} (${records.length} work days)`);
    
    records.forEach(record => {
      const statusIcon = record.status === 'approved' ? '✅' : record.status === 'pending' ? '⏳' : '❌';
      const targetIcon = record.target_met ? '🎯' : '⚪';
      
      console.log(`     ${record.work_date.toISOString().split('T')[0]} | ${String(record.buildings_count || 0).padStart(9)} | ${(record.status + ' ' + statusIcon).padEnd(12)} | ${targetIcon.padEnd(11)} | ${record.approved_by || 'N/A'}`);
    });
  }

  return workHistory.rows;
}

async function checkOsmStats() {
  console.log('\n\n📊 OSM STATS INVESTIGATION\n');
  console.log('='.repeat(100));
  
  // Check youth_osm_stats table for building mapping data
  const osmStats = await pool.query(`
    SELECT 
      yos.youth_id,
      yp.full_name,
      yp.osm_username,
      COUNT(*) as stat_records,
      MIN(yos.date) as first_date,
      MAX(yos.date) as last_date,
      SUM(yos.buildings_mapped) as total_buildings,
      AVG(yos.buildings_mapped) as avg_buildings_per_day
    FROM youth_osm_stats yos
    JOIN youth_participants yp ON yos.youth_id = yp.youth_id
    WHERE yos.youth_id = ANY($1)
    AND yos.buildings_mapped > 0
    GROUP BY yos.youth_id, yp.full_name, yp.osm_username
    ORDER BY total_buildings DESC
  `, [youthIds]);

  console.log(`Found ${osmStats.rows.length} youth with OSM building mapping data:`);
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | OSM Username         | Records | Period              | Buildings | Avg/Day');
  console.log('-'.repeat(100));

  osmStats.rows.forEach(youth => {
    const period = `${youth.first_date.toISOString().split('T')[0]} to ${youth.last_date.toISOString().split('T')[0]}`;
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${(youth.osm_username || 'NO OSM').padEnd(20)} | ${String(youth.stat_records).padEnd(7)} | ${period.padEnd(19)} | ${String(youth.total_buildings).padEnd(9)} | ${Math.round(youth.avg_buildings_per_day || 0)}`);
  });

  return osmStats.rows;
}

async function checkAttendanceRecords() {
  console.log('\n\n📅 ATTENDANCE RECORDS INVESTIGATION\n');
  console.log('='.repeat(100));
  
  // Check attendance_records table for the period
  const attendance = await pool.query(`
    SELECT 
      ar.youth_id,
      yp.full_name,
      COUNT(*) as attendance_days,
      MIN(ar.attendance_date) as first_attendance,
      MAX(ar.attendance_date) as last_attendance,
      ARRAY_AGG(ar.attendance_date ORDER BY ar.attendance_date DESC) as all_dates
    FROM attendance_records ar
    JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    WHERE ar.youth_id = ANY($1)
    GROUP BY ar.youth_id, yp.full_name
    ORDER BY attendance_days DESC
  `, [youthIds]);

  console.log(`Found ${attendance.rows.length} youth with attendance records:`);
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | Days  | Period              | Recent Dates');
  console.log('-'.repeat(100));

  attendance.rows.forEach(youth => {
    const period = `${youth.first_attendance.toISOString().split('T')[0]} to ${youth.last_attendance.toISOString().split('T')[0]}`;
    const recentDates = youth.all_dates.slice(0, 5).map(d => d.toISOString().split('T')[0]).join(', ');
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.attendance_days).padEnd(5)} | ${period.padEnd(19)} | ${recentDates}`);
  });

  return attendance.rows;
}

async function investigateWorkDaySyncIssue() {
  console.log('\n\n🔧 WORK DAY SYNC ISSUE INVESTIGATION\n');
  console.log('='.repeat(100));
  
  console.log('Theory: Youth have OSM stats but missing corresponding work days');
  console.log('This could happen if work days were not properly synced from OSM data');
  
  // Find youth with OSM data but no work days
  const mismatch = await pool.query(`
    SELECT 
      yos.youth_id,
      yp.full_name,
      yp.osm_username,
      COUNT(DISTINCT yos.date) as osm_days,
      SUM(yos.buildings_mapped) as total_buildings,
      MIN(yos.date) as first_osm_date,
      MAX(yos.date) as last_osm_date,
      
      -- Count corresponding work days
      (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yos.youth_id) as work_days,
      (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yos.youth_id AND status = 'approved') as approved_work_days
      
    FROM youth_osm_stats yos
    JOIN youth_participants yp ON yos.youth_id = yp.youth_id
    WHERE yos.youth_id = ANY($1)
    AND yos.buildings_mapped > 0
    GROUP BY yos.youth_id, yp.full_name, yp.osm_username
    HAVING COUNT(DISTINCT yos.date) > (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yos.youth_id)
    ORDER BY (COUNT(DISTINCT yos.date) - (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = yos.youth_id)) DESC
  `, [youthIds]);

  console.log(`Found ${mismatch.rows.length} youth with OSM data missing corresponding work days:`);
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | OSM Days | Buildings | Work Days | Missing | Period');
  console.log('-'.repeat(100));

  mismatch.rows.forEach(youth => {
    const missing = youth.osm_days - youth.work_days;
    const period = `${youth.first_osm_date.toISOString().split('T')[0]} to ${youth.last_osm_date.toISOString().split('T')[0]}`;
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.osm_days).padEnd(8)} | ${String(youth.total_buildings).padEnd(9)} | ${String(youth.work_days).padEnd(9)} | ${String(missing).padEnd(7)} | ${period}`);
  });

  return mismatch.rows;
}

async function checkRecentWorkPeriod() {
  console.log('\n\n📅 RECENT WORK PERIOD CHECK (Jan-Feb 2026)\n');
  console.log('='.repeat(100));
  
  // Check for work/OSM activity in the recent period when they should have been working
  const recentActivity = await pool.query(`
    WITH recent_osm AS (
      SELECT 
        youth_id,
        COUNT(*) as recent_osm_days,
        SUM(buildings_mapped) as recent_buildings,
        MIN(date) as first_recent_date,
        MAX(date) as last_recent_date
      FROM youth_osm_stats
      WHERE youth_id = ANY($1)
      AND date >= '2026-01-01'
      AND buildings_mapped > 0
      GROUP BY youth_id
    ),
    recent_work AS (
      SELECT 
        youth_id,
        COUNT(*) as recent_work_days,
        MIN(work_date) as first_work_date,
        MAX(work_date) as last_work_date
      FROM youth_work_days
      WHERE youth_id = ANY($1)
      AND work_date >= '2026-01-01'
      GROUP BY youth_id
    ),
    recent_attendance AS (
      SELECT 
        youth_id,
        COUNT(*) as recent_attendance,
        MIN(attendance_date) as first_attendance_date,
        MAX(attendance_date) as last_attendance_date
      FROM attendance_records
      WHERE youth_id = ANY($1)
      AND attendance_date >= '2026-01-01'
      GROUP BY youth_id
    )
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.program_type,
      ro.recent_osm_days,
      ro.recent_buildings,
      ro.first_recent_date as osm_start,
      ro.last_recent_date as osm_end,
      rw.recent_work_days,
      rw.first_work_date as work_start, 
      rw.last_work_date as work_end,
      ra.recent_attendance,
      ra.first_attendance_date as attendance_start,
      ra.last_attendance_date as attendance_end
    FROM youth_participants yp
    LEFT JOIN recent_osm ro ON yp.youth_id = ro.youth_id
    LEFT JOIN recent_work rw ON yp.youth_id = rw.youth_id
    LEFT JOIN recent_attendance ra ON yp.youth_id = ra.youth_id
    WHERE yp.youth_id = ANY($1)
    AND (ro.recent_osm_days IS NOT NULL OR rw.recent_work_days IS NOT NULL OR ra.recent_attendance IS NOT NULL)
    ORDER BY yp.youth_id
  `, [youthIds]);

  console.log(`Found ${recentActivity.rows.length} youth with recent activity (Jan-Feb 2026):`);
  console.log('-'.repeat(150));
  console.log('Youth ID     | Name                 | Program      | OSM Days | Buildings | Work Days | Attendance | OSM Period        | Work Period       | Attendance Period');
  console.log('-'.repeat(150));

  recentActivity.rows.forEach(youth => {
    const osmPeriod = youth.osm_start && youth.osm_end 
      ? `${youth.osm_start.toISOString().split('T')[0]} to ${youth.osm_end.toISOString().split('T')[0]}`
      : 'N/A';
    const workPeriod = youth.work_start && youth.work_end 
      ? `${youth.work_start.toISOString().split('T')[0]} to ${youth.work_end.toISOString().split('T')[0]}` 
      : 'N/A';
    const attendancePeriod = youth.attendance_start && youth.attendance_end
      ? `${youth.attendance_start.toISOString().split('T')[0]} to ${youth.attendance_end.toISOString().split('T')[0]}`
      : 'N/A';
      
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${youth.program_type.padEnd(12)} | ${String(youth.recent_osm_days || 0).padEnd(8)} | ${String(youth.recent_buildings || 0).padEnd(9)} | ${String(youth.recent_work_days || 0).padEnd(9)} | ${String(youth.recent_attendance || 0).padEnd(10)} | ${osmPeriod.padEnd(17)} | ${workPeriod.padEnd(17)} | ${attendancePeriod}`);
  });

  return recentActivity.rows;
}

async function main() {
  try {
    console.log('🕵️ DEEP WORK HISTORY INVESTIGATION FOR 25 YOUTH');
    console.log('==============================================');
    console.log('Looking for ALL work data across multiple tables...\n');
    
    // Step 1: Find all work days (any status)
    const workHistory = await findAllWorkHistory();
    
    // Step 2: Check OSM stats for building mapping data  
    const osmData = await checkOsmStats();
    
    // Step 3: Check attendance records
    const attendanceData = await checkAttendanceRecords();
    
    // Step 4: Investigate sync issues
    const syncIssues = await investigateWorkDaySyncIssue();
    
    // Step 5: Check recent activity period  
    const recentActivity = await checkRecentWorkPeriod();
    
    console.log('\n📊 INVESTIGATION SUMMARY:');
    console.log('========================');
    console.log(`Work Day Records: ${workHistory.length}`);
    console.log(`Youth with OSM Data: ${osmData.length}`); 
    console.log(`Youth with Attendance: ${attendanceData.length}`);
    console.log(`Sync Issues Found: ${syncIssues.length}`);
    console.log(`Recent Activity (2026): ${recentActivity.length}`);
    
    if (syncIssues.length > 0) {
      console.log('\n⚠️  SYNC ISSUES DETECTED!');
      console.log('Youth have OSM building mapping data but missing work day records.');
      console.log('This suggests the work day sync process may need to be run.');
    }
    
    if (recentActivity.length > 0) {
      console.log('\n✅ RECENT ACTIVITY FOUND!');
      console.log('Youth have been active in Jan-Feb 2026 as expected.');
    }
    
  } catch (error) {
    console.error('💥 Investigation error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
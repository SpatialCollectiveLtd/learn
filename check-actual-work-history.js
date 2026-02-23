require('dotenv').config({path: '.env.local'});

async function checkActualWorkHistory() {
  console.log('🔍 RE-INVESTIGATING: What Work Data EXISTS vs What DPW SEES');
  console.log('📅 Focus: Mobile Mapping work period and API data\n');

  try {
    // Test the actual API call to see what DPW gets
    const response = await fetch('http://localhost:3000/api/external/dpw-sync?module=mobile_mapping', {
      headers: {
        'X-API-Key': process.env.DPW_MANAGER_API_KEY
      }
    });
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('🌐 API RESPONSE FOR MOBILE MAPPING:');
      console.log(`   Total participants returned: ${apiData.data.count}`);
      
      // Check KAY098JO specifically  
      const kay098 = apiData.data.participants.find(p => p.youth_id === 'KAY098JO');
      if (kay098) {
        console.log('\n👤 KAY098JO API DATA:');
        console.log(`   Attendance Days: ${kay098.attendance_days}`);
        console.log(`   Work History Length: ${kay098.work_history?.length || 0}`);
        console.log(`   Payment Data: ${JSON.stringify(kay098.payment_data, null, 2)}`);
        
        if (kay098.attendance_history && kay098.attendance_history.length > 0) {
          console.log('\n📅 ATTENDANCE HISTORY FROM API:');
          kay098.attendance_history.slice(0, 5).forEach(att => {
            console.log(`     ${att.date}: submitted ${att.submitted_at}`);
          });
          console.log(`     ... ${kay098.attendance_history.length} total attendance records`);
        }
      }
      
      // Check work period definition
      const stats = apiData.data.statistics[0]; // mobile mapping stats
      console.log(`\n📊 MOBILE MAPPING STATISTICS:`);
      console.log(`   Total Days Worked: ${stats.total_days_worked}`);
      console.log(`   Total Attendance Records: ${stats.total_attendance_records}`);
      console.log(`   Buildings Mapped: ${stats.total_buildings_mapped}`);
      
    } else {
      console.log('❌ API call failed, checking database directly...');
    }
  } catch (error) {
    console.log('❌ API test failed, checking database directly...');
  }

  // Direct database check
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check what the work period should actually be
    console.log('\n🗓️ WORK PERIOD CONFIGURATION:');
    const workConfig = await pool.query(`
      SELECT * FROM settlement_work_config 
      WHERE settlement = 'Kayole Soweto' 
        AND program_type = 'mobile_mapping'
    `);
    
    if (workConfig.rows.length > 0) {
      const config = workConfig.rows[0];
      console.log(`   Start Date: ${config.start_date}`);
      console.log(`   Total Work Days: ${config.total_work_days}`);
      console.log(`   Daily Target: ${config.daily_target}`);
      console.log(`   Project Hashtag: ${config.project_hashtag}`);
    } else {
      console.log('   ❌ No work configuration found for Kayole Soweto mobile mapping');
    }

    // Check ALL attendance data for Kayole mobile mapping youth
    console.log('\n📅 ALL ATTENDANCE DATA (Kayole Mobile Mapping):');
    const allAttendance = await pool.query(`
      SELECT 
        ar.attendance_date,
        COUNT(*) as youth_count,
        ar.submitted_at::date as submitted_date,
        ar.submitted_by
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'
        AND ar.attendance_date >= '2026-02-01'
      GROUP BY ar.attendance_date, ar.submitted_at::date, ar.submitted_by
      ORDER BY ar.attendance_date DESC
    `);

    console.log(`   Found ${allAttendance.rows.length} attendance date groups:`);
    allAttendance.rows.forEach(row => {
      console.log(`     ${row.attendance_date.toISOString().split('T')[0]}: ${row.youth_count} youth (submitted ${row.submitted_date})`);
    });

    // Check work_days data specifically
    console.log('\n💼 WORK DAYS DATA (Kayole Mobile Mapping):');
    const workDays = await pool.query(`
      SELECT 
        ywd.youth_id,
        yp.full_name,
        ywd.work_date,
        ywd.buildings_count,
        ywd.status,
        ywd.created_at
      FROM youth_work_days ywd
      JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'
        AND ywd.work_date >= '2026-02-01'
      ORDER BY ywd.work_date DESC, ywd.youth_id
      LIMIT 20
    `);

    console.log(`   Found ${workDays.rows.length} work_days records:`);
    workDays.rows.forEach(row => {
      console.log(`     ${row.youth_id} (${row.full_name}): ${row.work_date.toISOString().split('T')[0]} - ${row.buildings_count} buildings (${row.status})`);
    });

    // What should DPW expect to see?
    console.log('\n🎯 WHAT DPW SHOULD SEE:');
    console.log('Expected work period: Feb 9-20 (11 working days)');
    console.log(`Actual attendance dates found: ${allAttendance.rows.length} dates`);
    
    // Check if there are dates in the expected range
    const feb9to20 = allAttendance.rows.filter(row => {
      const date = row.attendance_date.toISOString().split('T')[0];
      return date >= '2026-02-09' && date <= '2026-02-20';
    });
    
    console.log(`Attendance in Feb 9-20 range: ${feb9to20.length} dates`);
    feb9to20.forEach(row => {
      console.log(`  ✅ ${row.attendance_date.toISOString().split('T')[0]}: ${row.youth_count} youth`);
    });

    console.log('\n🤔 ANALYSIS:');
    if (allAttendance.rows.length >= 2) {
      console.log('✅ We DO have attendance data (more than DPW reported 2 days)');
      console.log('🤔 DPW may be looking at wrong date range or different module');
      console.log('🔍 Need to verify what DPW is actually seeing in their API calls');
    } else {
      console.log('❌ Confirmed: Limited attendance data available'); 
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkActualWorkHistory();
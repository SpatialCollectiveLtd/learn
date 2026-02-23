require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function investigateAPIDiscrepancy() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 INVESTIGATING API vs DATABASE DISCREPANCY');
    console.log('📅 Focus: Feb 9-20 attendance data that UI shows but API doesn\'t return\n');

    // Check ALL attendance data for Feb 9-20 period
    console.log('📊 DATABASE: Attendance records Feb 9-20, 2026');
    const feb9to20Attendance = await pool.query(`
      SELECT 
        ar.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type,
        ar.attendance_date,
        ar.submitted_at,
        ar.submitted_by,
        ar.notes
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      ORDER BY ar.attendance_date DESC, ar.youth_id
    `);

    console.log(`   Total Records Found: ${feb9to20Attendance.rows.length}`);
    
    if (feb9to20Attendance.rows.length > 0) {
      // Group by date
      const byDate = {};
      feb9to20Attendance.rows.forEach(record => {
        const date = record.attendance_date.toISOString().split('T')[0];
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(record);
      });

      console.log('\n📅 BREAKDOWN BY DATE:');
      Object.keys(byDate).sort().forEach(date => {
        console.log(`   ${date}: ${byDate[date].length} youth records`);
      });

      // Sample data
      console.log('\n👤 SAMPLE RECORDS (first 5):');
      feb9to20Attendance.rows.slice(0, 5).forEach(record => {
        console.log(`   ${record.youth_id} (${record.full_name}): ${record.attendance_date.toISOString().split('T')[0]} submitted ${record.submitted_at.toISOString().split('T')[0]}`);
      });

    } else {
      console.log('   ❌ NO RECORDS FOUND in database for Feb 9-20');
    }

    // Now test what the API actually returns for the same youth
    console.log('\n🌐 API TEST: What does the API return for these youth?');
    
    // Test API query similar to what DPW uses
    const apiTestQuery = `
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type as module,
        yp.settlement,
        
        -- Attendance days count
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), 0) as attendance_days,
        
        -- Attendance history JSON (as API returns it)
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'date', attendance_date::text,
              'submitted_at', submitted_at,
              'submitted_by', submitted_by,
              'notes', notes
            ) ORDER BY attendance_date DESC
          )
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), '[]'::json) as attendance_history
        
      FROM youth_participants yp
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'
        AND yp.is_active = TRUE
      ORDER BY yp.youth_id
      LIMIT 3
    `;

    const apiSimulation = await pool.query(apiTestQuery);
    
    console.log(`   API Simulation Results: ${apiSimulation.rows.length} youth`);
    
    apiSimulation.rows.forEach(youth => {
      console.log(`\n   👤 ${youth.youth_id} (${youth.full_name}):`);
      console.log(`      Total Attendance Days: ${youth.attendance_days}`);
      console.log(`      Attendance History Length: ${youth.attendance_history.length}`);
      
      if (youth.attendance_history.length > 0) {
        console.log('      Recent Attendance:');
        youth.attendance_history.slice(0, 3).forEach(att => {
          console.log(`        ${att.date}: submitted ${att.submitted_at.split('T')[0]}`);
        });
        
        // Check for Feb 9-20 specifically
        const feb9to20Records = youth.attendance_history.filter(att => {
          const date = att.date;
          return date >= '2026-02-09' && date <= '2026-02-20';
        });
        
        console.log(`      Feb 9-20 Records: ${feb9to20Records.length}`);
        feb9to20Records.forEach(att => {
          console.log(`        ✅ ${att.date}: submitted ${att.submitted_at.split('T')[0]}`);
        });
      }
    });

    // Check for specific filtering issues
    console.log('\n🔍 POTENTIAL API FILTERING ISSUES:');
    
    // Check if it's an is_active filter issue
    const inactiveCheck = await pool.query(`
      SELECT COUNT(*) as inactive_count
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'  
        AND yp.is_active = FALSE
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
    `);
    
    console.log(`   Inactive youth with Feb 9-20 attendance: ${inactiveCheck.rows[0].inactive_count}`);

    // Check if it's a date format/timezone issue
    console.log('\n🕒 DATE FORMAT CHECK:');
    const dateFormatCheck = await pool.query(`
      SELECT 
        attendance_date::date as date_only,
        COUNT(*) as record_count,
        MIN(submitted_at) as earliest_submission,
        MAX(submitted_at) as latest_submission
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.settlement = 'Kayole Soweto'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY attendance_date::date
      ORDER BY attendance_date::date
    `);

    dateFormatCheck.rows.forEach(row => {
      console.log(`   ${row.date_only}: ${row.record_count} records (submissions: ${row.earliest_submission.toISOString().split('T')[0]} to ${row.latest_submission.toISOString().split('T')[0]})`);
    });

    console.log('\n🎯 DIAGNOSIS:');
    if (feb9to20Attendance.rows.length > 0) {
      console.log('✅ DATA EXISTS in database for Feb 9-20');
      console.log('❌ API may have filtering/query issue preventing return');
      console.log('🔍 Need to check API route filtering logic');
    } else {
      console.log('❌ NO DATA in database for Feb 9-20 period');
      console.log('🤔 UI dashboard may be showing different data or date range');
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

investigateAPIDiscrepancy();
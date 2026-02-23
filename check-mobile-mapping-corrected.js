require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkMobileMappingDataProperly() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 CORRECTED MOBILE MAPPING CHECK - ALL SETTLEMENTS');
    console.log('📅 Focus: Feb 11, 2026 specifically + Feb 9-20 complete check\n');

    // First, check specifically for Feb 11 data (from screenshot)
    console.log('📊 FEB 11, 2026 - MOBILE MAPPING ATTENDANCE:');
    const feb11Data = await pool.query(`
      SELECT 
        ar.youth_id,
        yp.full_name,
        yp.settlement,
        ar.attendance_date,
        ar.submitted_at,
        ar.submitted_by
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.attendance_date = '2026-02-11'
      ORDER BY yp.settlement, ar.submitted_at DESC
    `);

    console.log(`   Records Found: ${feb11Data.rows.length}`);
    
    if (feb11Data.rows.length > 0) {
      // Group by settlement
      const bySettlement = {};
      feb11Data.rows.forEach(record => {
        if (!bySettlement[record.settlement]) {
          bySettlement[record.settlement] = [];
        }
        bySettlement[record.settlement].push(record);
      });

      console.log('\n   📍 BY SETTLEMENT:');
      Object.keys(bySettlement).forEach(settlement => {
        const records = bySettlement[settlement];
        console.log(`     ${settlement}: ${records.length} youth`);
        
        // Show first few youth from each settlement
        records.slice(0, 5).forEach((record, index) => {
          console.log(`       ${index + 1}. ${record.youth_id} (${record.full_name})`);
          console.log(`          Submitted: ${record.submitted_at.toISOString()} by ${record.submitted_by}`);
        });
        if (records.length > 5) {
          console.log(`       ... and ${records.length - 5} more`);
        }
      });

    } else {
      console.log('   ❌ NO Feb 11 data found');
    }

    // Now check the complete Feb 9-20 period properly
    console.log('\n🗓️ COMPLETE FEB 9-20 MOBILE MAPPING CHECK:');
    const completeCheck = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.settlement,
        COUNT(*) as youth_count,
        MIN(ar.submitted_at) as first_submission,
        MAX(ar.submitted_at) as last_submission,
        STRING_AGG(DISTINCT ar.submitted_by, ', ') as submitters
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.attendance_date, yp.settlement
      ORDER BY ar.attendance_date DESC, yp.settlement
    `);

    console.log(`   Submission Groups Found: ${completeCheck.rows.length}`);
    
    if (completeCheck.rows.length > 0) {
      let totalRecords = 0;
      const datesSeen = new Set();
      const settlementsSeen = new Set();

      console.log('\n   📊 DETAILED BREAKDOWN:');
      completeCheck.rows.forEach(record => {
        const date = record.attendance_date.toISOString().split('T')[0];
        datesSeen.add(date);
        settlementsSeen.add(record.settlement);
        totalRecords += parseInt(record.youth_count);
        
        console.log(`     ${date} - ${record.settlement}: ${record.youth_count} youth`);
        console.log(`       Submitted: ${record.first_submission.toISOString().split('T')[0]} by ${record.submitters}`);
      });

      console.log(`\n   📈 SUMMARY:`);
      console.log(`     Total Records: ${totalRecords}`);
      console.log(`     Unique Dates: ${datesSeen.size} (${Array.from(datesSeen).sort().join(', ')})`);
      console.log(`     Settlements: ${settlementsSeen.size} (${Array.from(settlementsSeen).join(', ')})`);

      // Generate expected dates
      const expectedDates = [];
      for (let day = 9; day <= 20; day++) {
        expectedDates.push(`2026-02-${day.toString().padStart(2, '0')}`);
      }
      
      const actualDatesArray = Array.from(datesSeen).sort();
      const missingDates = expectedDates.filter(date => !datesSeen.has(date));

      console.log(`\n   📅 DATE ANALYSIS:`);
      console.log(`     Expected: ${expectedDates.length} days (Feb 9-20)`);
      console.log(`     Found: ${actualDatesArray.length} days`);
      console.log(`     Coverage: ${Math.round((actualDatesArray.length / expectedDates.length) * 100)}%`);
      
      if (actualDatesArray.length > 0) {
        console.log(`     Present: ${actualDatesArray.join(', ')}`);
      }
      if (missingDates.length > 0) {
        console.log(`     Missing: ${missingDates.join(', ')}`);
      }

    } else {
      console.log('   ❌ NO mobile mapping data found for Feb 9-20');
    }

    // Check specifically for Huruma youth mentioned in screenshot
    console.log('\n👥 SCREENSHOT VERIFICATION - HURUMA YOUTH:');
    const hurumaYouth = ['HUR792SW', 'HUR773MN', 'HUR770AN', 'HUR788AW'];
    
    for (const youthId of hurumaYouth) {
      const youthCheck = await pool.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.program_type,
          ar.attendance_date,
          ar.submitted_at
        FROM youth_participants yp
        LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
          AND ar.attendance_date >= '2026-02-09'
          AND ar.attendance_date <= '2026-02-20'
        WHERE yp.youth_id = $1
        ORDER BY ar.attendance_date DESC
      `, [youthId]);

      if (youthCheck.rows.length > 0) {
        const youth = youthCheck.rows[0];
        console.log(`   ${youthId}: ${youth.full_name} (${youth.settlement}, ${youth.program_type})`);
        
        const attendanceRecords = youthCheck.rows.filter(r => r.attendance_date);
        if (attendanceRecords.length > 0) {
          console.log(`     Feb 9-20 Attendance: ${attendanceRecords.length} days`);
          attendanceRecords.forEach(record => {
            console.log(`       ${record.attendance_date.toISOString().split('T')[0]}: ${record.submitted_at.toISOString()}`);
          });
        } else {
          console.log(`     Feb 9-20 Attendance: None found`);
        }
      } else {
        console.log(`   ${youthId}: Not found in database`);
      }
    }

    console.log('\n🎯 CORRECTED ANALYSIS:');
    if (completeCheck.rows.length > 0) {
      console.log(`✅ Mobile mapping data EXISTS for multiple settlements and dates`);
      console.log(`🔍 Previous query was missing data - this corrected version finds it`);
    } else {
      console.log(`❌ Still no data found - may be data issue or query problem`);
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkMobileMappingDataProperly();
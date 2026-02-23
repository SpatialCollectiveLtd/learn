require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkMobileMappingFeb9to20AllSettlements() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 MOBILE MAPPING ATTENDANCE: ALL SETTLEMENTS FEB 9-20, 2026');
    console.log('='*60);

    // Check all mobile mapping attendance for Feb 9-20 across all settlements
    const allMobileMappingFeb9to20 = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.settlement,
        COUNT(*) as youth_count,
        ar.submitted_at::date as submitted_date,
        ar.submitted_by,
        sm.full_name as submitter_name
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      LEFT JOIN staff_members sm ON ar.submitted_by = sm.staff_id
      WHERE yp.program_type = 'mobile_mapping'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.attendance_date, yp.settlement, ar.submitted_at::date, ar.submitted_by, sm.full_name
      ORDER BY ar.attendance_date DESC, yp.settlement
    `);

    console.log(`\n📊 TOTAL ATTENDANCE RECORDS: ${allMobileMappingFeb9to20.rows.length} submission groups`);

    if (allMobileMappingFeb9to20.rows.length > 0) {
      // Group by date to see coverage
      const byDate = {};
      const bySettlement = {};
      let totalYouth = 0;

      allMobileMappingFeb9to20.rows.forEach(record => {
        const date = record.attendance_date.toISOString().split('T')[0];
        const settlement = record.settlement;
        
        if (!byDate[date]) {
          byDate[date] = { settlements: {}, total: 0 };
        }
        if (!bySettlement[settlement]) {
          bySettlement[settlement] = {};
        }
        
        byDate[date].settlements[settlement] = record.youth_count;
        byDate[date].total += record.youth_count;
        bySettlement[settlement][date] = record.youth_count;
        totalYouth += record.youth_count;
      });

      console.log(`\n📅 BREAKDOWN BY DATE (Total: ${totalYouth} attendance records):`);
      const sortedDates = Object.keys(byDate).sort();
      
      sortedDates.forEach(date => {
        const dateData = byDate[date];
        console.log(`\n   ${date}: ${dateData.total} youth total`);
        Object.keys(dateData.settlements).forEach(settlement => {
          console.log(`     ${settlement}: ${dateData.settlements[settlement]} youth`);
        });
      });

      console.log(`\n🏘️ BREAKDOWN BY SETTLEMENT:`);
      Object.keys(bySettlement).forEach(settlement => {
        const settlementData = bySettlement[settlement];
        const dates = Object.keys(settlementData);
        const totalForSettlement = Object.values(settlementData).reduce((a, b) => a + b, 0);
        
        console.log(`\n   ${settlement}: ${dates.length} days, ${totalForSettlement} total records`);
        dates.sort().forEach(date => {
          console.log(`     ${date}: ${settlementData[date]} youth`);
        });
      });

      // Expected dates vs actual dates
      console.log(`\n📋 DATE COVERAGE ANALYSIS:`);
      const expectedDates = [];
      for (let day = 9; day <= 20; day++) {
        expectedDates.push(`2026-02-${day.toString().padStart(2, '0')}`);
      }
      
      const actualDates = sortedDates;
      const missingDates = expectedDates.filter(date => !actualDates.includes(date));
      
      console.log(`   Expected Period: Feb 9-20, 2026 (${expectedDates.length} days)`);
      console.log(`   Actual Days with Data: ${actualDates.length} days`);
      console.log(`   Coverage: ${Math.round((actualDates.length / expectedDates.length) * 100)}%`);
      
      if (actualDates.length > 0) {
        console.log(`\n   ✅ DATES WITH ATTENDANCE DATA:`);
        actualDates.forEach(date => {
          console.log(`     ${date}: ${byDate[date].total} youth across ${Object.keys(byDate[date].settlements).length} settlements`);
        });
      }
      
      if (missingDates.length > 0) {
        console.log(`\n   ❌ MISSING DATES (${missingDates.length} days):`);
        missingDates.forEach(date => {
          console.log(`     ${date}: No attendance data`);
        });
      }

      // Detailed submission timeline
      console.log(`\n📈 SUBMISSION TIMELINE:`);
      allMobileMappingFeb9to20.rows.forEach(record => {
        console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.youth_count} ${record.settlement} youth`);
        console.log(`     Submitted: ${record.submitted_date} by ${record.submitter_name || record.submitted_by}`);
      });

    } else {
      console.log('\n❌ NO MOBILE MAPPING ATTENDANCE DATA FOUND for Feb 9-20, 2026');
    }

    // Check what DPW would see in API for mobile mapping
    console.log('\n🌐 API SIMULATION: What mobile mapping data exists in Feb 9-20?');
    
    const apiSimulation = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        
        -- Total attendance days
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), 0) as total_attendance_days,
        
        -- Feb 9-20 attendance days
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
            AND attendance_date >= '2026-02-09'
            AND attendance_date <= '2026-02-20'
        ), 0) as feb9to20_attendance_days
        
      FROM youth_participants yp
      WHERE yp.program_type = 'mobile_mapping'
        AND yp.is_active = TRUE
      ORDER BY yp.settlement, yp.youth_id
      LIMIT 10
    `);

    console.log(`\n   Sample Mobile Mapping Youth (showing 10):`);
    apiSimulation.rows.forEach(youth => {
      console.log(`     ${youth.youth_id} (${youth.settlement}): ${youth.total_attendance_days} total, ${youth.feb9to20_attendance_days} Feb 9-20 days`);
    });

    console.log('\n🎯 SUMMARY:');
    if (allMobileMappingFeb9to20.rows.length > 0) {
      const uniqueDates = [...new Set(allMobileMappingFeb9to20.rows.map(r => r.attendance_date.toISOString().split('T')[0]))];
      console.log(`✅ Mobile mapping has attendance data for ${uniqueDates.length} days between Feb 9-20`);
      console.log(`📊 Total attendance records: ${allMobileMappingFeb9to20.rows.reduce((sum, r) => sum + r.youth_count, 0)}`);
      console.log(`🏘️ Settlements with data: ${[...new Set(allMobileMappingFeb9to20.rows.map(r => r.settlement))].join(', ')}`);
      
      if (uniqueDates.length < 12) {
        console.log(`⚠️  Missing ${12 - uniqueDates.length} days from expected 12-day period (Feb 9-20)`);
      }
    } else {
      console.log(`❌ NO mobile mapping attendance data found for Feb 9-20 period`);
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkMobileMappingFeb9to20AllSettlements();
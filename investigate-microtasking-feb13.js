require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function investigateMicrotaskingData() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 INVESTIGATING MICROTASKING ATTENDANCE DATA');
    console.log('📅 Focus: Feb 13, 2026 - Kayole Soweto Microtasking\n');

    // Check database for Feb 13 microtasking attendance
    console.log('📊 DATABASE: Microtasking attendance Feb 13, 2026');
    const feb13Microtasking = await pool.query(`
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
      WHERE yp.program_type = 'microtasking'
        AND yp.settlement = 'Kayole Soweto'
        AND ar.attendance_date = '2026-02-13'
      ORDER BY ar.submitted_at DESC
    `);

    console.log(`   Records Found: ${feb13Microtasking.rows.length}`);
    
    if (feb13Microtasking.rows.length > 0) {
      console.log('\n👥 KAYOLE SOWETO MICROTASKING YOUTH (Feb 13):');
      feb13Microtasking.rows.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.youth_id} (${record.full_name})`);
        console.log(`      Submitted: ${record.submitted_at.toISOString()} by ${record.submitted_by}`);
      });
    } else {
      console.log('   ❌ NO RECORDS FOUND in database for Feb 13 microtasking Kayole Soweto');
    }

    // Test production API for microtasking
    console.log('\n🌐 TESTING PRODUCTION API FOR MICROTASKING:');
    
    try {
      const microtaskingUrl = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=microtasking';
      
      const response = await fetch(microtaskingUrl, {
        headers: {
          'X-API-Key': process.env.DPW_MANAGER_API_KEY
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        
        console.log(`   API Response: ${apiData.data.count} microtasking participants total`);
        
        // Filter for Kayole Soweto specifically
        const kayoleMicrotasking = apiData.data.participants.filter(p => 
          p.settlement === 'Kayole Soweto' && p.module === 'microtasking'
        );
        
        console.log(`   Kayole Soweto Microtasking: ${kayoleMicrotasking.length} participants`);
        
        // Check for Feb 13 attendance specifically 
        const withFeb13Attendance = kayoleMicrotasking.filter(p => {
          if (!p.attendance_history || p.attendance_history.length === 0) return false;
          return p.attendance_history.some(att => att.date === '2026-02-13');
        });
        
        console.log(`   With Feb 13 Attendance: ${withFeb13Attendance.length} participants`);
        
        if (withFeb13Attendance.length > 0) {
          console.log('\n   ✅ YOUTH WITH FEB 13 ATTENDANCE IN API:');
          withFeb13Attendance.slice(0, 10).forEach((youth, index) => {
            const feb13Record = youth.attendance_history.find(att => att.date === '2026-02-13');
            console.log(`     ${index + 1}. ${youth.youth_id} (${youth.full_name})`);
            console.log(`        Feb 13: submitted ${feb13Record.submitted_at.split('T')[1].split('.')[0]} by ${feb13Record.submitted_by}`);
          });
          
          if (withFeb13Attendance.length > 10) {
            console.log(`     ... and ${withFeb13Attendance.length - 10} more`);
          }
        }
        
        // Check if the specific youth from screenshot are in API
        console.log('\n🔍 CHECKING SPECIFIC YOUTH FROM SCREENSHOT:');
        const screenshotYouth = ['KAY1640JM', 'KAY1143IM', 'KAY1681JM'];
        
        screenshotYouth.forEach(youthId => {
          const youth = kayoleMicrotasking.find(p => p.youth_id === youthId);
          if (youth) {
            const feb13Att = youth.attendance_history ? 
              youth.attendance_history.find(att => att.date === '2026-02-13') : null;
            
            console.log(`   ${youthId}: ${youth ? 'Found' : 'Not Found'} in API`);
            if (feb13Att) {
              console.log(`     Feb 13 attendance: ${feb13Att.submitted_at} by ${feb13Att.submitted_by}`);
            } else {
              console.log(`     Feb 13 attendance: Not found in API`);
            }
          } else {
            console.log(`   ${youthId}: Not found in API`);
          }
        });
        
      } else {
        console.log(`   ❌ API call failed: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ API call error: ${error.message}`);
    }

    // Check if there are any filtering issues
    console.log('\n🔍 POTENTIAL FILTERING ISSUES:');
    
    // Check for inactive youth with Feb 13 attendance
    const inactiveWithAtt = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id  
      WHERE yp.program_type = 'microtasking'
        AND yp.settlement = 'Kayole Soweto'
        AND ar.attendance_date = '2026-02-13'
        AND yp.is_active = FALSE
    `);
    
    console.log(`   Inactive youth with Feb 13 attendance: ${inactiveWithAtt.rows[0].count}`);
    
    // Check for settlement name variations
    const settlementVariations = await pool.query(`
      SELECT DISTINCT yp.settlement, COUNT(*) as count
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.program_type = 'microtasking'
        AND ar.attendance_date = '2026-02-13'
        AND yp.settlement ILIKE '%Kayole%'
      GROUP BY yp.settlement
    `);
    
    console.log('\n   Settlement name variations for Feb 13:');
    settlementVariations.rows.forEach(row => {
      console.log(`     "${row.settlement}": ${row.count} records`);
    });

    console.log('\n🎯 DIAGNOSIS:');
    if (feb13Microtasking.rows.length === 43) {
      console.log('✅ Database has exactly 43 records matching screenshot');
      console.log('🔍 Need to verify why API may not return all of them');
    } else if (feb13Microtasking.rows.length > 0) {
      console.log(`⚠️  Database has ${feb13Microtasking.rows.length} records (screenshot shows 43)`);
      console.log('🤔 Possible data inconsistency or date/filter mismatch');
    } else {
      console.log('❌ No database records found - data may be in different module/settlement');
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

investigateMicrotaskingData();
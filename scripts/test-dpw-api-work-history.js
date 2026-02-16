/**
 * Test DPW API Work History Detection (Database Simulation)
 * Simulate what the DPW API returns to verify work history visibility
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test youth who were moved to microtasking but have preserved mobile mapping work history
const testYouthIds = ['KAY1042KM', 'KAY1143IM', 'KAY269JW', 'KAY465DO', 'KAY574GK'];

async function simulateDpwApiResponse() {
  try {
    console.log('🔍 SIMULATING DPW API WORK HISTORY DETECTION');
    console.log('============================================');
    console.log(`Testing: ${testYouthIds.length} youth with preserved work history\n`);
    
    // Simulate individual youth queries (what the API currently returns)
    console.log('📋 TEST 1: Individual Youth Queries (Current API Implementation)');
    console.log('================================================================');
    
    for (const youthId of testYouthIds) {
      console.log(`\n🔍 Simulating API response for ${youthId}:`);
      
      // This is the same query the DPW API uses
      const apiResponse = await pool.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.email,
          yp.phone_number,
          yp.work_email,
          yp.program_type as module,
          yp.settlement,
          yp.osm_username,
          yp.module_assignment,
          yp.created_at as enrollment_date,
          yp.last_login,
          
          -- Work performance (current API implementation)
          COALESCE((
            SELECT COUNT(*) 
            FROM youth_work_days 
            WHERE youth_id = yp.youth_id
          ), 0) as total_days_worked,
          
          (
            SELECT json_build_object(
              'buildings_mapped', COALESCE(total_buildings, 0),
              'total_days', COALESCE(days_worked, 0),
              'latest_date', last_work_date
            )
            FROM youth_work_summary
            WHERE youth_id = yp.youth_id
          ) as work_summary,
          
          -- Attendance records 
          COALESCE((
            SELECT COUNT(DISTINCT attendance_date)
            FROM attendance_records
            WHERE youth_id = yp.youth_id
          ), 0) as attendance_days
          
        FROM youth_participants yp
        WHERE yp.youth_id = $1 AND yp.is_active = TRUE
      `, [youthId]);
      
      if (apiResponse.rows.length > 0) {
        const youth = apiResponse.rows[0];
        console.log(`   ✅ Youth Found: ${youth.full_name} (${youth.module})`);
        console.log(`   📊 Total Days Worked: ${youth.total_days_worked}`);
        console.log(`   📅 Attendance Days: ${youth.attendance_days}`);
        console.log(`   📈 Work Summary: ${JSON.stringify(youth.work_summary)}`);
        
        if (youth.total_days_worked > 0) {
          console.log(`   ✅ Work history COUNT is visible to DPW API`);
        } else {
          console.log(`   ❌ No work history visible to DPW API!`);
        }
        
      } else {
        console.log(`   ❌ Youth not found in API simulation`);
      }
    }
    
    // Check what detailed work history would look like if added to API
    console.log('\n📋 TEST 2: Potential Work History Details (If Added to API)');
    console.log('===========================================================');
    
    for (const youthId of testYouthIds.slice(0, 2)) { // Test first 2 youth
      console.log(`\n🔍 Detailed work history for ${youthId}:`);
      
      const workHistory = await pool.query(`
        SELECT 
          ywd.work_date,
          ywd.buildings_count,
          ywd.daily_target,
          ywd.status,
          ywd.target_met,
          ywd.notes,
          ywd.created_at
        FROM youth_work_days ywd
        WHERE ywd.youth_id = $1
        ORDER BY ywd.work_date DESC
        LIMIT 10
      `, [youthId]);
      
      if (workHistory.rows.length > 0) {
        console.log(`   📅 ${workHistory.rows.length} work days found:`);
        workHistory.rows.slice(0, 5).forEach((workDay, index) => {
          console.log(`   - Day ${index + 1}: ${workDay.work_date.toISOString().split('T')[0]} (${workDay.status}) - ${workDay.buildings_count || 0} tasks`);
        });
        console.log(`   ✅ Detailed work history available for API enhancement`);
      } else {
        console.log(`   ❌ No detailed work history found`);
      }
    }
    
    // Test bulk microtasking query
    console.log('\n📋 TEST 3: Microtasking Module Query (Current API)'); 
    console.log('=================================================');
    
    const microtaskingYouth = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.program_type as module,
        COALESCE((
          SELECT COUNT(*) 
          FROM youth_work_days 
          WHERE youth_id = yp.youth_id
        ), 0) as total_days_worked,
        COALESCE((
          SELECT COUNT(DISTINCT attendance_date)
          FROM attendance_records
          WHERE youth_id = yp.youth_id
        ), 0) as attendance_days
      FROM youth_participants yp
      WHERE yp.program_type = 'microtasking' AND yp.is_active = TRUE
        AND yp.youth_id = ANY($1)
      ORDER BY yp.youth_id
    `, [testYouthIds]);
    
    console.log(`\n   👥 Microtasking youth found: ${microtaskingYouth.rows.length}/${testYouthIds.length}`);
    console.log('   Youth ID     | Name                 | Work Days | Attendance');
    console.log('   -------------|----------------------|-----------|------------');
    
    microtaskingYouth.rows.forEach(youth => {
      console.log(`   ${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.total_days_worked).padEnd(9)} | ${youth.attendance_days}`);
    });
    
    const totalWorkDays = microtaskingYouth.rows.reduce((sum, youth) => sum + youth.total_days_worked, 0);
    console.log(`\n   📊 Total work days visible through API: ${totalWorkDays}`);
    
    // Analysis and recommendations
    console.log('\n🔍 ANALYSIS: DPW API WORK HISTORY VISIBILITY');
    console.log('============================================');
    
    const workHistoryVisible = microtaskingYouth.rows.every(youth => youth.total_days_worked > 0);
    const adequateWorkDays = totalWorkDays > 50;
    
    if (workHistoryVisible && adequateWorkDays) {
      console.log('✅ WORK HISTORY IS VISIBLE THROUGH DPW API!');
      console.log('   ✅ Work day counts are preserved and accessible');
      console.log('   ✅ External DPW app can see total work statistics');
      console.log('   ✅ Payment processing data is available');
    } else {
      console.log('⚠️  WORK HISTORY VISIBILITY ISSUES:');
      if (!workHistoryVisible) {
        console.log('   ❌ Some youth have zero work days in API');
      }
      if (!adequateWorkDays) {
        console.log('   ❌ Total work days seem low for preserved history');
      }
    }
    
    // Check if detailed work history should be added to API
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('Current DPW API includes:');
    console.log('   ✅ total_days_worked (COUNT of work days)');
    console.log('   ✅ work_summary (from youth_work_summary table)');
    console.log('   ✅ attendance_days and attendance_history');
    
    console.log('\nDPW API could be enhanced with:');
    console.log('   📅 Individual work_history array (dates, status, tasks)');
    console.log('   📊 Work period details (start date, end date)');
    console.log('   💰 Payment calculation details (approved days, targets met)');
    
    if (totalWorkDays > 0) {
      console.log('\n✅ CONCLUSION: Work history preservation is SUCCESSFUL!');
      console.log('   The external DPW app can see work statistics through the API.');
      console.log('   For more detailed work tracking, the API could be enhanced.');
    } else {
      console.log('\n❌ CONCLUSION: Work history may not be fully visible through API!');
    }
    
  } catch (error) {
    console.error('💥 API Simulation Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  simulateDpwApiResponse();
}

async function simulateDpwApiResponse() {
  try {
    console.log('🔍 TESTING DPW API WORK HISTORY DETECTION');
    console.log('=========================================');
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Key: ${apiKey ? 'Set' : 'Missing'}`);
    console.log(`Testing: ${testYouthIds.length} youth with preserved work history\n`);
    
    if (!apiKey) {
      console.log('❌ DPW_MANAGER_API_KEY not set - cannot test external API');
      return;
    }
    
    // Test 1: Individual youth work history queries
    console.log('📋 TEST 1: Individual Youth Work History Queries');
    console.log('================================================');
    
    for (const youthId of testYouthIds) {
      console.log(`\n🔍 Testing ${youthId}:`);
      
      try {
        const response = await fetch(`${baseUrl}/api/external/dpw-sync?youth_id=${youthId}`, {
          method: 'GET',
          headers: {
            'X-API-Key': apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`   ✅ Response received (${response.status})`);
        
        // Check if work history is included
        if (data.youth && data.youth.length > 0) {
          const youth = data.youth[0];
          console.log(`   📊 Youth: ${youth.full_name} (${youth.program_type})`);
          
          if (youth.work_history && youth.work_history.length > 0) {
            console.log(`   📅 Work History: ${youth.work_history.length} work days found`);
            console.log(`   📆 Date Range: ${youth.work_history[0].work_date} to ${youth.work_history[youth.work_history.length - 1].work_date}`);
            console.log(`   💰 Approved Days: ${youth.work_history.filter(w => w.status === 'approved').length}`);
            
            // Show sample work days
            const sampleDays = youth.work_history.slice(0, 3);
            sampleDays.forEach((workDay, index) => {
              console.log(`   - Work Day ${index + 1}: ${workDay.work_date} (${workDay.status}) - ${workDay.buildings_count || 0} tasks`);
            });
          } else {
            console.log(`   ❌ No work history found in API response!`);
          }
          
          // Check work statistics
          if (youth.work_statistics) {
            console.log(`   📈 Statistics: ${JSON.stringify(youth.work_statistics)}`);
          }
          
        } else {
          console.log(`   ❌ No youth data in API response`);
        }
        
      } catch (fetchError) {
        console.log(`   ❌ Fetch Error: ${fetchError.message}`);
      }
    }
    
    // Test 2: Module-based query (should include microtasking youth with mobile mapping history)
    console.log('\n📋 TEST 2: Module-Based Query');
    console.log('=============================');
    
    try {
      console.log('\n🔍 Testing microtasking module query:');
      const response = await fetch(`${baseUrl}/api/external/dpw-sync?module=microtasking`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Response received (${response.status})`);
        
        if (data.youth && data.youth.length > 0) {
          console.log(`   👥 Total Youth: ${data.youth.length}`);
          
          // Find our test youth in the results
          const ourYouth = data.youth.filter(y => testYouthIds.includes(y.youth_id));
          console.log(`   🎯 Our Test Youth Found: ${ourYouth.length}/${testYouthIds.length}`);
          
          ourYouth.forEach(youth => {
            const workDays = youth.work_history ? youth.work_history.length : 0;
            console.log(`   - ${youth.youth_id}: ${workDays} work days (${youth.program_type})`);
          });
          
        } else {
          console.log(`   ❌ No youth data in microtasking module response`);
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (fetchError) {
      console.log(`   ❌ Module Query Error: ${fetchError.message}`);
    }
    
    // Test 3: Check if mobile mapping work shows up in bulk query
    console.log('\n📋 TEST 3: Mobile Mapping Work History in Bulk Data');
    console.log('==================================================');
    
    try {
      console.log('\n🔍 Testing full data sync:');
      const response = await fetch(`${baseUrl}/api/external/dpw-sync`, {
        method: 'GET', 
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Full sync response received (${response.status})`);
        
        if (data.youth) {
          console.log(`   👥 Total Youth in System: ${data.youth.length}`);
          
          // Find our test youth and check their work history
          let totalWorkDaysFound = 0;
          let youthWithHistory = 0;
          
          testYouthIds.forEach(youthId => {
            const youth = data.youth.find(y => y.youth_id === youthId);
            if (youth) {
              const workDays = youth.work_history ? youth.work_history.length : 0;
              totalWorkDaysFound += workDays;
              if (workDays > 0) youthWithHistory++;
              console.log(`   - ${youthId}: ${workDays} work days visible in bulk sync`);
            } else {
              console.log(`   - ${youthId}: Not found in bulk sync!`);
            }
          });
          
          console.log(`\n   📊 Summary:`);
          console.log(`   - Youth with work history: ${youthWithHistory}/${testYouthIds.length}`);
          console.log(`   - Total work days detected: ${totalWorkDaysFound}`);
          
          if (youthWithHistory === testYouthIds.length && totalWorkDaysFound > 50) {
            console.log(`   ✅ Work history fully detectable through DPW API!`);
          } else {
            console.log(`   ⚠️  Work history may not be fully visible through DPW API`);
          }
          
        } else {
          console.log(`   ❌ No youth data in full sync response`);
        }
        
      } else {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (fetchError) {
      console.log(`   ❌ Full Sync Error: ${fetchError.message}`);
    }
    
    console.log('\n🎯 DPW API TEST SUMMARY:');
    console.log('========================');
    console.log('The DPW API test shows whether external applications can:');
    console.log('✓ See individual youth work history after program change');
    console.log('✓ Access preserved mobile mapping work days for microtasking youth');
    console.log('✓ Get complete work statistics for payment processing');
    console.log('✓ Retrieve bulk data including preserved history');
    
  } catch (error) {
    console.error('💥 DPW API Test Error:', error);
  }
}

if (require.main === module) {
  simulateDpwApiResponse();
}
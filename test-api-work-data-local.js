require('dotenv').config({path: '.env.local'});
const http = require('http');

async function testLearnAPI() {
  try {
    console.log('🔍 TESTING LEARN API - WORK HISTORY DATA\n');

    // Test API key from environment
    const apiKey = process.env.DPW_MANAGER_API_KEY;
    if (!apiKey) {
      console.log('❌ No DPW_MANAGER_API_KEY found in environment');
      return;
    }

    console.log('✅ API Key found');

    // Function to make API request
    async function makeRequest(path) {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      };

      return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({
                statusCode: res.statusCode,
                data: JSON.parse(data)
              });
            } catch (e) {
              resolve({
                statusCode: res.statusCode,
                data: data,
                parseError: e.message
              });
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
    }

    // Test general API call first
    console.log('📡 Testing API endpoint: /api/external/dpw-sync');
    
    const response = await makeRequest('/api/external/dpw-sync?module=mobile_mapping');

    console.log(`📊 Response Status: ${response.statusCode}\n`);

    if (response.statusCode === 200) {
      const apiData = response.data;
      
      console.log('✅ API Response Structure:');
      console.log(`   Success: ${apiData.success}`);
      console.log(`   Timestamp: ${apiData.timestamp}`);
      console.log(`   Participant Count: ${apiData.data.count}`);
      
      if (apiData.data.participants.length > 0) {
        // Analyze work data across all participants
        const participants = apiData.data.participants;
        
        let withWorkSummary = 0;
        let withWorkHistory = 0;
        let withAttendance = 0;
        let totalWorkDays = 0;
        let totalBuildings = 0;
        
        console.log('\n🔍 ANALYZING WORK DATA ACROSS PARTICIPANTS:');
        console.log(`   Total Participants: ${participants.length}`);
        
        participants.forEach((p, index) => {
          if (p.work_summary && p.work_summary.buildings_mapped > 0) {
            withWorkSummary++;
            totalBuildings += p.work_summary.buildings_mapped;
          }
          if (p.work_history && p.work_history.length > 0) {
            withWorkHistory++;
            totalWorkDays += p.work_history.length;
          }
          if (p.attendance_history && p.attendance_history.length > 0) {
            withAttendance++;
          }
          
          // Show details for first few participants
          if (index < 3) {
            console.log(`\n📋 Participant ${index + 1}: ${p.youth_id} (${p.full_name})`);
            console.log(`   Module: ${p.module}`);
            console.log(`   Total Days Worked: ${p.total_days_worked}`);
            
            if (p.work_summary) {
              console.log(`   Work Summary - Buildings: ${p.work_summary.buildings_mapped}, Days: ${p.work_summary.total_days}`);
            } else {
              console.log('   Work Summary: null/empty');
            }
            
            if (p.work_history) {
              console.log(`   Work History: ${p.work_history.length} records`);
              if (p.work_history.length > 0) {
                const recent = p.work_history[0];
                console.log(`     Latest: ${recent.work_date} - ${recent.buildings_count} buildings (${recent.status})`);
              }
            } else {
              console.log('   Work History: null/empty');
            }
            
            console.log(`   Attendance Records: ${p.attendance_days} days`);
            console.log(`   Contract Signed: ${p.has_signed_contract}`);
          }
        });
        
        console.log('\n📈 WORK DATA SUMMARY:');
        console.log(`   Participants with Work Summary: ${withWorkSummary}/${participants.length}`);
        console.log(`   Participants with Work History: ${withWorkHistory}/${participants.length}`);
        console.log(`   Participants with Attendance: ${withAttendance}/${participants.length}`);
        console.log(`   Total Work Days Recorded: ${totalWorkDays}`);
        console.log(`   Total Buildings Mapped: ${totalBuildings}`);
        
        // Check if work data is missing for payment purposes
        const missingWorkData = participants.filter(p => 
          (!p.work_summary || p.work_summary.buildings_mapped === 0) && 
          (!p.work_history || p.work_history.length === 0)
        );
        
        console.log(`\n⚠️  PAYMENT DATA CONCERNS:`);
        console.log(`   Participants with NO work data: ${missingWorkData.length}/${participants.length}`);
        
        if (missingWorkData.length > 0) {
          console.log('   Youth with missing work data (first 10):');
          missingWorkData.slice(0, 10).forEach(p => {
            console.log(`     ${p.youth_id} (${p.full_name}) - ${p.module}`);
          });
          
          console.log('\n🚨 ISSUE IDENTIFIED:');
          console.log('   Some participants have no work history data for payments!');
          console.log('   This could prevent proper payment calculations.');
        } else {
          console.log('   ✅ All participants have work data available for payments');
        }
        
        // Test statistics data
        if (apiData.data.statistics && apiData.data.statistics.length > 0) {
          console.log('\n📊 STATISTICS DATA:');
          apiData.data.statistics.forEach(stat => {
            console.log(`   ${stat.module}: ${stat.total_participants} participants`);
            console.log(`     Days Worked: ${stat.total_days_worked}`);
            console.log(`     Buildings Mapped: ${stat.total_buildings_mapped}`);
          });
        }
        
      } else {
        console.log('⚠️  No participants returned from API');
      }
      
    } else if (response.statusCode === 401) {
      console.log('❌ Authentication Failed - Check API Key');
    } else {
      console.log('❌ API Request Failed:');
      console.log(`   Status: ${response.statusCode}`);
      if (response.parseError) {
        console.log(`   Parse Error: ${response.parseError}`);
        console.log(`   Raw Response: ${response.data}`);
      } else {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Check if work history data is complete for all participants');
    console.log('2. Ensure youth_work_days and youth_work_summary tables are populated');
    console.log('3. Verify payment system can access work_history and work_summary fields');
    console.log('4. Consider adding payment calculation fields to API if needed');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Development server may not be running. Start with: npm run dev');
    }
  }
}

testLearnAPI();
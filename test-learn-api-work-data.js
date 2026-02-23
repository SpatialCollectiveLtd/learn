require('dotenv').config({path: '.env.local'});
const https = require('https');

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

    // Test with a specific youth to see work history structure
    const testYouthId = 'KAY123'; // Let's try a sample youth
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/external/dpw-sync?youth_id=${testYouthId}`,
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    };

    console.log(`📡 Testing API endpoint: ${options.hostname}:${options.port}${options.path}`);
    console.log('🔑 Using API key authentication');

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });

    console.log(`📊 Response Status: ${response.statusCode}\n`);

    if (response.statusCode === 200) {
      const apiData = response.data;
      
      console.log('✅ API Response Structure:');
      console.log(`   Success: ${apiData.success}`);
      console.log(`   Timestamp: ${apiData.timestamp}`);
      console.log(`   Participant Count: ${apiData.data.count}`);
      
      if (apiData.data.participants.length > 0) {
        const participant = apiData.data.participants[0];
        
        console.log('\n📋 PARTICIPANT DATA STRUCTURE:');
        console.log('Basic Info:');
        console.log(`   Youth ID: ${participant.youth_id}`);
        console.log(`   Name: ${participant.full_name}`);
        console.log(`   Module: ${participant.module}`);
        console.log(`   Settlement: ${participant.settlement}`);
        
        console.log('\n💼 WORK HISTORY DATA:');
        console.log(`   Total Days Worked: ${participant.total_days_worked}`);
        
        if (participant.work_summary) {
          console.log('   Work Summary:');
          console.log(`     Buildings Mapped: ${participant.work_summary.buildings_mapped}`);
          console.log(`     Total Days: ${participant.work_summary.total_days}`);
          console.log(`     Latest Date: ${participant.work_summary.latest_date}`);
        } else {
          console.log('   ⚠️  Work Summary: null/missing');
        }
        
        if (participant.work_history && participant.work_history.length > 0) {
          console.log(`   Work History: ${participant.work_history.length} records`);
          console.log('   Sample Work Day:');
          const workDay = participant.work_history[0];
          console.log(`     Date: ${workDay.work_date}`);
          console.log(`     Buildings: ${workDay.buildings_count}`);
          console.log(`     Target: ${workDay.daily_target}`);
          console.log(`     Status: ${workDay.status}`);
          console.log(`     Target Met: ${workDay.target_met}`);
        } else {
          console.log('   ⚠️  Work History: Empty or missing');
        }
        
        console.log('\n📅 ATTENDANCE DATA:');
        console.log(`   Attendance Days: ${participant.attendance_days}`);
        if (participant.attendance_history && participant.attendance_history.length > 0) {
          console.log(`   Attendance Records: ${participant.attendance_history.length}`);
        } else {
          console.log('   ⚠️  Attendance History: Empty or missing');
        }
        
        console.log('\n📄 CONTRACT DATA:');
        console.log(`   Has Signed Contract: ${participant.has_signed_contract}`);
        console.log(`   Contract Date: ${participant.contract_signed_date || 'None'}`);
        
      } else {
        console.log('⚠️  No participants returned for test youth ID');
        
        // Try without filtering to see general structure
        console.log('\n🔄 Trying general API call without filters...');
        
        const generalOptions = { ...options };
        generalOptions.path = '/api/external/dpw-sync';
        
        const generalResponse = await new Promise((resolve, reject) => {
          const req = https.request(generalOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              try {
                resolve({
                  statusCode: res.statusCode,
                  data: JSON.parse(data)
                });
              } catch (e) {
                reject(e);
              }
            });
          });
          req.on('error', reject);
          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
          req.end();
        });
        
        if (generalResponse.statusCode === 200 && generalResponse.data.data.participants.length > 0) {
          console.log(`📊 Found ${generalResponse.data.data.count} participants in general query`);
          
          // Check work data availability across participants
          const participants = generalResponse.data.data.participants;
          let withWorkSummary = 0;
          let withWorkHistory = 0;
          let withAttendance = 0;
          
          participants.slice(0, 10).forEach(p => {
            if (p.work_summary && p.work_summary.buildings_mapped > 0) withWorkSummary++;
            if (p.work_history && p.work_history.length > 0) withWorkHistory++;  
            if (p.attendance_history && p.attendance_history.length > 0) withAttendance++;
          });
          
          console.log('\n📈 WORK DATA AVAILABILITY (first 10 participants):');
          console.log(`   With Work Summary Data: ${withWorkSummary}/10`);
          console.log(`   With Work History Data: ${withWorkHistory}/10`);
          console.log(`   With Attendance Data: ${withAttendance}/10`);
        }
      }
      
    } else {
      console.log('❌ API Request Failed:');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
}

testLearnAPI();
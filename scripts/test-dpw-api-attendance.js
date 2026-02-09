require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testDPWAPI() {
  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ DPW_MANAGER_API_KEY not found in .env.local');
    return;
  }

  console.log('\n🔍 TESTING DPW EXTERNAL API');
  console.log('='.repeat(80));
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);

  // Test function to call API
  async function callAPI(url, description) {
    return new Promise((resolve, reject) => {
      console.log(`\n\n📡 ${description}`);
      console.log(`   URL: ${url}`);
      console.log('-'.repeat(80));
      
      const options = {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Accept': 'application/json'
        }
      };

      https.get(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            console.log(`   Status: ${res.statusCode}`);
            
            if (json.success) {
              console.log(`   ✅ Success: ${json.data?.length || 0} participants`);
              
              // Check attendance data for the date range
              if (json.data && json.data.length > 0) {
                console.log('\n   📊 ATTENDANCE ANALYSIS (Jan 26 - Feb 6, 2026):');
                
                const dateRange = {
                  start: new Date('2026-01-26'),
                  end: new Date('2026-02-06')
                };
                
                let totalParticipants = 0;
                let participantsWithAttendance = 0;
                let participantsNoAttendance = 0;
                let participantsWithAttendanceInRange = 0;
                const settlementStats = {};
                const noAttendanceList = [];
                
                json.data.forEach(youth => {
                  totalParticipants++;
                  
                  const settlement = youth.settlement || 'Unknown';
                  if (!settlementStats[settlement]) {
                    settlementStats[settlement] = {
                      total: 0,
                      withAttendance: 0,
                      withAttendanceInRange: 0,
                      noAttendance: 0
                    };
                  }
                  settlementStats[settlement].total++;
                  
                  if (youth.attendance_history && Array.isArray(youth.attendance_history) && youth.attendance_history.length > 0) {
                    participantsWithAttendance++;
                    settlementStats[settlement].withAttendance++;
                    
                    // Check if they have attendance in the date range
                    const hasAttendanceInRange = youth.attendance_history.some(record => {
                      const recordDate = new Date(record.date);
                      return recordDate >= dateRange.start && recordDate <= dateRange.end;
                    });
                    
                    if (hasAttendanceInRange) {
                      participantsWithAttendanceInRange++;
                      settlementStats[settlement].withAttendanceInRange++;
                    }
                  } else {
                    participantsNoAttendance++;
                    settlementStats[settlement].noAttendance++;
                    noAttendanceList.push({
                      youth_id: youth.youth_id,
                      settlement: youth.settlement,
                      program_type: youth.module
                    });
                  }
                });
                
                console.log(`\n      Total Participants: ${totalParticipants}`);
                console.log(`      With Attendance (any date): ${participantsWithAttendance}`);
                console.log(`      With Attendance (Jan 26 - Feb 6): ${participantsWithAttendanceInRange}`);
                console.log(`      No Attendance Records: ${participantsNoAttendance}`);
                
                console.log('\n      📍 BY SETTLEMENT:');
                Object.entries(settlementStats).forEach(([settlement, stats]) => {
                  console.log(`         ${settlement}:`);
                  console.log(`            Total: ${stats.total}`);
                  console.log(`            With Attendance (any): ${stats.withAttendance}`);
                  console.log(`            With Attendance (Jan 26-Feb 6): ${stats.withAttendanceInRange}`);
                  console.log(`            No Attendance: ${stats.noAttendance}`);
                });
                
                // Sample attendance records
                if (json.data.length > 0) {
                  console.log('\n      📝 SAMPLE ATTENDANCE (First 3 with records):');
                  let sampleCount = 0;
                  for (const youth of json.data) {
                    if (youth.attendance_history && youth.attendance_history.length > 0 && sampleCount < 3) {
                      console.log(`\n         ${youth.youth_id} (${youth.settlement}):`);
                      console.log(`            Total Days: ${youth.attendance_days}`);
                      console.log(`            Latest 3 dates: ${youth.attendance_history.slice(0, 3).map(r => r.date.split('T')[0]).join(', ')}`);
                      sampleCount++;
                    }
                  }
                }
                
                // Show participants with no attendance
                if (noAttendanceList.length > 0) {
                  console.log(`\n      ⚠️  PARTICIPANTS WITH NO ATTENDANCE (${noAttendanceList.length} total):`);
                  noAttendanceList.slice(0, 10).forEach(youth => {
                    console.log(`         ${youth.youth_id} - ${youth.settlement} (${youth.program_type})`);
                  });
                  if (noAttendanceList.length > 10) {
                    console.log(`         ... and ${noAttendanceList.length - 10} more`);
                  }
                }
              }
              
              // Show summary stats
              if (json.summary) {
                console.log('\n   📈 SUMMARY STATS:');
                console.log(JSON.stringify(json.summary, null, 2));
              }
            } else {
              console.log(`   ❌ Failed: ${json.message}`);
            }
            
            resolve(json);
          } catch (error) {
            console.log(`   ❌ Error parsing response: ${error.message}`);
            console.log(`   Raw response: ${data.substring(0, 500)}`);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.log(`   ❌ Request failed: ${error.message}`);
        reject(error);
      });
    });
  }

  try {
    // Test 1: Get all mobile mapping data
    await callAPI(
      'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping',
      'MOBILE MAPPING PARTICIPANTS'
    );
    
    // Test 2: Get digitization data
    await callAPI(
      'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=digitization',
      'DIGITIZATION PARTICIPANTS'
    );
    
    // Test 3: Get specific youth
    await callAPI(
      'https://learn.spatialcollective.co.ke/api/external/dpw-sync?youth_id=KAY009MM',
      'SPECIFIC YOUTH (KAY009MM)'
    );

    console.log('\n' + '='.repeat(80));
    console.log('✅ DPW API TEST COMPLETE');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
}

testDPWAPI();

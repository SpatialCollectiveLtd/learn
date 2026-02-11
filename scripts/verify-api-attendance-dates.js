require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function checkAttendanceDateRange() {
  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  
  console.log('\n📅 CHECKING ATTENDANCE FOR JAN 26 - FEB 6, 2026');
  console.log('='.repeat(80));

  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    };

    https.get('https://learn.spatialcollective.co.ke/api/external/dpw-sync', options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (!json.success || !json.data || !json.data.participants) {
            console.log('❌ API returned unexpected format');
            console.log(JSON.stringify(json, null, 2));
            resolve();
            return;
          }

          const participants = json.data.participants;
          const targetStart = new Date('2026-01-26');
          const targetEnd = new Date('2026-02-06');

          console.log(`\n📊 TOTAL PARTICIPANTS: ${participants.length}`);
          console.log(`🎯 TARGET DATE RANGE: Jan 26 - Feb 6, 2026`);
          console.log('='.repeat(80));

          let totalWithAttendance = 0;
          let totalInDateRange = 0;
          let totalNoAttendance = 0;
          const settlementStats = {};
          const sampleRecords = [];

          participants.forEach(youth => {
            const settlement = youth.settlement || 'Unknown';
            const program = youth.module || 'unknown';
            
            if (!settlementStats[settlement]) {
              settlementStats[settlement] = {
                total: 0,
                withAttendance: 0,
                inDateRange: 0,
                noAttendance: 0,
                mobile_mapping: 0,
                digitization: 0
              };
            }
            
            settlementStats[settlement].total++;
            if (program === 'mobile_mapping') settlementStats[settlement].mobile_mapping++;
            if (program === 'digitization') settlementStats[settlement].digitization++;

            if (youth.attendance_history && Array.isArray(youth.attendance_history) && youth.attendance_history.length > 0) {
              totalWithAttendance++;
              settlementStats[settlement].withAttendance++;

              // Check dates in range
              const datesInRange = youth.attendance_history.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= targetStart && recordDate <= targetEnd;
              });

              if (datesInRange.length > 0) {
                totalInDateRange++;
                settlementStats[settlement].inDateRange++;
                
                if (sampleRecords.length < 5) {
                  sampleRecords.push({
                    youth_id: youth.youth_id,
                    settlement: youth.settlement,
                    program: youth.module,
                    days_in_range: datesInRange.length,
                    dates: datesInRange.map(r => r.date.split('T')[0]).join(', ')
                  });
                }
              }
            } else {
              totalNoAttendance++;
              settlementStats[settlement].noAttendance++;
            }
          });

          console.log('\n📈 OVERALL STATISTICS:');
          console.log(`   Total Participants: ${participants.length}`);
          console.log(`   With Attendance (any date): ${totalWithAttendance}`);
          console.log(`   With Attendance (Jan 26-Feb 6): ${totalInDateRange}`);
          console.log(`   No Attendance Records: ${totalNoAttendance}`);

          console.log('\n\n🏘️  BY SETTLEMENT:');
          Object.entries(settlementStats).sort().forEach(([settlement, stats]) => {
            console.log(`\n   ${settlement.toUpperCase()}:`);
            console.log(`      Total: ${stats.total} (MM: ${stats.mobile_mapping}, Digi: ${stats.digitization})`);
            console.log(`      With Attendance (any): ${stats.withAttendance}`);
            console.log(`      With Attendance (Jan 26-Feb 6): ${stats.inDateRange}`);
            console.log(`      No Attendance: ${stats.noAttendance}`);
          });

          console.log('\n\n📝 SAMPLE RECORDS WITH JAN 26-FEB 6 ATTENDANCE:');
          sampleRecords.forEach(record => {
            console.log(`\n   ${record.youth_id} (${record.settlement} - ${record.program}):`);
            console.log(`      Days in range: ${record.days_in_range}`);
            console.log(`      Dates: ${record.dates}`);
          });

          console.log('\n\n' + '='.repeat(80));
          if (totalInDateRange > 0) {
            console.log(`✅ API HAS ATTENDANCE DATA FOR JAN 26 - FEB 6`);
            console.log(`   ${totalInDateRange} participants with ${totalInDateRange} attendance records`);
          } else {
            console.log(`❌ NO ATTENDANCE DATA FOUND FOR JAN 26 - FEB 6`);
          }
          console.log('='.repeat(80) + '\n');

          resolve();
        } catch (error) {
          console.log('❌ Error:', error.message);
          console.log('Raw response:', data.substring(0, 500));
          resolve();
        }
      });
    }).on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve();
    });
  });
}

checkAttendanceDateRange();

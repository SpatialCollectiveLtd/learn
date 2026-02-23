require('dotenv').config({path: '.env.local'});

async function checkWorkDataAPI() {
  try {
    console.log('🔍 CHECKING LEARN API WORK DATA FOR PAYMENTS\n');

    const apiKey = process.env.DPW_MANAGER_API_KEY;
    const baseUrl = 'https://learn.spatialcollective.co.ke';
    
    if (!apiKey) {
      console.log('❌ No API key found');
      return;
    }

    console.log('API Key:', apiKey.substring(0, 20) + '...');
    console.log('Base URL:', baseUrl);

    // Test with a mobile mapping youth who might have work data
    const testUrl = `${baseUrl}/api/external/dpw-sync?youth_id=KAY098JO`;
    
    console.log('\n📡 Testing specific mobile mapping youth...');
    console.log('URL:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      
      console.log('\n✅ API Response:');
      console.log('Success:', data.success);
      console.log('Count:', data.data.count);
      
      if (data.data.participants.length > 0) {
        const participant = data.data.participants[0];
        
        console.log('\n📋 PARTICIPANT DETAILS:');
        console.log('Youth ID:', participant.youth_id);
        console.log('Name:', participant.full_name);
        console.log('Module:', participant.module);
        console.log('Settlement:', participant.settlement);
        
        console.log('\n💼 WORK DATA ANALYSIS:');
        console.log('Total Days Worked:', participant.total_days_worked);
        console.log('Has Signed Contract:', participant.has_signed_contract);
        
        console.log('\n📊 Work Summary:');
        if (participant.work_summary) {
          console.log('  Buildings Mapped:', participant.work_summary.buildings_mapped);
          console.log('  Total Days:', participant.work_summary.total_days);
          console.log('  Latest Date:', participant.work_summary.latest_date);
        } else {
          console.log('  ❌ Work Summary: null/missing');
        }
        
        console.log('\n📝 Work History:');
        if (participant.work_history && Array.isArray(participant.work_history)) {
          console.log(`  Records Count: ${participant.work_history.length}`);
          
          if (participant.work_history.length > 0) {
            console.log('  Sample Work Days:');
            participant.work_history.slice(0, 3).forEach((day, index) => {
              console.log(`    ${index + 1}. Date: ${day.work_date}`);
              console.log(`       Buildings: ${day.buildings_count}`);
              console.log(`       Target: ${day.daily_target}`);
              console.log(`       Status: ${day.status}`);
              console.log(`       Target Met: ${day.target_met}`);
            });
          } else {
            console.log('  ⚠️  Empty work history array');
          }
        } else {
          console.log('  ❌ Work History: null/missing or not array');
          console.log('  Type:', typeof participant.work_history);
          console.log('  Value:', participant.work_history);
        }
        
        console.log('\n📅 Attendance Data:');
        console.log('Attendance Days:', participant.attendance_days);
        if (participant.attendance_history && Array.isArray(participant.attendance_history)) {
          console.log(`Attendance Records: ${participant.attendance_history.length}`);
          if (participant.attendance_history.length > 0) {
            console.log('Latest Attendance:', participant.attendance_history[0].date);
          }
        } else {
          console.log('❌ Attendance History: null/missing or not array');
        }
        
        console.log('\n🔍 PAYMENT DATA ASSESSMENT:');
        
        const hasWorkSummary = participant.work_summary && participant.work_summary.buildings_mapped > 0;
        const hasWorkHistory = participant.work_history && participant.work_history.length > 0;
        const hasContract = participant.has_signed_contract;
        
        console.log('✓ Work Summary Available:', hasWorkSummary ? '✅' : '❌');
        console.log('✓ Work History Available:', hasWorkHistory ? '✅' : '❌');
        console.log('✓ Contract Signed:', hasContract ? '✅' : '❌');
        
        if (!hasWorkSummary && !hasWorkHistory) {
          console.log('\n🚨 PAYMENT ISSUE IDENTIFIED:');
          console.log('This participant has NO work data for payment calculations!');
          console.log('- No work summary (buildings mapped = 0 or null)');
          console.log('- No work history records');
          console.log('- Payment system cannot calculate earnings');
        } else {
          console.log('\n✅ Payment data looks available');
        }
        
      } else {
        console.log('❌ No participant found for test ID');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status);
      console.log('Response:', errorText);
    }

    // Test a few more mobile mapping youth
    console.log('\n🔍 Testing multiple mobile mapping youth for work data patterns...');
    
    const testResponse = await fetch(`${baseUrl}/api/external/dpw-sync?module=mobile_mapping`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      
      const participants = testData.data.participants;
      let withWorkData = 0;
      let withoutWorkData = 0;
      let withContractButNoWork = 0;
      
      participants.forEach(p => {
        const hasWork = (p.work_summary && p.work_summary.buildings_mapped > 0) || 
                       (p.work_history && p.work_history.length > 0);
        
        if (hasWork) {
          withWorkData++;
        } else {
          withoutWorkData++;
          if (p.has_signed_contract) {
            withContractButNoWork++;
          }
        }
      });
      
      console.log('\n📊 MOBILE MAPPING WORK DATA ANALYSIS:');
      console.log(`Total Mobile Mapping Youth: ${participants.length}`);
      console.log(`With Work Data: ${withWorkData}`);
      console.log(`Without Work Data: ${withoutWorkData}`);
      console.log(`Have Contract but No Work Data: ${withContractButNoWork}`);
      console.log('\n🚨 CRITICAL FINDING:');
      
      if (withContractButNoWork > 0) {
        console.log(`${withContractButNoWork} youth have signed contracts but NO work data!`);
        console.log('This prevents payment calculations and is a critical issue.');
        
        console.log('\nSample youth with contract but no work data:');
        participants
          .filter(p => p.has_signed_contract && 
                      (!p.work_summary || p.work_summary.buildings_mapped === 0) &&
                      (!p.work_history || p.work_history.length === 0))
          .slice(0, 5)
          .forEach(p => {
            console.log(`  ${p.youth_id} (${p.full_name})`);
          });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkWorkDataAPI();
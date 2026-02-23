require('dotenv').config({path: '.env.local'});

async function testProductionAPISpecific() {
  console.log('🌐 TESTING PRODUCTION API SPECIFICALLY FOR FEB 9-20 DATA');
  console.log('🎯 Focus: KAY098JO attendance in production API vs database\n');

  try {
    // Test production API for specific youth
    const testUrl = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?youth_id=KAY098JO';
    
    console.log(`📡 Calling: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'X-API-Key': process.env.DPW_MANAGER_API_KEY
      }
    });

    if (response.ok) {
      const apiData = await response.json();
      
      console.log('✅ PRODUCTION API RESPONSE:');
      console.log(`   API Version: ${apiData.api_version || 'v1.0'}`);
      console.log(`   Participants Found: ${apiData.data.count}`);
      console.log(`   Response Time: ${new Date().toISOString()}`);
      
      if (apiData.data.participants.length > 0) {
        const kay098 = apiData.data.participants[0];
        
        console.log(`\n👤 KAY098JO PRODUCTION API DATA:`);
        console.log(`   Youth ID: ${kay098.youth_id}`);
        console.log(`   Full Name: ${kay098.full_name}`);
        console.log(`   Module: ${kay098.module}`);
        console.log(`   Settlement: ${kay098.settlement}`);
        console.log(`   Total Attendance Days: ${kay098.attendance_days}`);
        console.log(`   Payment Data: ${JSON.stringify(kay098.payment_data || 'Not available', null, 2)}`);
        
        if (kay098.attendance_history && kay098.attendance_history.length > 0) {
          console.log(`\n📅 ATTENDANCE HISTORY FROM PRODUCTION API (${kay098.attendance_history.length} records):`);
          
          // Check for Feb 9-20 specifically
          const feb9to20 = kay098.attendance_history.filter(att => {
            const date = att.date;
            return date >= '2026-02-09' && date <= '2026-02-20';
          });
          
          console.log(`   🎯 Feb 9-20 Records Found: ${feb9to20.length}`);
          
          if (feb9to20.length > 0) {
            console.log('   ✅ Feb 9-20 Attendance Records:');
            feb9to20.forEach(att => {
              console.log(`     ${att.date}: submitted ${att.submitted_at.split('T')[0]} by ${att.submitted_by}`);
            });
          } else {
            console.log('   ❌ NO Feb 9-20 records in API response');
          }
          
          // Show all recent records for comparison
          console.log('\n   📋 Recent Records (first 10):');
          kay098.attendance_history.slice(0, 10).forEach(att => {
            console.log(`     ${att.date}: submitted ${att.submitted_at.split('T')[0]} by ${att.submitted_by}`);
          });
          
        } else {
          console.log('   ❌ NO attendance_history in API response');
        }
        
      } else {
        console.log('   ❌ NO participants found for KAY098JO');
      }
      
    } else {
      console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }

    // Test broader mobile mapping query
    console.log('\n🔍 TESTING MOBILE MAPPING MODULE QUERY:');
    const moduleUrl = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping';
    
    const moduleResponse = await fetch(moduleUrl, {
      headers: {
        'X-API-Key': process.env.DPW_MANAGER_API_KEY
      }
    });

    if (moduleResponse.ok) {
      const moduleData = await moduleResponse.json();
      
      console.log(`   Mobile Mapping Participants: ${moduleData.data.count}`);
      
      if (moduleData.data.statistics && moduleData.data.statistics.length > 0) {
        const stats = moduleData.data.statistics[0];
        console.log(`   Statistics:`);
        console.log(`     Total Days Worked: ${stats.total_days_worked}`);
        console.log(`     Total Attendance Records: ${stats.total_attendance_records}`);
        console.log(`     Buildings Mapped: ${stats.total_buildings_mapped}`);
        
        if (stats.payment_gap_count !== undefined) {
          console.log(`     Payment Gap Count: ${stats.payment_gap_count}`);
          console.log(`     Total Earnings Potential: KES ${stats.total_earnings_potential_kes?.toLocaleString() || 'N/A'}`);
        }
      }
      
      // Check a few example youth for Feb 9-20 data
      console.log('\n   🔍 Sample Youth Feb 9-20 Check:');
      const sampleYouth = moduleData.data.participants.slice(0, 3);
      
      sampleYouth.forEach(youth => {
        const feb9to20Count = youth.attendance_history ? 
          youth.attendance_history.filter(att => att.date >= '2026-02-09' && att.date <= '2026-02-20').length : 0;
        console.log(`     ${youth.youth_id}: ${youth.attendance_days} total days, ${feb9to20Count} Feb 9-20 days`);
      });
      
    } else {
      console.log(`❌ Module query failed: ${moduleResponse.status}`);
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('If production API shows Feb 9-20 data → DPW issue is elsewhere');
    console.log('If production API missing Feb 9-20 data → API deployment/caching issue');

  } catch (error) {
    console.error('❌ Production API test failed:', error.message);
    console.log('\n🔄 Trying alternative diagnosis...');
    
    // Fallback: Check if it's a deployment issue
    console.log('💡 POSSIBLE CAUSES:');
    console.log('1. API not deployed to production (still running old version)');
    console.log('2. Database connection differences (local vs production)');
    console.log('3. Caching layer preventing update visibility');
    console.log('4. Environment variable differences');
  }
}

testProductionAPISpecific();
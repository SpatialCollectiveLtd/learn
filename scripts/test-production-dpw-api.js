// Test Production DPW API
// Tests the live production endpoint at learn.spatialcollective.co.ke

require('dotenv').config({ path: '.env.local' });

async function testProductionAPI() {
  console.log('🌐 Testing PRODUCTION DPW API');
  console.log('================================\n');

  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  const PROD_URL = 'https://learn.spatialcollective.co.ke';
  
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : '❌ NOT SET'}`);
  console.log(`Production URL: ${PROD_URL}\n`);

  if (!API_KEY) {
    console.error('❌ DPW_MANAGER_API_KEY not set in .env.local');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Test 1: No filters (all participants)',
      url: `${PROD_URL}/api/external/dpw-sync`,
    },
    {
      name: 'Test 2: Filter by module=mobile_mapping',
      url: `${PROD_URL}/api/external/dpw-sync?module=mobile_mapping`,
    },
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${test.name}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`URL: ${test.url}\n`);

    try {
      const headers = { 'X-API-Key': API_KEY };
      const startTime = Date.now();
      
      const response = await fetch(test.url, { headers });
      const duration = Date.now() - startTime;

      console.log(`✓ Status: ${response.status} ${response.statusText}`);
      console.log(`✓ Response Time: ${duration}ms`);
      console.log(`✓ Content-Type: ${response.headers.get('content-type')}\n`);

      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        
        if (json.success === false) {
          console.log('❌ ERROR RESPONSE:');
          console.log(JSON.stringify(json, null, 2));
        } else if (json.data) {
          console.log('✅ SUCCESS:');
          console.log(`   Participants: ${json.data.count}`);
          console.log(`   Timestamp: ${json.timestamp}\n`);
          
          if (json.data.statistics) {
            console.log('   📊 Statistics:');
            json.data.statistics.forEach(stat => {
              console.log(`      ${stat.module}: ${stat.total_participants} youth, ${stat.total_days_worked} days, ${stat.total_buildings_mapped} buildings`);
            });
          }

          if (json.data.participants && json.data.participants.length > 0) {
            console.log(`\n   👤 First 2 participants:`);
            json.data.participants.slice(0, 2).forEach((p, i) => {
              console.log(`      ${i+1}. ${p.youth_id} - ${p.full_name}`);
              console.log(`         Module: ${p.module}, Settlement: ${p.settlement}`);
              console.log(`         Attendance: ${p.attendance_days} days, Work: ${p.total_days_worked} days`);
            });
          }
        } else {
          console.log('⚠️ UNEXPECTED FORMAT:');
          console.log(JSON.stringify(json, null, 2).substring(0, 1000));
        }

      } catch (parseError) {
        console.log('❌ NOT JSON (showing first 500 chars):');
        console.log(text.substring(0, 500));
      }

    } catch (error) {
      console.error('❌ REQUEST FAILED:');
      console.error(`   ${error.message}`);
      if (error.cause) {
        console.error(`   Cause: ${JSON.stringify(error.cause, null, 2)}`);
      }
    }
  }

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('✅ Production API test complete\n');
}

testProductionAPI();

// Test DPW API - Comprehensive Diagnostic
// Tests the /api/external/dpw-sync endpoint with various scenarios

require('dotenv').config({ path: '.env.local' });

async function testDPWAPI() {
  console.log('🧪 DPW API Comprehensive Test');
  console.log('===============================\n');

  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  const BASE_URL = 'http://localhost:3001'; // Dev server is on 3001
  
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : '❌ NOT SET'}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  if (!API_KEY) {
    console.error('❌ DPW_MANAGER_API_KEY not set in .env.local');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Test 1: No filters (all participants)',
      url: `${BASE_URL}/api/external/dpw-sync`,
      description: 'Should return all active participants'
    },
    {
      name: 'Test 2: Filter by module=mobile_mapping',
      url: `${BASE_URL}/api/external/dpw-sync?module=mobile_mapping`,
      description: 'Should return only mobile mapping participants'
    },
    {
      name: 'Test 3: Filter by module=digitization',
      url: `${BASE_URL}/api/external/dpw-sync?module=digitization`,
      description: 'Should return only digitization participants'
    },
    {
      name: 'Test 4: Filter by specific youth_id',
      url: `${BASE_URL}/api/external/dpw-sync?youth_id=HUR185RN`,
      description: 'Should return single participant (Richard Njuguna)'
    },
    {
      name: 'Test 5: Invalid API key',
      url: `${BASE_URL}/api/external/dpw-sync`,
      description: 'Should return 401 Unauthorized',
      invalidKey: true
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${test.name}`);
    console.log(`${test.description}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`URL: ${test.url}\n`);

    try {
      const headers = {
        'X-API-Key': test.invalidKey ? 'invalid-key-12345' : API_KEY
      };

      const startTime = Date.now();
      const response = await fetch(test.url, { headers });
      const duration = Date.now() - startTime;

      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response Time: ${duration}ms`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);

      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        
        // Pretty print the response
        if (json.success === false) {
          console.log('\n❌ Error Response:');
          console.log(JSON.stringify(json, null, 2));
        } else if (json.data) {
          console.log('\n✅ Success Response:');
          console.log(`   Participants Count: ${json.data.count}`);
          console.log(`   Timestamp: ${json.timestamp}`);
          
          if (json.data.statistics && json.data.statistics.length > 0) {
            console.log('\n   Statistics:');
            json.data.statistics.forEach(stat => {
              console.log(`     ${stat.module}:`);
              console.log(`       Total: ${stat.total_participants}`);
              console.log(`       Logged in: ${stat.logged_in_count}`);
              console.log(`       Days worked: ${stat.total_days_worked}`);
              console.log(`       Buildings: ${stat.total_buildings_mapped}`);
            });
          }

          if (json.data.participants && json.data.participants.length > 0) {
            console.log('\n   Sample Participant (first):');
            const first = json.data.participants[0];
            console.log(`     ID: ${first.youth_id}`);
            console.log(`     Name: ${first.full_name}`);
            console.log(`     Module: ${first.module}`);
            console.log(`     Settlement: ${first.settlement}`);
            console.log(`     Attendance Days: ${first.attendance_days}`);
            console.log(`     Attendance History Length: ${Array.isArray(first.attendance_history) ? first.attendance_history.length : 'N/A'}`);
            console.log(`     Work Days: ${first.total_days_worked}`);
            console.log(`     Training Completed: ${JSON.stringify(first.training_progress)}`);
          }

          // Show filters applied
          if (json.data.filters_applied) {
            console.log('\n   Filters Applied:');
            console.log(`     Youth ID: ${json.data.filters_applied.youth_id || 'none'}`);
            console.log(`     Module: ${json.data.filters_applied.module || 'none'}`);
          }
        } else {
          console.log('\n⚠️ Unexpected Response Format:');
          console.log(JSON.stringify(json, null, 2));
        }

      } catch (parseError) {
        console.log('\n⚠️ Response is not JSON:');
        console.log(text.substring(0, 500));
      }

    } catch (error) {
      console.error('\n❌ Request Failed:');
      console.error(`   Error: ${error.message}`);
      console.error(`   Type: ${error.constructor.name}`);
      if (error.cause) {
        console.error(`   Cause: ${error.cause}`);
      }
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log('All tests completed. Review results above.\n');
}

testDPWAPI();

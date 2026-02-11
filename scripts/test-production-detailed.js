require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function detailedProductionTest() {
  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  
  console.log('\n🔍 DETAILED PRODUCTION API TEST');
  console.log('='.repeat(80));

  // Helper to make API calls
  async function callAPI(url, description, headers = {}) {
    return new Promise((resolve) => {
      console.log(`\n📡 ${description}`);
      console.log(`   ${url}`);
      console.log('-'.repeat(80));
      
      const options = {
        method: 'GET',
        headers: {
          ...headers,
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
            console.log(`   Response:`, JSON.stringify(json, null, 2).substring(0, 1000));
            resolve({ status: res.statusCode, data: json });
          } catch (error) {
            console.log(`   ❌ Parse Error: ${error.message}`);
            console.log(`   Raw: ${data.substring(0, 500)}`);
            resolve({ status: res.statusCode, error: error.message });
          }
        });
      }).on('error', (error) => {
        console.log(`   ❌ Request Error: ${error.message}`);
        resolve({ error: error.message });
      });
    });
  }

  try {
    // Test 1: Version
    console.log('\n🔍 TEST 1: VERSION CHECK');
    const version = await callAPI(
      'https://learn.spatialcollective.co.ke/api/version',
      'Version Endpoint'
    );

    // Test 2: Health with DB check
    console.log('\n🔍 TEST 2: HEALTH & DATABASE');
    const health = await callAPI(
      'https://learn.spatialcollective.co.ke/api/health',
      'Health Check'
    );

    // Test 3: Debug endpoint
    console.log('\n🔍 TEST 3: DEBUG INFO');
    const debug = await callAPI(
      'https://learn.spatialcollective.co.ke/api/debug',
      'Debug Endpoint',
      { 'X-API-Key': API_KEY }
    );

    // Test 4: DPW API without filters (all data)
    console.log('\n🔍 TEST 4: DPW API - ALL DATA');
    const allData = await callAPI(
      'https://learn.spatialcollective.co.ke/api/external/dpw-sync',
      'All Participants',
      { 'X-API-Key': API_KEY }
    );

    // Test 5: DPW API with mobile_mapping filter
    console.log('\n🔍 TEST 5: DPW API - MOBILE MAPPING');
    const mmData = await callAPI(
      'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping',
      'Mobile Mapping Participants',
      { 'X-API-Key': API_KEY }
    );

    // Test 6: Test API endpoint
    console.log('\n🔍 TEST 6: TEST ENDPOINT (DB QUERY)');
    const testEndpoint = await callAPI(
      'https://learn.spatialcollective.co.ke/api/test',
      'Test Endpoint with DB Query'
    );

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Version: ${version.data?.commit || 'Unknown'}`);
    console.log(`Database Connected: ${debug.data?.database?.connected || 'Unknown'}`);
    
    // Check both possible response structures
    const allCount = allData.data?.data?.participants?.length || allData.data?.data?.length || 0;
    const mmCount = mmData.data?.data?.participants?.length || mmData.data?.data?.length || 0;
    
    console.log(`DPW API All: ${allCount} participants`);
    console.log(`DPW API MM: ${mmCount} participants`);
    console.log('='.repeat(80));

    // Diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    if (version.data?.commit === '134da92') {
      console.log('   ⚠️  DEPLOYMENT NOT UPDATED - Still on old commit 134da92');
      console.log('   📝 Expected commit: 13fdaa8 or newer');
      console.log('   💡 Check Vercel dashboard for deployment status');
      console.log('');
      if (allCount > 0) {
        console.log('   ✅ BUT: API IS RETURNING DATA (' + allCount + ' participants)');
        console.log('   📝 Old deployment has working attendance data');
      }
    } else if (allCount === 0) {
      console.log('   ⚠️  API RETURNS 0 PARTICIPANTS');
      console.log('   📝 Database query might be failing');
      console.log('   💡 Check environment variables and database connection');
    } else {
      console.log('   ✅ API appears to be working correctly');
      console.log(`   📊 Returning ${allCount} participants with attendance data`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
}

detailedProductionTest();

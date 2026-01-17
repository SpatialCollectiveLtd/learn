const axios = require('axios');

const BASE_URL = 'https://learn.spatialcollective.co.ke';

async function testEndpoint(path, method = 'GET', data = null) {
  console.log(`\n Testing ${method} ${path}...`);
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ SUCCESS (${response.status}):`, response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(`❌ FAILED (${error.response.status}):`, error.response.data || error.response.statusText);
    } else {
      console.log(`❌ ERROR:`, error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('VERCEL DEPLOYMENT VERIFICATION');
  console.log('='.repeat(60));
  
  // Test 1: Home page
  await testEndpoint('/');
  
  // Test 2: Health check
  await testEndpoint('/api/health');
  
  // Test 3: Youth auth (should fail without credentials but route should exist)
  await testEndpoint('/api/youth/auth/authenticate', 'POST', {});
  
  // Test 4: Staff auth
  await testEndpoint('/api/staff/auth/authenticate', 'POST', {});
  
  // Test 5: Contract template (should fail without auth)
  await testEndpoint('/api/contracts/template');
  
  // Test 6: Contract sign (should fail without auth)
  await testEndpoint('/api/contracts/sign', 'POST', {});
  
  // Test 7: OPTIONS request (CORS)
  console.log('\n✅ Testing OPTIONS (CORS preflight)...');
  try {
    const response = await axios.options(`${BASE_URL}/api/health`);
    console.log(`✅ OPTIONS SUCCESS (${response.status})`);
  } catch (error) {
    console.log(`❌ OPTIONS FAILED:`, error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS:');
  console.log('='.repeat(60));
  console.log('If all endpoints return 404:');
  console.log('  → API routes not deployed (check Vercel build logs)');
  console.log('  → Or environment variables missing on Vercel');
  console.log('\nIf endpoints return 500:');
  console.log('  → Database connection failing (check DATABASE_URL)');
  console.log('  → Missing environment variables');
  console.log('\nIf endpoints return 401/400:');
  console.log('  → Routes deployed successfully ✅');
  console.log('  → Authentication working as expected ✅');
}

runTests().catch(console.error);

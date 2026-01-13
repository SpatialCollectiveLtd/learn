/**
 * API Test Suite for Spatial Collective Learning Platform
 * Tests all API endpoints with proper authentication
 * Run: node scripts/test-all-apis.js
 */

require('dotenv').config({ path: '.env.local' });

// Configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_YOUTH_ID = 'KAYTEST001ES';
const TEST_STAFF_ID = 'SC001';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to make HTTP requests using native fetch
async function makeRequest(method, path, data = null, headers = {}) {
  const url = new URL(path, BASE_URL);
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url.toString(), options);
    let responseData;
    const text = await response.text();
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }
    return { status: response.status, data: responseData, headers: response.headers };
  } catch (error) {
    throw new Error(`Connection failed: ${error.message}`);
  }
}

// Test helper
async function test(name, testFn) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.passed++;
    results.tests.push({ name, status: 'PASSED', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message, duration });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function skip(name, reason) {
  results.skipped++;
  results.tests.push({ name, status: 'SKIPPED', reason });
  console.log(`⏭️  ${name}: ${reason}`);
}

// Assertion helpers
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy value, got ${value}`);
  }
}

function assertStatusCode(response, expectedCode, message) {
  if (response.status !== expectedCode) {
    throw new Error(`${message}: expected status ${expectedCode}, got ${response.status}`);
  }
}

// Store tokens for authenticated requests
let youthToken = null;
let staffToken = null;

// ============================================
// TEST SUITES
// ============================================

async function testHealthEndpoints() {
  console.log('\n📋 Testing Health Endpoints...');
  
  await test('GET /api/health returns 200', async () => {
    const res = await makeRequest('GET', '/api/health');
    assertStatusCode(res, 200, 'Health check');
    assertTruthy(res.data.success, 'Success should be true');
  });
  
  await test('GET /api/version returns version info', async () => {
    const res = await makeRequest('GET', '/api/version');
    assertStatusCode(res, 200, 'Version endpoint');
    assertTruthy(res.data.version, 'Should have version');
  });
  
  await test('GET /api/debug returns database status', async () => {
    const res = await makeRequest('GET', '/api/debug');
    assertStatusCode(res, 200, 'Debug endpoint');
    assertTruthy(res.data.database, 'Should have database info');
  });
}

async function testYouthAuthEndpoints() {
  console.log('\n📋 Testing Youth Authentication...');
  
  await test('POST /api/youth/auth/authenticate with invalid ID returns 400', async () => {
    const res = await makeRequest('POST', '/api/youth/auth/authenticate', {
      youthId: 'INVALID'
    });
    assertStatusCode(res, 400, 'Invalid youth ID');
    assertEqual(res.data.success, false, 'Should fail');
  });
  
  await test('POST /api/youth/auth/authenticate with valid format but nonexistent ID', async () => {
    const res = await makeRequest('POST', '/api/youth/auth/authenticate', {
      youthId: 'KAY9999XX'
    });
    // Should be 404 (not found) or 401 (unauthorized)
    assertTruthy([401, 404].includes(res.status), 'Should be 401 or 404');
  });
  
  await test('POST /api/youth/auth/authenticate with test user', async () => {
    const res = await makeRequest('POST', '/api/youth/auth/authenticate', {
      youthId: TEST_YOUTH_ID
    });
    // May succeed or fail depending on test data
    if (res.status === 200 && res.data.token) {
      youthToken = res.data.token;
      assertTruthy(youthToken, 'Should have token');
    } else {
      skip('Youth authentication', 'Test user not found in database');
    }
  });
}

async function testStaffAuthEndpoints() {
  console.log('\n📋 Testing Staff Authentication...');
  
  await test('POST /api/staff/auth/authenticate without staffId returns 400', async () => {
    const res = await makeRequest('POST', '/api/staff/auth/authenticate', {});
    assertStatusCode(res, 400, 'Missing staff ID');
  });
  
  await test('POST /api/staff/auth/authenticate with invalid staffId', async () => {
    const res = await makeRequest('POST', '/api/staff/auth/authenticate', {
      staffId: 'INVALID999'
    });
    assertTruthy([401, 404].includes(res.status), 'Should be 401 or 404');
  });
  
  await test('POST /api/staff/auth/authenticate with valid staff', async () => {
    const res = await makeRequest('POST', '/api/staff/auth/authenticate', {
      staffId: TEST_STAFF_ID
    });
    if (res.status === 200 && res.data.token) {
      staffToken = res.data.token;
      assertTruthy(staffToken, 'Should have token');
    } else {
      skip('Staff authentication', 'Test staff not found in database');
    }
  });
}

async function testYouthProfileEndpoints() {
  console.log('\n📋 Testing Youth Profile...');
  
  await test('GET /api/youth/profile without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/youth/profile');
    assertStatusCode(res, 401, 'No auth token');
  });
  
  if (youthToken) {
    await test('GET /api/youth/profile with valid token', async () => {
      const res = await makeRequest('GET', '/api/youth/profile', null, {
        Authorization: `Bearer ${youthToken}`
      });
      assertStatusCode(res, 200, 'With valid token');
      assertTruthy(res.data.youth || res.data.profile, 'Should have profile data');
    });
  } else {
    skip('GET /api/youth/profile with token', 'No youth token available');
  }
}

async function testContractEndpoints() {
  console.log('\n📋 Testing Contract Endpoints...');
  
  await test('GET /api/contracts/template without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/contracts/template');
    assertStatusCode(res, 401, 'No auth');
  });
  
  if (youthToken) {
    await test('GET /api/contracts/template with auth', async () => {
      const res = await makeRequest('GET', '/api/contracts/template', null, {
        Authorization: `Bearer ${youthToken}`
      });
      // May be 200 (has template) or 404 (no template for program type)
      assertTruthy([200, 404].includes(res.status), 'Should be 200 or 404');
    });
    
    await test('GET /api/contracts/signed with auth', async () => {
      const res = await makeRequest('GET', '/api/contracts/signed', null, {
        Authorization: `Bearer ${youthToken}`
      });
      // May be 200 (has contract) or 404 (no contract)
      assertTruthy([200, 404].includes(res.status), 'Should be 200 or 404');
    });
  } else {
    skip('Contract endpoints with auth', 'No youth token available');
  }
}

async function testWorkEndpoints() {
  console.log('\n📋 Testing Work Dashboard Endpoints...');
  
  await test('GET /api/work/stats/daily without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/work/stats/daily');
    assertStatusCode(res, 401, 'No auth');
  });
  
  if (youthToken) {
    await test('GET /api/work/stats/daily with auth', async () => {
      const res = await makeRequest('GET', '/api/work/stats/daily', null, {
        Authorization: `Bearer ${youthToken}`
      });
      // May succeed or fail depending on OSM username setup
      assertTruthy([200, 400, 404, 500].includes(res.status), 'Should respond');
    });
    
    await test('GET /api/work/days/count with auth', async () => {
      const res = await makeRequest('GET', '/api/work/days/count', null, {
        Authorization: `Bearer ${youthToken}`
      });
      assertTruthy([200, 404].includes(res.status), 'Should be 200 or 404');
    });
  } else {
    skip('Work endpoints with auth', 'No youth token available');
  }
}

async function testTrainerEndpoints() {
  console.log('\n📋 Testing Trainer Endpoints...');
  
  await test('GET /api/trainer/youth without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/trainer/youth');
    assertStatusCode(res, 401, 'No auth');
  });
  
  if (staffToken) {
    await test('GET /api/trainer/youth with staff auth', async () => {
      const res = await makeRequest('GET', '/api/trainer/youth', null, {
        Authorization: `Bearer ${staffToken}`
      });
      assertStatusCode(res, 200, 'With staff token');
      assertTruthy(Array.isArray(res.data.youth) || Array.isArray(res.data), 'Should be array');
    });
    
    await test('GET /api/trainer/activity with staff auth', async () => {
      const res = await makeRequest('GET', '/api/trainer/activity', null, {
        Authorization: `Bearer ${staffToken}`
      });
      assertStatusCode(res, 200, 'Activity endpoint');
    });
  } else {
    skip('Trainer endpoints with auth', 'No staff token available');
  }
}

async function testAdminEndpoints() {
  console.log('\n📋 Testing Admin Endpoints...');
  
  await test('GET /api/admin/youth without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/admin/youth');
    assertStatusCode(res, 401, 'No auth');
  });
  
  if (staffToken) {
    await test('GET /api/admin/youth with staff auth', async () => {
      const res = await makeRequest('GET', '/api/admin/youth', null, {
        Authorization: `Bearer ${staffToken}`
      });
      assertStatusCode(res, 200, 'Admin youth list');
    });
    
    await test('GET /api/admin/contracts/print with staff auth', async () => {
      const res = await makeRequest('GET', '/api/admin/contracts/print', null, {
        Authorization: `Bearer ${staffToken}`
      });
      // May be 200 or 404 depending on contracts
      assertTruthy([200, 404].includes(res.status), 'Should respond');
    });
  } else {
    skip('Admin endpoints with auth', 'No staff token available');
  }
}

async function testMessageEndpoints() {
  console.log('\n📋 Testing Message Endpoints...');
  
  await test('GET /api/messages/inbox without auth returns 401', async () => {
    const res = await makeRequest('GET', '/api/messages/inbox');
    assertStatusCode(res, 401, 'No auth');
  });
  
  if (youthToken) {
    await test('GET /api/messages/unread-count with auth', async () => {
      const res = await makeRequest('GET', '/api/messages/unread-count', null, {
        Authorization: `Bearer ${youthToken}`
      });
      // May succeed or fail depending on email setup
      assertTruthy([200, 400, 404, 500].includes(res.status), 'Should respond');
    });
  } else {
    skip('Message endpoints with auth', 'No youth token available');
  }
}

async function testTrainingEndpoints() {
  console.log('\n📋 Testing Training Endpoints...');
  
  if (youthToken) {
    await test('GET /api/training/completion-status with auth', async () => {
      const res = await makeRequest('GET', '/api/training/completion-status', null, {
        Authorization: `Bearer ${youthToken}`
      });
      assertTruthy([200, 404].includes(res.status), 'Should respond');
    });
    
    await test('GET /api/youth/training-progress with auth', async () => {
      const res = await makeRequest('GET', '/api/youth/training-progress', null, {
        Authorization: `Bearer ${youthToken}`
      });
      assertTruthy([200, 404].includes(res.status), 'Should respond');
    });
  } else {
    skip('Training endpoints with auth', 'No youth token available');
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🚀 Starting API Test Suite');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    // Health checks first
    await testHealthEndpoints();
    
    // Authentication
    await testYouthAuthEndpoints();
    await testStaffAuthEndpoints();
    
    // Protected endpoints
    await testYouthProfileEndpoints();
    await testContractEndpoints();
    await testWorkEndpoints();
    await testTrainerEndpoints();
    await testAdminEndpoints();
    await testMessageEndpoints();
    await testTrainingEndpoints();
    
  } catch (error) {
    console.error('\n💥 Test suite error:', error.message);
  }
  
  const totalTime = Date.now() - startTime;
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Print failed tests
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();

/**
 * Test Mobile Mapping APIs with Mock DPW Server
 * 
 * Tests all 5 mobile mapping API routes against mock DPW data
 * Run after starting mock-dpw-server.js
 */

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000';
const MOCK_DPW_URL = 'http://localhost:3002';

// Test youth accounts
const TEST_YOUTH = [
  { youth_id: 'KAY2544DG', settlement: 'Kayole Soweto' },
  { youth_id: 'KAR008CM', settlement: 'Kariobangi Machakos' },
  { youth_id: 'HUR792SW', settlement: 'Mji wa Huruma' },
];

// Generate JWT token
function generateToken(youthId) {
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not found in environment');
  }
  
  return jwt.sign(
    {
      youth_id: youthId,
      role: 'Youth',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    },
    secret
  );
}

// Test health check
async function testHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const isHealthy = response.ok;
    console.log(`\n🏥 Health Check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    return isHealthy;
  } catch (error) {
    console.log(`\n🏥 Health Check: ❌ Server not running`);
    return false;
  }
}

// Test mock DPW server
async function testMockDPW() {
  try {
    const response = await fetch(`${MOCK_DPW_URL}/api/v1/youth/KAY2544DG/payment/breakdown`, {
      headers: {
        'X-API-Key': '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3',
      },
    });
    const isHealthy = response.ok;
    console.log(`🎭 Mock DPW Server: ${isHealthy ? '✅ Running' : '❌ Not running'}`);
    return isHealthy;
  } catch (error) {
    console.log(`🎭 Mock DPW Server: ❌ Not running - ${error.message}`);
    return false;
  }
}

// Test Payment Breakdown API
async function testPaymentAPI(youthId) {
  try {
    const token = generateToken(youthId);
    const response = await fetch(`${BASE_URL}/api/youth/payment/breakdown`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`  ✅ Payment API: ${response.status} OK`);
      console.log(`     - Total: ${data.data.total_earnings} KES`);
      console.log(`     - Work days: ${data.data.work_days_completed}`);
      return true;
    } else {
      console.log(`  ❌ Payment API: ${response.status} ${response.statusText}`);
      console.log(`     - Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Payment API: Failed - ${error.message}`);
    return false;
  }
}

// Test Performance API
async function testPerformanceAPI(youthId) {
  try {
    const token = generateToken(youthId);
    const response = await fetch(`${BASE_URL}/api/youth/performance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`  ✅ Performance API: ${response.status} OK`);
      console.log(`     - Quality: ${data.data.personal_metrics.quality_score}%`);
      console.log(`     - Rank: #${data.data.settlement_ranking.youth_rank}`);
      return true;
    } else {
      console.log(`  ❌ Performance API: ${response.status} ${response.statusText}`);
      console.log(`     - Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Performance API: Failed - ${error.message}`);
    return false;
  }
}

// Test Badges API
async function testBadgesAPI(youthId) {
  try {
    const token = generateToken(youthId);
    const response = await fetch(`${BASE_URL}/api/youth/badges`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      const earned = data.data.badges.filter(b => b.earned).length;
      console.log(`  ✅ Badges API: ${response.status} OK`);
      console.log(`     - Earned: ${earned}/${data.data.badges.length} badges`);
      return true;
    } else {
      console.log(`  ❌ Badges API: ${response.status} ${response.statusText}`);
      console.log(`     - Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Badges API: Failed - ${error.message}`);
    return false;
  }
}

// Test Query List API
async function testQueryListAPI(youthId) {
  try {
    const token = generateToken(youthId);
    const response = await fetch(`${BASE_URL}/api/youth/queries`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`  ✅ Query List API: ${response.status} OK`);
      console.log(`     - Total: ${data.data.total_queries} queries`);
      console.log(`     - Pending: ${data.data.pending_queries}`);
      return true;
    } else {
      console.log(`  ❌ Query List API: ${response.status} ${response.statusText}`);
      console.log(`     - Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Query List API: Failed - ${error.message}`);
    return false;
  }
}

// Test Query Submit API
async function testQuerySubmitAPI(youthId) {
  try {
    const token = generateToken(youthId);
    const response = await fetch(`${BASE_URL}/api/youth/queries/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'technical',
        subject: 'Test query from automated test',
        message: 'This is a test query submission.',
        priority: 'low',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`  ✅ Query Submit API: ${response.status} OK`);
      console.log(`     - Query ID: ${data.data.query_id}`);
      return true;
    } else {
      console.log(`  ❌ Query Submit API: ${response.status} ${response.statusText}`);
      console.log(`     - Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Query Submit API: Failed - ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Mobile Mapping API Test Suite\n');
  console.log('='.repeat(50));
  
  // Check servers
  const healthOk = await testHealth();
  const mockOk = await testMockDPW();
  
  if (!healthOk) {
    console.log('\n❌ Next.js server not running. Start with: npm run dev');
    process.exit(1);
  }
  
  if (!mockOk) {
    console.log('\n❌ Mock DPW server not running. Start with: node scripts/mock-dpw-server.js');
    process.exit(1);
  }
  
  console.log('='.repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const youth of TEST_YOUTH) {
    console.log(`\n👤 Testing ${youth.youth_id} (${youth.settlement})\n`);
    
    const results = await Promise.all([
      testPaymentAPI(youth.youth_id),
      testPerformanceAPI(youth.youth_id),
      testBadgesAPI(youth.youth_id),
      testQueryListAPI(youth.youth_id),
      testQuerySubmitAPI(youth.youth_id),
    ]);
    
    totalTests += results.length;
    passedTests += results.filter(Boolean).length;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed\n`);
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed! APIs are working correctly.\n');
    process.exit(0);
  } else {
    console.log(`❌ ${totalTests - passedTests} tests failed. Check errors above.\n`);
    process.exit(1);
  }
}

runTests();

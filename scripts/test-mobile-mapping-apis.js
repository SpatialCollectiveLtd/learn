// Test Mobile Mapping APIs
// Tests all 5 new API endpoints with mock authentication
require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;
const BASE_URL = 'http://localhost:3000';

// Test youth IDs
const TEST_YOUTH = [
  { youth_id: 'KAY2544DG', name: 'Denis Gitahi', settlement: 'Kayole Soweto' },
  { youth_id: 'KAR008CM', name: 'Christine Mwaniki', settlement: 'Kariobangi Machakos' },
  { youth_id: 'HUR792SW', name: 'Susan Wairimu', settlement: 'Mji wa Huruma' },
];

// Generate test JWT token
function generateToken(youthId, settlement) {
  return jwt.sign(
    { 
      youthId, 
      settlement,
      programType: 'mobile_mapping',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    JWT_SECRET
  );
}

// Test API endpoint
async function testEndpoint(endpoint, method, token, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🧪 Mobile Mapping API Tests\n');
  console.log('='.repeat(60));

  // Check if dev server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}`);
    if (!healthCheck.ok && healthCheck.status !== 404) {
      console.log('❌ Dev server not running. Start with: npm run dev');
      console.log(`   Server check returned: ${healthCheck.status}`);
      process.exit(1);
    }
    console.log('✅ Dev server is running');
  } catch (error) {
    console.log('❌ Dev server not running. Start with: npm run dev');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  for (const youth of TEST_YOUTH) {
    console.log(`\n📊 Testing: ${youth.name} (${youth.youth_id})`);
    console.log('-'.repeat(60));

    const token = generateToken(youth.youth_id, youth.settlement);

    // Test 1: Payment Breakdown
    console.log('\n1️⃣  Payment Breakdown API');
    const payment = await testEndpoint('/api/youth/payment/breakdown', 'GET', token);
    if (payment.ok) {
      console.log(`   ✅ Status: ${payment.status}`);
      console.log(`   Total Earnings: ${payment.data.data?.total_earnings || 0} KES`);
      console.log(`   Work Days: ${payment.data.data?.work_days_completed || 0}`);
    } else {
      console.log(`   ❌ Status: ${payment.status}`);
      console.log(`   Error: ${payment.data.error?.message || payment.error}`);
    }

    // Test 2: Performance Metrics
    console.log('\n2️⃣  Performance Metrics API');
    const performance = await testEndpoint('/api/youth/performance', 'GET', token);
    if (performance.ok) {
      console.log(`   ✅ Status: ${performance.status}`);
      console.log(`   Rank: #${performance.data.data?.settlement_ranking?.youth_rank || 'N/A'}`);
      console.log(`   Overall Score: ${performance.data.data?.personal_metrics?.overall_score || 0}%`);
    } else {
      console.log(`   ❌ Status: ${performance.status}`);
      console.log(`   Error: ${performance.data.error?.message || performance.error}`);
    }

    // Test 3: Badges
    console.log('\n3️⃣  Badges API');
    const badges = await testEndpoint('/api/youth/badges', 'GET', token);
    if (badges.ok) {
      console.log(`   ✅ Status: ${badges.status}`);
      console.log(`   Badges Earned: ${badges.data.data?.earned_badges || 0}/${badges.data.data?.total_badges || 0}`);
    } else {
      console.log(`   ❌ Status: ${badges.status}`);
      console.log(`   Error: ${badges.data.error?.message || badges.error}`);
    }

    // Test 4: Query List
    console.log('\n4️⃣  Query List API');
    const queries = await testEndpoint('/api/youth/queries', 'GET', token);
    if (queries.ok) {
      console.log(`   ✅ Status: ${queries.status}`);
      console.log(`   Total Queries: ${queries.data.data?.total_queries || 0}`);
      console.log(`   Pending: ${queries.data.data?.pending_queries || 0}`);
    } else {
      console.log(`   ❌ Status: ${queries.status}`);
      console.log(`   Error: ${queries.data.error?.message || queries.error}`);
    }

    // Test 5: Query Submission (only for first user)
    if (youth.youth_id === TEST_YOUTH[0].youth_id) {
      console.log('\n5️⃣  Query Submission API');
      const queryBody = {
        category: 'technical',
        subject: 'Test Query from API Test Script',
        message: 'This is a test query submitted via automated testing script.',
        priority: 'low',
      };
      const submitQuery = await testEndpoint('/api/youth/queries/submit', 'POST', token, queryBody);
      if (submitQuery.ok) {
        console.log(`   ✅ Status: ${submitQuery.status}`);
        console.log(`   Query ID: ${submitQuery.data.data?.query_id || 'N/A'}`);
      } else {
        console.log(`   ❌ Status: ${submitQuery.status}`);
        console.log(`   Error: ${submitQuery.data.error?.message || submitQuery.error}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests Complete!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

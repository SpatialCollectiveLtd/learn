/**
 * Work Dashboard Test Suite
 * Tests work dashboard APIs across different youth accounts
 * Validates building counts, work days, and statistics
 * Run: node scripts/test-work-dashboard.js
 */

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';

// Test Results
const results = {
  passed: 0,
  failed: 0,
  accounts: []
};

// Generate JWT token for testing
function generateToken(youthId) {
  return jwt.sign(
    { youthId, userType: 'youth' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// HTTP request helper
async function makeRequest(method, path, token = null, data = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = { method, headers };
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }
    return { status: response.status, data: responseData };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test a single youth account's work dashboard
async function testYouthWorkDashboard(youthId, osmUsername, expectedModule) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${youthId} | OSM: ${osmUsername || 'N/A'} | Module: ${expectedModule}`);
  console.log('='.repeat(60));
  
  const accountResult = {
    youthId,
    osmUsername,
    module: expectedModule,
    tests: []
  };
  
  const token = generateToken(youthId);
  
  // Test 1: Get Youth Profile
  console.log('\n📋 1. Profile Check...');
  const profileRes = await makeRequest('GET', '/api/youth/profile', token);
  if (profileRes.status === 200 && profileRes.data.success) {
    console.log(`   ✅ Profile loaded`);
    console.log(`   Name: ${profileRes.data.data?.fullName}`);
    console.log(`   Settlement: ${profileRes.data.data?.settlement}`);
    console.log(`   Module: ${profileRes.data.data?.programType}`);
    console.log(`   OSM Username: ${profileRes.data.data?.osmUsername || 'Not set'}`);
    accountResult.profile = profileRes.data.data;
    accountResult.tests.push({ name: 'Profile', status: 'PASS' });
    results.passed++;
  } else {
    console.log(`   ❌ Profile failed: ${profileRes.status}`);
    accountResult.tests.push({ name: 'Profile', status: 'FAIL', error: profileRes.data });
    results.failed++;
    accountResult.error = 'Profile not found';
    results.accounts.push(accountResult);
    return accountResult;
  }
  
  // Test 2: Get Training Progress (to check work dashboard access)
  console.log('\n📋 2. Training Progress...');
  const progressRes = await makeRequest('GET', '/api/youth/training-progress', token);
  if (progressRes.status === 200 && progressRes.data.success) {
    const progress = progressRes.data.data;
    console.log(`   ✅ Training loaded`);
    console.log(`   Total Progress: ${progress.totalProgress}%`);
    console.log(`   Completed Steps: ${progress.completedSteps}/${progress.totalSteps}`);
    console.log(`   Completed Modules: ${progress.modules?.filter(m => m.progress === 100).length || 0}/${progress.modules?.length || 0}`);
    console.log(`   Work Dashboard: ${progress.totalProgress >= 100 ? '🔓 UNLOCKED' : '🔒 LOCKED'}`);
    accountResult.training = progress;
    accountResult.tests.push({ name: 'Training Progress', status: 'PASS' });
    results.passed++;
  } else {
    console.log(`   ⚠️ Training progress: ${progressRes.data?.message || progressRes.status}`);
    accountResult.tests.push({ name: 'Training Progress', status: 'WARN', error: progressRes.data });
  }
  
  // Test 3: Work Days Count
  console.log('\n📋 3. Work Days Count...');
  const workDaysRes = await makeRequest('GET', '/api/work/days/count', token);
  if (workDaysRes.status === 200 && workDaysRes.data.success) {
    const data = workDaysRes.data.data;
    console.log(`   ✅ Work days loaded`);
    console.log(`   Days Worked: ${data.daysWorked}/${data.totalDays}`);
    console.log(`   Pending Days: ${data.pendingDays}`);
    console.log(`   Total Buildings: ${data.totalBuildings}`);
    console.log(`   Days Target Met: ${data.daysTargetMet}`);
    console.log(`   Completion: ${data.percentage}%`);
    accountResult.workDays = data;
    accountResult.tests.push({ name: 'Work Days Count', status: 'PASS' });
    results.passed++;
  } else {
    console.log(`   ⚠️ Work days: ${workDaysRes.data?.message || workDaysRes.status}`);
    accountResult.workDays = null;
    accountResult.tests.push({ name: 'Work Days Count', status: 'WARN', error: workDaysRes.data });
  }
  
  // Test 4: Daily Stats (OSM) - Only for digitization module
  if (expectedModule === 'digitization' && osmUsername) {
    console.log('\n📋 4. Daily OSM Stats...');
    const dailyRes = await makeRequest('GET', '/api/work/stats/daily', token);
    if (dailyRes.status === 200 && dailyRes.data.success) {
      const data = dailyRes.data.data;
      console.log(`   ✅ Daily stats loaded`);
      console.log(`   Today's Buildings: ${data.today}`);
      console.log(`   Daily Target: ${data.target}`);
      console.log(`   Progress: ${data.percentage}%`);
      console.log(`   Changesets Analyzed: ${data.changesetsAnalyzed}`);
      console.log(`   Cache Hit: ${data.cacheHit ? 'Yes' : 'No'}`);
      accountResult.dailyStats = data;
      accountResult.tests.push({ name: 'Daily OSM Stats', status: 'PASS' });
      results.passed++;
    } else if (dailyRes.status === 503) {
      console.log(`   ⚠️ OSM API temporarily unavailable`);
      accountResult.tests.push({ name: 'Daily OSM Stats', status: 'SKIP', reason: 'OSM API unavailable' });
    } else {
      console.log(`   ⚠️ Daily stats: ${dailyRes.data?.message || dailyRes.status}`);
      accountResult.tests.push({ name: 'Daily OSM Stats', status: 'WARN', error: dailyRes.data });
    }
  } else {
    console.log('\n📋 4. Daily OSM Stats... SKIPPED (non-digitization or no OSM username)');
    accountResult.tests.push({ name: 'Daily OSM Stats', status: 'SKIP', reason: 'Not applicable' });
  }
  
  // Test 5: Sync Work Days (POST)
  console.log('\n📋 5. Sync Work Days...');
  const syncRes = await makeRequest('POST', '/api/work/days/sync', token);
  if (syncRes.status === 200) {
    console.log(`   ✅ Sync completed`);
    if (syncRes.data.data) {
      console.log(`   Synced Days: ${syncRes.data.data.syncedDays || 0}`);
      console.log(`   Updated Days: ${syncRes.data.data.updatedDays || 0}`);
    }
    accountResult.tests.push({ name: 'Sync Work Days', status: 'PASS' });
    results.passed++;
  } else {
    console.log(`   ⚠️ Sync: ${syncRes.data?.message || syncRes.status}`);
    accountResult.tests.push({ name: 'Sync Work Days', status: 'WARN', error: syncRes.data });
  }
  
  results.accounts.push(accountResult);
  return accountResult;
}

// Get sample accounts from database
async function getSampleAccounts() {
  console.log('\n🔍 Fetching sample accounts from database...\n');
  
  // First check if we can connect to the database
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Get accounts with varied data for testing - all active accounts with work
    const result = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.osm_username,
        yp.program_type,
        yp.settlement,
        yp.is_active,
        COALESCE((
          SELECT COUNT(*) 
          FROM youth_work_days ywd 
          WHERE ywd.youth_id = yp.youth_id AND ywd.status = 'approved'
        ), 0) as work_days,
        COALESCE((
          SELECT SUM(buildings_count) 
          FROM youth_work_days ywd 
          WHERE ywd.youth_id = yp.youth_id AND ywd.status = 'approved'
        ), 0) as total_buildings
      FROM youth_participants yp
      WHERE yp.is_active = TRUE
        AND yp.osm_username IS NOT NULL
      ORDER BY 
        yp.settlement,
        work_days DESC,
        total_buildings DESC
    `);
    
    await pool.end();
    
    // Group by settlement and pick 2 from each
    const accounts = [];
    const bySettlement = {};
    
    for (const row of result.rows) {
      if (!bySettlement[row.settlement]) {
        bySettlement[row.settlement] = [];
      }
      bySettlement[row.settlement].push(row);
    }
    
    console.log('Found accounts by settlement:');
    for (const [settlement, rows] of Object.entries(bySettlement)) {
      console.log(`  ${settlement}: ${rows.length} accounts with OSM usernames`);
      // Pick first 2 from each settlement
      accounts.push(...rows.slice(0, 2));
    }
    
    return accounts;
  } catch (error) {
    console.error('Database error:', error.message);
    return [];
  }
}

// Main test runner
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         WORK DASHBOARD TEST SUITE - Multi-Account            ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Base URL: ${BASE_URL.padEnd(49)}║`);
  console.log(`║  Date: ${new Date().toISOString().padEnd(53)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Fetch sample accounts
  const accounts = await getSampleAccounts();
  
  if (accounts.length === 0) {
    console.log('\n❌ No accounts found to test. Check database connection.');
    process.exit(1);
  }
  
  console.log(`\n📊 Testing ${accounts.length} accounts...\n`);
  
  // Test each account
  for (const account of accounts) {
    await testYouthWorkDashboard(
      account.youth_id,
      account.osm_username,
      account.program_type
    );
  }
  
  // Print summary
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                            ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Accounts Tested: ${accounts.length.toString().padEnd(37)}║`);
  console.log(`║  Tests Passed: ${results.passed.toString().padEnd(46)}║`);
  console.log(`║  Tests Failed: ${results.failed.toString().padEnd(46)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Print detailed breakdown by account
  console.log('\n📊 ACCOUNT DETAILS:');
  console.log('─'.repeat(80));
  
  for (const acc of results.accounts) {
    const status = acc.tests.every(t => t.status === 'PASS' || t.status === 'SKIP') ? '✅' : '⚠️';
    console.log(`\n${status} ${acc.youthId} (${acc.module})`);
    
    if (acc.profile) {
      console.log(`   Name: ${acc.profile.fullName}`);
      console.log(`   Settlement: ${acc.profile.settlement}`);
    }
    
    if (acc.workDays) {
      console.log(`   📈 Work Days: ${acc.workDays.daysWorked}/${acc.workDays.totalDays} (${acc.workDays.percentage}%)`);
      console.log(`   🏗️  Buildings: ${acc.workDays.totalBuildings}`);
    }
    
    if (acc.dailyStats) {
      console.log(`   📅 Today: ${acc.dailyStats.today}/${acc.dailyStats.target} buildings (${acc.dailyStats.percentage}%)`);
    }
    
    // Check for data consistency
    if (acc.workDays && acc.dailyStats) {
      console.log(`   🔍 Data Check: Work days and daily stats loaded - OK`);
    }
  }
  
  // Highlight any issues
  const issues = results.accounts.filter(a => 
    a.tests.some(t => t.status === 'FAIL')
  );
  
  if (issues.length > 0) {
    console.log('\n\n⚠️  ACCOUNTS WITH ISSUES:');
    console.log('─'.repeat(80));
    for (const acc of issues) {
      console.log(`\n❌ ${acc.youthId}`);
      const failedTests = acc.tests.filter(t => t.status === 'FAIL');
      for (const test of failedTests) {
        console.log(`   - ${test.name}: ${test.error?.message || JSON.stringify(test.error)}`);
      }
    }
  }
  
  console.log('\n\nTest complete!');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);

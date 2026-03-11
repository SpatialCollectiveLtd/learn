/**
 * DPW ↔ Learn Integration Test Script
 * Tests all 10 DPW endpoints from the API contract handoff.
 * 
 * Usage: node scripts/test-dpw-integration.js [TEST_YOUTH_ID]
 * Example: node scripts/test-dpw-integration.js KAY1799DM
 * Requires: .env.local with DPW_API_URL and DPW_API_SECRET
 */
require('dotenv').config({ path: '.env.local' });

const DPW_API_URL = process.env.DPW_API_URL || process.env.DPW_MANAGER_BASE_URL;
const DPW_API_SECRET = process.env.DPW_API_SECRET || process.env.DPW_MANAGER_API_KEY;

if (!DPW_API_URL || !DPW_API_SECRET) {
  console.error('Missing DPW_API_URL or DPW_API_SECRET in .env.local');
  process.exit(1);
}

console.log(`\nDPW Base URL: ${DPW_API_URL}`);
console.log(`Secret: ${DPW_API_SECRET.slice(0, 8)}...${DPW_API_SECRET.slice(-4)}\n`);

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${DPW_API_SECRET}`,
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;

const TEST_YOUTH_ID = process.argv[2] || 'KAY1799DM';

async function test(name, fn) {
  try {
    const result = await fn();
    if (result && result.skip) {
      console.log(`SKIP: ${name} -- ${result.reason}`);
      skipCount++;
    } else {
      console.log(`PASS: ${name}`);
      passCount++;
    }
  } catch (err) {
    console.log(`FAIL: ${name}`);
    console.log(`   Status: ${err.status || 'N/A'}`);
    console.log(`   Error: ${err.message}`);
    if (err.body) console.log(`   Body: ${JSON.stringify(err.body).slice(0, 300)}`);
    failCount++;
  }
}

async function dpwFetch(path, options = {}) {
  const url = `${DPW_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = new Error(body?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return { status: res.status, body };
}

async function run() {
  console.log('='.repeat(60));
  console.log('DPW <> Learn Integration Tests');
  console.log(`Test Youth ID: ${TEST_YOUTH_ID}`);
  console.log('='.repeat(60));

  // 1. Youth Authentication
  await test('POST /api/learn/auth/youth', async () => {
    const { body } = await dpwFetch('/api/learn/auth/youth', {
      method: 'POST',
      body: JSON.stringify({ youth_id: TEST_YOUTH_ID }),
    });
    if (!body.success) throw new Error('Response success=false');
    if (!body.data?.user_id) throw new Error('Missing user_id in response');
    console.log(`   -> user_id: ${body.data.user_id}, role: ${body.data.role}, module: ${body.data.module}`);
    return body;
  });

  // 2. Get User Profile
  await test(`GET /api/learn/users/${TEST_YOUTH_ID}`, async () => {
    const { body } = await dpwFetch(`/api/learn/users/${TEST_YOUTH_ID}`);
    if (!body.success) throw new Error('Response success=false');
    if (!body.data?.user_id) throw new Error('Missing user_id in response');
    console.log(`   -> ${body.data.full_name}, settlement: ${body.data.settlement}, active: ${body.data.is_active}`);
    return body;
  });

  // 3. List Users
  await test('GET /api/learn/users?role=youth&per_page=5', async () => {
    const { body } = await dpwFetch('/api/learn/users?role=youth&per_page=5');
    if (!body.success) throw new Error('Response success=false');
    if (!body.data?.users) throw new Error('Missing users array');
    console.log(`   -> ${body.data.users.length} users, total: ${body.data.pagination?.total}`);
    return body;
  });

  // 4. Attendance
  await test(`GET /api/learn/users/${TEST_YOUTH_ID}/attendance`, async () => {
    const from = '2026-01-01';
    const to = '2026-03-11';
    const { body } = await dpwFetch(
      `/api/learn/users/${TEST_YOUTH_ID}/attendance?from=${from}&to=${to}`
    );
    if (!body.success) throw new Error('Response success=false');
    console.log(`   -> ${body.data.total_days_attended} days attended, ${body.data.records?.length} records`);
    return body;
  });

  // 5. Performance
  await test(`GET /api/learn/users/${TEST_YOUTH_ID}/performance`, async () => {
    const { body } = await dpwFetch(`/api/learn/users/${TEST_YOUTH_ID}/performance`);
    if (!body.success) throw new Error('Response success=false');
    console.log(`   -> module: ${body.data.module}, days_worked: ${body.data.summary?.total_days_worked}`);
    return body;
  });

  // 6. Payments
  await test(`GET /api/learn/users/${TEST_YOUTH_ID}/payments`, async () => {
    const { body } = await dpwFetch(`/api/learn/users/${TEST_YOUTH_ID}/payments`);
    if (!body.success) throw new Error('Response success=false');
    console.log(`   -> total_earnings: ${body.data.total_earnings}, cycles: ${body.data.cycles?.length}`);
    return body;
  });

  // 7. Settlements
  await test('GET /api/learn/settlements', async () => {
    const { body } = await dpwFetch('/api/learn/settlements');
    if (!body.success) throw new Error('Response success=false');
    if (!Array.isArray(body.data)) throw new Error('Expected data to be array');
    console.log(`   -> ${body.data.length} settlements: ${body.data.map(s => s.name).join(', ')}`);
    return body;
  });

  // 8. Modules
  await test('GET /api/learn/modules', async () => {
    const { body } = await dpwFetch('/api/learn/modules');
    if (!body.success) throw new Error('Response success=false');
    if (!Array.isArray(body.data)) throw new Error('Expected data to be array');
    console.log(`   -> ${body.data.length} modules: ${body.data.map(m => m.name).join(', ')}`);
    return body;
  });

  // 9. Trainers
  await test('GET /api/learn/trainers', async () => {
    const { body } = await dpwFetch('/api/learn/trainers');
    if (!body.success) throw new Error('Response success=false');
    if (!Array.isArray(body.data)) throw new Error('Expected data to be array');
    console.log(`   -> ${body.data.length} trainers`);
    return body;
  });

  // 10. Verify Launch Token — requires a freshly-generated token from DPW UI
  await test('POST /api/learn/auth/verify-launch-token', async () => {
    return {
      skip: true,
      reason: 'Requires a fresh one-time token from DPW. Test via DPW UI "Launch Learn" button.',
    };
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${skipCount} skipped`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\nSome tests failed. Check the errors above.');
    console.log('  If you get 401 errors, verify DPW_API_SECRET matches the handoff document.');
    console.log('  If you get 404 errors, verify DPW_API_URL is https://app.spatialcollective.com');
  } else {
    console.log('\nAll endpoints responding! Ready for end-to-end integration.');
  }
}

run().catch(console.error);
require('dotenv').config({ path: '.env.local' });
const https = require('https');

const API_KEY = process.env.DPW_MANAGER_API_KEY;
const BASE_URL = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'X-API-Key': API_KEY } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('🔑 API Key present:', !!API_KEY);
  console.log('🌐 Base URL:', BASE_URL);
  console.log('');

  // Test 1: no filter (all participants)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: No filter (all participants)');
  const t1 = await get(BASE_URL);
  if (t1.body.success) {
    console.log(`  ✅ HTTP ${t1.status} | api_version: ${t1.body.api_version}`);
    console.log(`  participants: ${t1.body.data.count}`);
    t1.body.data.statistics.forEach(s =>
      console.log(`  [${s.module}] ${s.total_participants} youth, ${s.total_attendance_records} attendance-days`)
    );
  } else {
    console.log(`  ❌ HTTP ${t1.status} | ${t1.body.error}`);
  }

  // Test 2: ?module=mobile_mapping
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: ?module=mobile_mapping');
  const t2 = await get(BASE_URL + '?module=mobile_mapping');
  if (t2.body.success) {
    console.log(`  ✅ HTTP ${t2.status} | participants: ${t2.body.data.count}`);
    const stat = t2.body.data.statistics[0];
    if (stat) {
      console.log(`  total_attendance_records: ${stat.total_attendance_records}`);
      console.log(`  youth_with_attendance: ${stat.youth_with_attendance}`);
      console.log(`  payment_gap_count: ${stat.payment_gap_count}`);
      console.log(`  total_earnings_potential_kes: ${stat.total_earnings_potential_kes}`);
    }
    // Check a transferred youth
    const hur = t2.body.data.participants.find(p => p.youth_id === 'HUR792SW');
    if (hur) {
      console.log(`\n  HUR792SW (transferred youth):`);
      console.log(`    current module field: ${hur.module}`);
      console.log(`    attendance_days: ${hur.attendance_days}`);
      console.log(`    attendance_history entries: ${hur.attendance_history.length}`);
      const programs = [...new Set(hur.attendance_history.map(a => a.program_type))];
      console.log(`    program_types in history: ${programs.join(', ')}`);
    } else {
      console.log(`\n  ⚠️  HUR792SW NOT found in response`);
    }
  } else {
    console.log(`  ❌ HTTP ${t2.status} | ${t2.body.error}`);
  }

  // Test 3: ?module=microtasking
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: ?module=microtasking');
  const t3 = await get(BASE_URL + '?module=microtasking');
  if (t3.body.success) {
    console.log(`  ✅ HTTP ${t3.status} | participants: ${t3.body.data.count}`);
    const stat = t3.body.data.statistics[0];
    if (stat) {
      console.log(`  total_attendance_records: ${stat.total_attendance_records}`);
    }
    // Verify HUR792SW is also in microtasking (for her microtasking attendance days)
    const hur = t3.body.data.participants.find(p => p.youth_id === 'HUR792SW');
    console.log(`  HUR792SW in microtasking results: ${hur ? `✅ yes, ${hur.attendance_days} days` : '❌ no'}`);
  } else {
    console.log(`  ❌ HTTP ${t3.status} | ${t3.body.error}`);
  }

  // Test 4: ?module=digitization
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: ?module=digitization');
  const t4 = await get(BASE_URL + '?module=digitization');
  if (t4.body.success) {
    console.log(`  ✅ HTTP ${t4.status} | participants: ${t4.body.data.count}`);
    const stat = t4.body.data.statistics[0];
    if (stat) console.log(`  total_attendance_records: ${stat.total_attendance_records}`);
  } else {
    console.log(`  ❌ HTTP ${t4.status} | ${t4.body.error}`);
  }

  // Test 5: ?youth_id=HUR792SW (individual lookup)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: ?youth_id=HUR792SW');
  const t5 = await get(BASE_URL + '?youth_id=HUR792SW');
  if (t5.body.success) {
    const p = t5.body.data.participants[0];
    console.log(`  ✅ HTTP ${t5.status}`);
    if (p) {
      console.log(`  attendance_days: ${p.attendance_days}`);
      console.log(`  attendance_history entries: ${p.attendance_history.length}`);
      console.log(`  payment_data.work_days: ${p.payment_data?.work_days}`);
      console.log(`  payment_data.data_source: ${p.payment_data?.data_source}`);
      const sample = p.attendance_history.slice(0, 3);
      sample.forEach(a => console.log(`    ${a.date}: ${a.program_type}`));
    }
  } else {
    console.log(`  ❌ HTTP ${t5.status} | ${t5.body.error}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

run().catch(console.error);

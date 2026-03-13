/**
 * Youth API Validation Script
 * Tests all APIs that the youth pages rely on before UI implementation.
 *
 * Usage:
 *   node scripts/test-youth-apis.js
 *
 * Requires:
 *   - .env.local with DATABASE_URL, JWT_SECRET, DPW_API_URL, DPW_API_SECRET
 *   - YOUTH_TEST_ID env var OR pass as first argument: node scripts/test-youth-apis.js KAY1234
 *   - Dev server running on localhost:3000 (npm run dev)
 */

require('dotenv').config({ path: '.env.local' });

const BASE = 'http://localhost:3000';
const YOUTH_ID = process.argv[2] || process.env.YOUTH_TEST_ID;

if (!YOUTH_ID) {
  console.error('\n❌  No youth ID provided.');
  console.error('   Usage: node scripts/test-youth-apis.js KAY1234');
  console.error('   Or set YOUTH_TEST_ID in .env.local\n');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function ok(label, detail = '') {
  passed++;
  console.log(`  ✅  ${label}${detail ? ' — ' + detail : ''}`);
}

function fail(label, detail = '') {
  failed++;
  console.log(`  ❌  ${label}${detail ? ' — ' + detail : ''}`);
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

async function apiCall(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  console.log('\n🚀  Youth API Test Suite');
  console.log(`   Target youth ID: ${YOUTH_ID}`);
  console.log(`   Server: ${BASE}`);

  // ─────────────────────────────────────────────
  section('1. Authentication  POST /api/auth/youth');
  // ─────────────────────────────────────────────
  let token;
  let userId;
  try {
    const { status, json } = await apiCall('POST', '/api/auth/youth', {
      body: { youthId: YOUTH_ID },
    });

    if (status !== 200 || !json.success) {
      fail('Login', `HTTP ${status} — ${json.message || json.error?.message || JSON.stringify(json)}`);
      console.error('\n   Cannot proceed without a valid token. Aborting.\n');
      process.exit(1);
    }

    token = json.data.token;
    userId = json.data.user.userId;
    ok('Login successful', `userId=${userId}`);

    const u = json.data.user;
    const fields = ['userId', 'fullName', 'role', 'settlement', 'module', 'moduleAssignment'];
    const missing = fields.filter((f) => u[f] === undefined);
    if (missing.length) fail('User fields in login response', `missing: ${missing.join(', ')}`);
    else ok('All user fields present', `module=${u.module}, assignment=${u.moduleAssignment}`);

    if (u.contract) {
      ok('Contract object present', `signed=${u.contract.has_signed}, contractedDays=${u.contract.total_contracted_days}`);
    } else {
      fail('Contract object missing from login response');
    }
  } catch (e) {
    fail('Login request failed', e.message);
    console.error('   Is the dev server running? (npm run dev)\n');
    process.exit(1);
  }

  // ─────────────────────────────────────────────
  section(`2. Profile  GET /api/users/${userId}`);
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', `/api/users/${userId}`, { token });
    if (status !== 200 || !json.success) {
      fail('Profile fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      ok('Profile returned', `name=${json.data.full_name}`);
      const needed = ['user_id', 'full_name', 'settlement', 'module', 'module_assignment', 'is_active', 'enrolled_at'];
      const miss = needed.filter((f) => json.data[f] === undefined);
      if (miss.length) fail('Profile fields', `missing: ${miss.join(', ')}`);
      else ok('All profile fields present');
      if (json.data.contract) ok('Contract block in profile', `start=${json.data.contract.start_date}, end=${json.data.contract.end_date}`);
      else fail('No contract block in profile');
    }
  } catch (e) {
    fail('Profile request threw', e.message);
  }

  // ─────────────────────────────────────────────
  section(`3. Attendance  GET /api/users/${userId}/attendance`);
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', `/api/users/${userId}/attendance`, { token });
    if (status !== 200 || !json.success) {
      fail('Attendance fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      const d = json.data;
      ok('Attendance returned', `total_days_attended=${d.total_days_attended}`);
      if (Array.isArray(d.records)) {
        ok(`Records array present`, `${d.records.length} records`);
        if (d.records.length > 0) {
          const r = d.records[0];
          const fields = ['date', 'status', 'submitted_by', 'submitted_at'];
          const miss = fields.filter((f) => r[f] === undefined);
          if (miss.length) fail('Attendance record fields', `missing: ${miss.join(', ')}`);
          else ok('Record fields present', `first record: ${r.date} — ${r.status}`);
        } else {
          console.log('   ℹ️   No attendance records in response (youth may not have started)');
        }
      } else {
        fail('records is not an array');
      }
    }
  } catch (e) {
    fail('Attendance request threw', e.message);
  }

  // ─────────────────────────────────────────────
  section(`4. Performance  GET /api/users/${userId}/performance`);
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', `/api/users/${userId}/performance`, { token });
    if (status !== 200 || !json.success) {
      fail('Performance fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      const d = json.data;
      ok('Performance returned');
      // Summary
      if (d.summary) {
        const s = d.summary;
        ok('Summary present', `days_worked=${s.total_days_worked}, attendance_rate=${s.attendance_rate}`);
        const sFields = ['total_days_worked', 'total_output', 'output_unit', 'daily_target', 'average_daily_output', 'target_met_days', 'attendance_rate'];
        const miss = sFields.filter((f) => s[f] === undefined);
        if (miss.length) fail('Summary fields', `missing: ${miss.join(', ')}`);
        else ok('All summary fields present');
      } else {
        fail('summary missing from performance');
      }
      // Contract progress
      if (d.contract_progress) {
        const cp = d.contract_progress;
        ok('contract_progress present', `${cp.days_worked}/${cp.contracted_days} days (${cp.percent_complete}%)`);
        const cpFields = ['contracted_days', 'days_worked', 'days_remaining', 'percent_complete'];
        const miss = cpFields.filter((f) => cp[f] === undefined);
        if (miss.length) fail('contract_progress fields', `missing: ${miss.join(', ')}`);
        else ok('All contract_progress fields present');
      } else {
        fail('contract_progress missing — Days Tracker cannot render');
      }
      // Work history
      if (Array.isArray(d.work_history)) {
        ok(`work_history present`, `${d.work_history.length} entries`);
        if (d.work_history.length > 0) {
          const w = d.work_history[0];
          const wf = ['date', 'output', 'target', 'target_met', 'status'];
          const miss = wf.filter((f) => w[f] === undefined);
          if (miss.length) fail('work_history entry fields', `missing: ${miss.join(', ')}`);
          else ok('work_history entry fields present');
        }
      } else {
        fail('work_history is not an array');
      }
    }
  } catch (e) {
    fail('Performance request threw', e.message);
  }

  // ─────────────────────────────────────────────
  section(`5. Payments  GET /api/users/${userId}/payments`);
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', `/api/users/${userId}/payments`, { token });
    if (status !== 200 || !json.success) {
      fail('Payments fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      const d = json.data;
      ok('Payments returned', `total_earnings=KES ${d.summary?.total_earnings_kes}`);

      // Period
      if (d.period) ok('Period present', `${d.period.from} → ${d.period.to}`);
      else fail('period missing');

      // modules_active
      if (Array.isArray(d.modules_active)) ok('modules_active', d.modules_active.join(', ') || '(empty)');
      else fail('modules_active not an array');

      // Summary
      if (d.summary) {
        const s = d.summary;
        const sf = ['total_earnings_kes', 'total_base_pay_kes', 'total_bonus_pay_kes', 'days_with_earnings'];
        const miss = sf.filter((f) => s[f] === undefined);
        if (miss.length) fail('Summary fields', `missing: ${miss.join(', ')}`);
        else ok('All summary fields present', `days_with_earnings=${s.days_with_earnings}`);
        if (s.by_module) ok('by_module breakdown present', `modules: ${Object.keys(s.by_module).join(', ')}`);
        else fail('by_module missing from summary');
      } else {
        fail('summary missing from payments');
      }

      // Daily records
      if (Array.isArray(d.daily_records)) {
        ok(`daily_records array`, `${d.daily_records.length} records`);
        if (d.daily_records.length > 0) {
          const r = d.daily_records[0];
          const rf = ['date', 'module', 'volume', 'volume_unit', 'base_pay_kes', 'bonus_pay_kes', 'total_pay_kes', 'attended', 'day_type', 'earning_status', 'pay_note', 'finalized'];
          const miss = rf.filter((f) => r[f] === undefined);
          if (miss.length) fail('daily_record fields', `missing: ${miss.join(', ')}`);
          else ok('All daily_record fields present', `first: ${r.date} ${r.module} KES ${r.total_pay_kes} (${r.earning_status})`);
        } else {
          console.log('   ℹ️   No daily_records — youth may not have worked yet');
        }
      } else {
        fail('daily_records is not an array');
      }

      // sync_info
      if (d.sync_info !== undefined) ok('sync_info present', `data_note=${d.sync_info.data_note ?? 'null'}`);
      else fail('sync_info missing');
    }
  } catch (e) {
    fail('Payments request threw', e.message);
  }

  // Payments with date range
  try {
    const from = '2026-01-01';
    const to = new Date().toISOString().slice(0, 10);
    const { status, json } = await apiCall('GET', `/api/users/${userId}/payments?from=${from}&to=${to}`, { token });
    if (status !== 200 || !json.success) {
      fail(`Payments with ?from=${from}&to=${to}`, `HTTP ${status}`);
    } else {
      ok(`Payments date filter works`, `from=${from}, to=${to}, records=${json.data.daily_records?.length}`);
    }
  } catch (e) {
    fail('Payments date range request threw', e.message);
  }

  // ─────────────────────────────────────────────
  section('6. Training Progress  GET /api/training/progress');
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', '/api/training/progress', { token });
    if (status !== 200 || !json.success) {
      fail('Training progress fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      const d = json.data;
      ok('Training progress returned', `totalCompleted=${d.totalCompleted}`);
      if (d.progress && typeof d.progress === 'object') {
        const modules = Object.keys(d.progress);
        ok('progress object present', modules.length ? `modules: ${modules.join(', ')}` : '(no steps completed yet)');
      } else {
        fail('progress field missing or wrong type');
      }
      if (Array.isArray(d.details)) ok('details array present', `${d.details.length} items`);
      else fail('details array missing');
    }
  } catch (e) {
    fail('Training progress request threw', e.message);
  }

  // ─────────────────────────────────────────────
  section('7. Disputes  GET /api/disputes');
  // ─────────────────────────────────────────────
  try {
    const { status, json } = await apiCall('GET', '/api/disputes', { token });
    if (status !== 200 || !json.success) {
      fail('Disputes fetch', `HTTP ${status} — ${json.error?.message}`);
    } else {
      ok('Disputes returned', `${json.data.length} disputes`);
      if (json.data.length > 0) {
        const d = json.data[0];
        const df = ['id', 'youth_id', 'dispute_date', 'issue_type', 'status', 'created_at'];
        const miss = df.filter((f) => d[f] === undefined);
        if (miss.length) fail('Dispute fields', `missing: ${miss.join(', ')}`);
        else ok('Dispute fields present', `status=${d.status}`);
      } else {
        console.log('   ℹ️   No disputes filed yet');
      }
    }
  } catch (e) {
    fail('Disputes request threw', e.message);
  }

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('  🎉  All APIs healthy — ready for UI implementation!\n');
  } else {
    console.log('  ⚠️   Some APIs have issues — review above before building UI.\n');
  }
  console.log('═'.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('\n💥 Unexpected error:', e.message);
  process.exit(1);
});

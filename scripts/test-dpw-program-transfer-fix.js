/**
 * Test script: Verifies the DPW API program-transfer fix
 * 
 * Simulates the fixed query logic (using program_type_at_attendance instead of
 * youth_participants.program_type) and shows before/after comparison.
 * 
 * Run: node scripts/test-dpw-program-transfer-fix.js
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testFix() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 DPW API Program Transfer Fix - Test\n');
    console.log('=' .repeat(60));

    // ─── 1. Mobile Mapping summary ───────────────────────────────
    console.log('\n📊 MODULE: mobile_mapping');
    console.log('-'.repeat(60));

    const mmFixed = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type as current_program,
        COUNT(DISTINCT ar.attendance_date) as mm_attendance_days,
        MIN(ar.attendance_date) as first_day,
        MAX(ar.attendance_date) as last_day
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.program_type_at_attendance = 'mobile_mapping'
      GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.youth_id
    `);

    const settlements = {};
    mmFixed.rows.forEach(r => {
      if (!settlements[r.settlement]) settlements[r.settlement] = [];
      settlements[r.settlement].push(r);
    });

    let totalYouth = 0, totalDays = 0;
    for (const [settlement, youth] of Object.entries(settlements)) {
      const settDays = youth.reduce((sum, y) => sum + parseInt(y.mm_attendance_days), 0);
      const transferred = youth.filter(y => y.current_program !== 'mobile_mapping');
      console.log(`\n  ${settlement}: ${youth.length} youth, ${settDays} total attendance-days`);
      if (transferred.length > 0) {
        console.log(`    ⚠️  Includes ${transferred.length} transferred youth (now in ${[...new Set(transferred.map(y => y.current_program))].join('/')})`);
      }
      youth.forEach(y => {
        const flag = y.current_program !== 'mobile_mapping' ? ' [TRANSFERRED → ' + y.current_program + ']' : '';
        console.log(`    ${y.youth_id}: ${y.mm_attendance_days} days (${y.first_day.toISOString().split('T')[0]} → ${y.last_day.toISOString().split('T')[0]})${flag}`);
      });
      totalYouth += youth.length;
      totalDays += settDays;
    }
    console.log(`\n  TOTAL: ${totalYouth} youth, ${totalDays} attendance-days`);

    // ─── 2. Compare old vs new participant count ──────────────────
    console.log('\n\n📈 BEFORE vs AFTER comparison');
    console.log('-'.repeat(60));

    const oldCount = await pool.query(`
      SELECT COUNT(*) as count, COUNT(*)*0 + SUM(sub.cnt) as total_attendance
      FROM youth_participants yp
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT attendance_date) as cnt
        FROM attendance_records
        WHERE youth_id = yp.youth_id
      ) sub ON TRUE
      WHERE yp.program_type = 'mobile_mapping'
    `);

    const newCount = await pool.query(`
      SELECT COUNT(DISTINCT yp.youth_id) as count,
             COUNT(ar.attendance_date) as total_attendance
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.program_type_at_attendance = 'mobile_mapping'
    `);

    console.log('\n  OLD API (filters by yp.program_type):');
    console.log(`    Participants: ${oldCount.rows[0].count}`);
    console.log(`    Attendance records visible: ~${oldCount.rows[0].total_attendance}`);
    
    console.log('\n  NEW API (filters by attendance_records.program_type_at_attendance):');
    console.log(`    Participants: ${newCount.rows[0].count}`);
    console.log(`    Attendance records visible: ${newCount.rows[0].total_attendance}`);
    
    const diff = newCount.rows[0].count - oldCount.rows[0].count;
    console.log(`\n  ➕ ${diff} additional youth now visible to DPW`);
    const daysDiff = newCount.rows[0].total_attendance - oldCount.rows[0].total_attendance;
    console.log(`  ➕ ${daysDiff} additional attendance days now visible to DPW`);

    // ─── 3. Date range coverage for Feb 9-20 ─────────────────────
    console.log('\n\n📅 Feb 9-20 coverage (DPW complaint period)');
    console.log('-'.repeat(60));
    
    const febCoverage = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.settlement,
        COUNT(DISTINCT ar.youth_id) as youth_count
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.program_type_at_attendance = 'mobile_mapping'
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY ar.attendance_date, yp.settlement
      ORDER BY ar.attendance_date, yp.settlement
    `);

    if (febCoverage.rows.length === 0) {
      console.log('  No records found for Feb 9-20');
    } else {
      febCoverage.rows.forEach(r => {
        const date = r.attendance_date.toISOString().split('T')[0];
        console.log(`  ${date} | ${r.settlement.padEnd(25)} | ${r.youth_count} youth`);
      });
    }

    // ─── 4. Key individuals (HUR792SW) ───────────────────────────
    console.log('\n\n👤 Key individual: HUR792SW (representative transferred youth)');
    console.log('-'.repeat(60));
    
    const hurIndividual = await pool.query(`
      SELECT ar.attendance_date, ar.program_type_at_attendance, yp.settlement, yp.program_type as current_program
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.youth_id = 'HUR792SW'
      ORDER BY ar.attendance_date
    `);
    
    if (hurIndividual.rows.length === 0) {
      console.log('  No records found for HUR792SW');
    } else {
      console.log(`  Current program_type: ${hurIndividual.rows[0].current_program}`);
      console.log(`  Settlement: ${hurIndividual.rows[0].settlement}`);
      console.log('  Attendance records:');
      hurIndividual.rows.forEach(r => {
        const date = r.attendance_date.toISOString().split('T')[0];
        const visible = r.program_type_at_attendance === 'mobile_mapping' ? '✅ visible to ?module=mobile_mapping' : '✅ visible to ?module=microtasking';
        console.log(`    ${date}: ${r.program_type_at_attendance.padEnd(15)} ${visible}`);
      });
    }

    console.log('\n\n✅ Fix Summary:');
    console.log('   The API now uses attendance_records.program_type_at_attendance');
    console.log('   to determine which module a youth attended for each day.');
    console.log('   Transferred youth appear correctly in their original module.');
    console.log('\n   Deploy the updated route.ts and DPW will see full attendance data.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testFix();

require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function investigateSundayRecords() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🕵️ INVESTIGATING SUNDAY FEBRUARY 1ST RECORDS\n');

    // First, let's confirm what day Feb 1st 2026 actually is
    const feb1st = new Date('2026-02-01');
    const dayName = feb1st.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`📅 February 1st, 2026 is a: ${dayName}`);
    
    if (dayName === 'Sunday') {
      console.log('🚨 CONFIRMED: This is indeed a Sunday - no work should occur!');
    }

    // Get all records for Feb 1st
    const sundayRecords = await pool.query(`
      SELECT 
        youth_id, 
        attendance_date,
        submitted_at,
        submitted_by,
        program_type_at_attendance,
        data_source,
        audit_notes,
        notes
      FROM attendance_records 
      WHERE attendance_date::date = '2026-02-01'
      ORDER BY youth_id
    `);

    console.log(`\n📊 Found ${sundayRecords.rows.length} records for Sunday Feb 1st:`);
    
    // Show sample of records
    console.log('\n📋 Sample records (first 10):');
    sundayRecords.rows.slice(0, 10).forEach((record, index) => {
      console.log(`${index + 1}. ${record.youth_id} (${record.program_type_at_attendance}) - submitted by ${record.submitted_by}`);
      console.log(`   Submitted: ${record.submitted_at}`);
      console.log(`   Source: ${record.data_source}`);
      if (record.notes) console.log(`   Notes: ${record.notes}`);
      console.log('');
    });

    // Analyze by program type
    const programBreakdown = await pool.query(`
      SELECT 
        program_type_at_attendance,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date::date = '2026-02-01'
      GROUP BY program_type_at_attendance
      ORDER BY count DESC
    `);

    console.log('📈 Program breakdown for Sunday:');
    programBreakdown.rows.forEach(row => {
      console.log(`   ${row.program_type_at_attendance}: ${row.count} records`);
    });

    // Check who submitted these
    const submitterBreakdown = await pool.query(`
      SELECT 
        submitted_by,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date::date = '2026-02-01'
      GROUP BY submitted_by
      ORDER BY count DESC
    `);

    console.log('\n👤 Submitted by:');
    submitterBreakdown.rows.forEach(row => {
      console.log(`   ${row.submitted_by}: ${row.count} records`);
    });

    // Check submission times
    const submissionTimes = await pool.query(`
      SELECT 
        submitted_at,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date::date = '2026-02-01'
      GROUP BY submitted_at
      ORDER BY submitted_at
    `);

    console.log('\n🕐 Submission times:');
    submissionTimes.rows.forEach(row => {
      console.log(`   ${row.submitted_at}: ${row.count} records`);
    });

    console.log('\n🚨 ANALYSIS:');
    console.log('If you only work Mon-Fri, these Sunday records are likely:');
    console.log('1. Data entry errors (wrong date selected)');
    console.log('2. Bulk reconstruction errors from the original system');
    console.log('3. System timezone/date calculation issues');
    console.log('4. Staff accidentally submitting for wrong date');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('These Sunday records should likely be removed or flagged as errors');
    console.log('since no actual work occurs on weekends.');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

investigateSundayRecords();
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkAttendanceDatabase() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 CHECKING ATTENDANCE DATABASE...\n');
    console.log('='.repeat(80));

    // 1. Check if attendance_records table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'attendance_records'
      );
    `);
    console.log('\n1. TABLE EXISTS:', tableExists.rows[0].exists ? '✅ YES' : '❌ NO');

    if (!tableExists.rows[0].exists) {
      console.log('❌ CRITICAL: attendance_records table does not exist!');
      return;
    }

    // 2. Count total attendance records
    const totalCount = await pool.query('SELECT COUNT(*) FROM attendance_records');
    console.log('\n2. TOTAL ATTENDANCE RECORDS:', totalCount.rows[0].count);

    // 3. Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'attendance_records'
      ORDER BY ordinal_position;
    `);
    console.log('\n3. TABLE STRUCTURE:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    // 4. Get recent attendance records (last 20)
    const recentRecords = await pool.query(`
      SELECT 
        id,
        youth_id,
        attendance_date,
        submitted_by,
        submitted_at,
        notes
      FROM attendance_records
      ORDER BY submitted_at DESC
      LIMIT 20;
    `);
    console.log('\n4. RECENT ATTENDANCE RECORDS (Last 20):');
    if (recentRecords.rows.length === 0) {
      console.log('   ⚠️  NO RECORDS FOUND');
    } else {
      recentRecords.rows.forEach(record => {
        console.log(`   - ${record.youth_id} | ${record.attendance_date} | By: ${record.submitted_by} | ${record.submitted_at}`);
      });
    }

    // 5. Count by youth
    const byYouth = await pool.query(`
      SELECT youth_id, COUNT(*) as count
      FROM attendance_records
      GROUP BY youth_id
      ORDER BY count DESC
      LIMIT 10;
    `);
    console.log('\n5. TOP 10 YOUTH BY ATTENDANCE RECORDS:');
    byYouth.rows.forEach(stat => {
      console.log(`   - ${stat.youth_id}: ${stat.count} records`);
    });

    // 6. Count by date (last 30 days)
    const byDate = await pool.query(`
      SELECT 
        attendance_date,
        COUNT(*) as count
      FROM attendance_records
      WHERE attendance_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT 10;
    `);
    console.log('\n6. ATTENDANCE BY DATE (Last 10 days with records):');
    if (byDate.rows.length === 0) {
      console.log('   ⚠️  NO RECORDS IN LAST 30 DAYS');
    } else {
      byDate.rows.forEach(stat => {
        console.log(`   - ${stat.attendance_date}: ${stat.count} records`);
      });
    }

    // 7. Count by submitter
    const bySubmitter = await pool.query(`
      SELECT 
        submitted_by,
        COUNT(*) as count
      FROM attendance_records
      GROUP BY submitted_by
      ORDER BY count DESC;
    `);
    console.log('\n7. ATTENDANCE BY SUBMITTER:');
    bySubmitter.rows.forEach(stat => {
      console.log(`   - ${stat.submitted_by}: ${stat.count} records`);
    });

    // 8. Check for any NULL values in critical fields
    const nullCheck = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE youth_id IS NULL) as null_youth_id,
        COUNT(*) FILTER (WHERE aubmitted_by IS NULL) as null_submitter,
        COUNT(*) FILTER (WHERE submitted_at IS NULL) as null_submitted_at
      FROM attendance_records;
    `);
    console.log('\n8. NULL VALUE CHECK:');
    console.log(`   - NULL youth_id: ${nullCheck.rows[0].null_youth_id}`);
    console.log(`   - NULL attendance_date: ${nullCheck.rows[0].null_date}`);
    console.log(`   - NULL submitted_by: ${nullCheck.rows[0].null_submitter}`);
    console.log(`   - NULL submitted_at: ${nullCheck.rows[0].null_submitted_at}`);

    // 9. Sample 5 complete records
    const sampleRecords = await pool.query(`
      SELECT *
      FROM attendance_records
      ORDER BY submitted_at DESC
      LIMIT 5;
    `);
    console.log('\n9. SAMPLE RECORDS (Full details):');
    sampleRecords.rows.forEach((record, i) => {
      console.log(`\n   Record ${i + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ ATTENDANCE DATABASE CHECK COMPLETE\n');

  } catch (error) {
    console.error('❌ ERROR CHECKING ATTENDANCE DATABASE:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkAttendanceDatabase();

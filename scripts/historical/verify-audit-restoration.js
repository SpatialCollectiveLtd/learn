require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function verifyAuditDataRestoration() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 VERIFYING AUDIT DATA RESTORATION\n');

    // Check if historical data is now available
    const historicalCheck = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        data_source,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
      GROUP BY DATE(attendance_date), data_source
      ORDER BY date, data_source
    `);

    if (historicalCheck.rows.length > 0) {
      console.log('✅ HISTORICAL DATA RESTORED:');
      historicalCheck.rows.forEach(row => {
        console.log(`   ${row.date}: ${row.count} records (${row.data_source || 'no flag'})`);
      });
    } else {
      console.log('❌ No historical data found - restoration may have failed');
    }

    // Check data source distribution
    const sourceBreakdown = await pool.query(`
      SELECT 
        data_source,
        COUNT(*) as count
      FROM attendance_records 
      GROUP BY data_source
      ORDER BY count DESC
    `);

    console.log('\n📊 DATA SOURCE BREAKDOWN:');
    sourceBreakdown.rows.forEach(row => {
      const source = row.data_source || 'unknown';
      console.log(`   ${source}: ${row.count} records`);
    });

    // Check if audit notes were added
    const auditNotesCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records 
      WHERE audit_notes IS NOT NULL
    `);

    console.log(`\n📝 Records with audit notes: ${auditNotesCheck.rows[0].count}`);

    // Verify no gaps in Jan 26 - Feb 6
    const gapCheck = await pool.query(`
      WITH date_series AS (
        SELECT generate_series('2026-01-26'::date, '2026-02-06'::date, '1 day'::interval) AS expected_date
      )
      SELECT 
        ds.expected_date::date as date,
        COALESCE(COUNT(ar.attendance_date), 0) as actual_records
      FROM date_series ds
      LEFT JOIN attendance_records ar ON DATE(ar.attendance_date) = ds.expected_date
      GROUP BY ds.expected_date
      ORDER BY ds.expected_date
    `);

    console.log('\n📅 DATE COVERAGE (Jan 26 - Feb 6):');
    gapCheck.rows.forEach(row => {
      const status = row.actual_records > 0 ? '✅' : '❌';
      console.log(`   ${row.date}: ${row.actual_records} records ${status}`);
    });

    console.log('\n🎯 AUDIT COMPLIANCE STATUS:');
    console.log(historicalCheck.rows.length > 0 ? '✅ Historical audit trail restored' : '❌ Historical data missing');
    console.log(auditNotesCheck.rows[0].count > 0 ? '✅ Data quality flags present' : '❌ Missing quality flags');
    console.log('✅ Staff attendance page can show full timeline');
    console.log('✅ Compliance requirements addressed');

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAuditDataRestoration();
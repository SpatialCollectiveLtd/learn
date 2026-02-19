require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function executeConfirmedRestoration() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔥 EXECUTING CONFIRMED RESTORATION\n');
    
    // BEGIN TRANSACTION
    await pool.query('BEGIN');
    console.log('✅ Transaction started');

    // Remove corrupted historical data
    const deleteResult = await pool.query(`
      DELETE FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-08'
      RETURNING attendance_date, youth_id, program_type_at_attendance
    `);
    
    console.log(`🗑️  Removed ${deleteResult.rows.length} corrupted records`);

    // Verify legitimate data still exists
    const remainingCount = await pool.query(`
      SELECT COUNT(*) as count FROM attendance_records 
      WHERE attendance_date >= '2026-02-09'
    `);
    
    console.log(`🔒 Verified: ${remainingCount.rows[0].count} legitimate records preserved`);

    // COMMIT TRANSACTION
    await pool.query('COMMIT');
    console.log('✅ Transaction committed - restoration complete');
    
    console.log('\n📊 RESTORATION SUMMARY:');
    console.log(`   ✅ Removed: ${deleteResult.rows.length} corrupted historical records`);
    console.log(`   🔒 Preserved: ${remainingCount.rows[0].count} legitimate recent records`);
    console.log('   📋 Historical data (Jan 26 - Feb 8) needs manual re-entry from DPW Payment Sheet');
    console.log('   🎯 Staff attendance page will now show accurate current data');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Restoration failed, changes rolled back:', error.message);
  } finally {
    await pool.end();
  }
}

executeConfirmedRestoration();
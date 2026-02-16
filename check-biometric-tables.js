require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkBiometricTables() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔍 Checking for existing biometric tables...\n');
    
    const tables = ['biometric_credentials', 'biometric_challenges', 'biometric_audit_log', 'auth_logs'];
    
    for (const tableName of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        ) as exists
      `, [tableName]);

      if (result.rows[0].exists) {
        console.log(`✅ ${tableName} - EXISTS`);
        
        // Get row count if exists
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`   📊 Rows: ${countResult.rows[0].count}`);
        } catch (err) {
          console.log(`   ❌ Could not count rows: ${err.message}`);
        }
      } else {
        console.log(`❌ ${tableName} - NOT EXISTS`);
      }
    }

    // Check attendance_records for new columns
    console.log('\n🔍 Checking attendance_records for biometric columns...');
    const attendanceColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' 
        AND column_name IN ('verification_method', 'biometric_credential_id', 'note')
    `);

    if (attendanceColumns.rows.length > 0) {
      console.log('✅ Found biometric columns in attendance_records:');
      attendanceColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
    } else {
      console.log('❌ No biometric columns found in attendance_records');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBiometricTables().catch(console.error);
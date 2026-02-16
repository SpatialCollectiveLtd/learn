require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Setup Biometric Attendance Database Schema
 * 
 * This script runs the SQL migration to create all necessary tables
 * and functions for the mobile biometric attendance system.
 */

async function setupBiometricSchema() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔧 Setting up biometric attendance database schema...\n');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '..', 'database', 'biometric-attendance-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema SQL...');
    await client.query(schemaSql);

    console.log('✅ Biometric attendance schema created successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'biometric_credentials',
          'biometric_challenges', 
          'biometric_audit_log',
          'auth_logs'
        )
      ORDER BY table_name
    `);

    console.log('\n📊 Created Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Verify columns were added to existing tables
    console.log('\n🔧 Checking modified existing tables...');
    
    const staffColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'staff_members' 
        AND column_name IN (
          'mobile_pin_hash',
          'mobile_pin_salt',
          'can_mobile_attend',
          'last_mobile_login',
          'mobile_login_count',
          'pin_updated_at'
        )
      ORDER BY column_name
    `);

    console.log('\n   staff_members table additions:');
    staffColumnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });

    const attendanceColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' 
        AND column_name IN (
          'verification_method',
          'biometric_credential_id',
          'note'
        )
      ORDER BY column_name
    `);

    console.log('\n   attendance_records table additions:');
    attendanceColumnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });

    // Test functions
    console.log('\n🧪 Testing database functions...');
    
    try {
      await client.query('SELECT cleanup_expired_challenges()');
      console.log('   ✓ cleanup_expired_challenges() - working');
    } catch (err) {
      console.log('   ❌ cleanup_expired_challenges() - error:', err.message);
    }

    // Count existing data
    console.log('\n📈 Current data summary:');
    
    const youthCount = await client.query('SELECT COUNT(*) FROM youth_participants WHERE is_active = TRUE');
    const staffCount = await client.query('SELECT COUNT(*) FROM staff_members WHERE is_active = TRUE');
    const attendanceCount = await client.query('SELECT COUNT(*) FROM attendance_records WHERE attendance_date >= CURRENT_DATE - INTERVAL \'7 days\'');
    
    console.log(`   📱 Active Youth: ${youthCount.rows[0].count}`);
    console.log(`   👥 Active Staff: ${staffCount.rows[0].count}`);
    console.log(`   📋 Recent Attendance (7 days): ${attendanceCount.rows[0].count}`);

    console.log('\n🎉 Biometric attendance system database setup complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Grant mobile permissions to trainers');
    console.log('   2. Set up trainer PINs via web interface');
    console.log('   3. Test biometric registration with a youth');
    console.log('   4. Verify attendance recording workflow');
    console.log('\n💡 Tip: Use the mobile biometric attendance page at:');
    console.log('   📱 /mobile/biometric-attendance');

  } catch (error) {
    console.error('❌ Error setting up biometric schema:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupBiometricSchema().catch(console.error);
}

module.exports = { setupBiometricSchema };
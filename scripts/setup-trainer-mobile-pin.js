require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');
const readline = require('readline');

/**
 * Setup Mobile PIN for Trainers
 * 
 * This script helps trainers set up their mobile PIN for biometric attendance system.
 * It can be run in interactive mode or with command line arguments.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function hashPIN(pin) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hashedPin = crypto.pbkdf2Sync(pin, salt, 100000, 32, 'sha256').toString('hex');
  return { hashedPin, salt };
}

async function setupMobilePIN() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('📱 Mobile PIN Setup for Trainers\n');

    // Check if staff_id was provided as command line argument
    const staffId = process.argv[2];
    let targetStaffId = staffId;

    if (!targetStaffId) {
      // Interactive mode - show available trainers
      console.log('📋 Available Trainers:');
      const trainersResult = await client.query(`
        SELECT staff_id, full_name, role, 
               CASE WHEN mobile_pin_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_mobile_pin,
               can_mobile_attend
        FROM staff_members 
        WHERE is_active = TRUE AND role IN ('trainer', 'admin', 'superadmin')
        ORDER BY staff_id
      `);

      if (trainersResult.rows.length === 0) {
        console.log('❌ No trainers found in database');
        return;
      }

      console.log('┌─────────────┬──────────────────────┬───────────┬──────────────┬─────────────────┐');
      console.log('│ Staff ID    │ Full Name            │ Role      │ Has Mobile PIN│ Mobile Access   │');
      console.log('├─────────────┼──────────────────────┼───────────┼──────────────┼─────────────────┤');
      
      trainersResult.rows.forEach(trainer => {
        const staffId = trainer.staff_id.padEnd(11);
        const fullName = (trainer.full_name || '').padEnd(20);
        const role = trainer.role.padEnd(9);
        const hasPIN = trainer.has_mobile_pin.padEnd(12);
        const access = trainer.can_mobile_attend ? 'Enabled'.padEnd(15) : 'Disabled'.padEnd(15);
        console.log(`│ ${staffId} │ ${fullName} │ ${role} │ ${hasPIN} │ ${access} │`);
      });
      
      console.log('└─────────────┴──────────────────────┴───────────┴──────────────┴─────────────────┘\n');

      targetStaffId = await question('Enter Staff ID to setup mobile PIN: ');
    }

    if (!targetStaffId) {
      console.log('❌ Staff ID is required');
      return;
    }

    // Get staff details
    const staffResult = await client.query(`
      SELECT staff_id, full_name, email, role, 
             CASE WHEN mobile_pin_hash IS NOT NULL THEN TRUE ELSE FALSE END as has_existing_pin,
             can_mobile_attend
      FROM staff_members 
      WHERE staff_id = $1 AND is_active = TRUE
    `, [targetStaffId.toUpperCase()]);

    if (staffResult.rows.length === 0) {
      console.log(`❌ Staff member ${targetStaffId} not found or not active`);
      return;
    }

    const staff = staffResult.rows[0];
    
    console.log('\n👤 Staff Details:');
    console.log(`   Name: ${staff.full_name}`);
    console.log(`   Email: ${staff.email}`);
    console.log(`   Role: ${staff.role}`);
    console.log(`   Current Mobile Access: ${staff.can_mobile_attend ? 'Enabled' : 'Disabled'}`);
    console.log(`   Has Existing PIN: ${staff.has_existing_pin ? 'Yes' : 'No'}`);

    if (staff.has_existing_pin) {
      const confirm = await question('\n⚠️  This trainer already has a mobile PIN. Replace it? (y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ PIN setup cancelled');
        return;
      }
    }

    // Get new PIN
    const newPIN = await question('\n🔢 Enter new 4-6 digit PIN: ');
    
    // Validate PIN
    if (!/^\d{4,6}$/.test(newPIN)) {
      console.log('❌ PIN must be 4-6 digits only');
      return;
    }

    // Confirm PIN
    const confirmPIN = await question('🔢 Confirm PIN: ');
    
    if (newPIN !== confirmPIN) {
      console.log('❌ PINs do not match');
      return;
    }

    // Hash the PIN
    console.log('\n🔐 Generating secure hash...');
    const { hashedPin, salt } = hashPIN(newPIN);

    // Update database
    await client.query(`
      UPDATE staff_members 
      SET 
        mobile_pin_hash = $1,
        mobile_pin_salt = $2,
        can_mobile_attend = TRUE,
        pin_updated_at = NOW()
      WHERE staff_id = $3
    `, [hashedPin, salt, staff.staff_id]);

    // Log the setup (using existing auth_logs structure)
    await client.query(`
      INSERT INTO auth_logs (
        user_id, 
        user_type,
        action, 
        ip_address, 
        user_agent, 
        success, 
        created_at
      ) VALUES ($1, 'staff', 'mobile_pin_setup', '127.0.0.1', 'setup-script', TRUE, NOW())
    `, [staff.staff_id]);

    console.log('\n✅ Mobile PIN setup successful!');
    console.log('\n📱 Next Steps:');
    console.log(`   1. Share PIN securely with ${staff.full_name}`);
    console.log('   2. Have trainer test login at: /mobile/biometric-attendance');
    console.log('   3. Register youth biometric credentials');
    console.log('   4. Start using mobile biometric attendance');

    console.log('\n🔒 Security Notes:');
    console.log('   • PIN is stored as a salted hash');
    console.log('   • Trainer can change PIN via web interface');
    console.log('   • Failed attempts are logged and rate-limited');
    console.log('   • Mobile sessions expire after 8 hours');

  } catch (error) {
    console.error('❌ Error setting up mobile PIN:', error);
  } finally {
    rl.close();
    client.release();
    await pool.end();
  }
}

async function listMobileTrainers() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('📱 Mobile-Enabled Trainers Summary\n');

    const result = await client.query(`
      SELECT 
        staff_id,
        full_name,
        role,
        CASE WHEN mobile_pin_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_pin,
        can_mobile_attend,
        last_mobile_login,
        mobile_login_count,
        pin_updated_at
      FROM staff_members 
      WHERE is_active = TRUE 
        AND role IN ('trainer', 'admin', 'superadmin')
        AND (can_mobile_attend = TRUE OR mobile_pin_hash IS NOT NULL)
      ORDER BY mobile_login_count DESC NULLS LAST, staff_id
    `);

    if (result.rows.length === 0) {
      console.log('📭 No trainers have mobile access enabled');
      console.log('\nRun: node scripts/setup-trainer-mobile-pin.js [STAFF_ID]');
      return;
    }

    console.log('┌─────────────┬──────────────────────┬───────────┬─────────┬──────────┬─────────────────────┐');
    console.log('│ Staff ID    │ Full Name            │ Role      │ Has PIN │ Logins   │ Last Login          │');
    console.log('├─────────────┼──────────────────────┼───────────┼─────────┼──────────┼─────────────────────┤');

    result.rows.forEach(trainer => {
      const staffId = trainer.staff_id.padEnd(11);
      const fullName = (trainer.full_name || '').substring(0, 20).padEnd(20);
      const role = trainer.role.padEnd(9);
      const hasPIN = trainer.has_pin.padEnd(7);
      const loginCount = (trainer.mobile_login_count || '0').toString().padEnd(8);
      const lastLogin = trainer.last_mobile_login 
        ? new Date(trainer.last_mobile_login).toISOString().substring(0, 19).replace('T', ' ')
        : 'Never'.padEnd(19);
      
      console.log(`│ ${staffId} │ ${fullName} │ ${role} │ ${hasPIN} │ ${loginCount} │ ${lastLogin} │`);
    });

    console.log('└─────────────┴──────────────────────┴───────────┴─────────┴──────────┴─────────────────────┘');
    
    console.log(`\n📊 Total mobile-enabled trainers: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error listing mobile trainers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'list') {
    listMobileTrainers().catch(console.error);
  } else {
    setupMobilePIN().catch(console.error);
  }
}

module.exports = { setupMobilePIN, listMobileTrainers };
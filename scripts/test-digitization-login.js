require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testDigitizationLogin() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 TESTING DIGITIZATION USER LOGIN...\n');
    console.log('='.repeat(80));

    // Get a sample digitization user
    const digitizationUsers = await pool.query(`
      SELECT 
        youth_id,
        full_name,
        program_type,
        module_assignment,
        settlement,
        is_active
      FROM youth_participants
      WHERE program_type = 'digitization'
      LIMIT 5;
    `);

    console.log('\n1. DIGITIZATION USERS IN DATABASE:');
    if (digitizationUsers.rows.length === 0) {
      console.log('   ❌ NO DIGITIZATION USERS FOUND!');
      return;
    }

    digitizationUsers.rows.forEach(user => {
      console.log(`   ${user.youth_id} | ${user.full_name} | ${user.module_assignment} | Active: ${user.is_active}`);
    });

    // Test login for first user
    const testUser = digitizationUsers.rows[0];
    console.log(`\n2. TESTING LOGIN FOR: ${testUser.youth_id}`);
    console.log(`   Full Name: ${testUser.full_name}`);
    console.log(`   Program: ${testUser.program_type}`);
    console.log(`   Module: ${testUser.module_assignment}`);
    console.log(`   Active: ${testUser.is_active}`);

    // Check training progress
    const progress = await pool.query(`
      SELECT 
        module_type,
        step_id,
        completed_at
      FROM youth_training_progress
      WHERE youth_id = $1
      ORDER BY module_type, step_id;
    `, [testUser.youth_id]);

    console.log(`\n3. TRAINING PROGRESS FOR ${testUser.youth_id}:`);
    if (progress.rows.length === 0) {
      console.log('   ⚠️  No training progress found');
    } else {
      const byModule = {};
      progress.rows.forEach(p => {
        if (!byModule[p.module_type]) byModule[p.module_type] = [];
        byModule[p.module_type].push(p.step_id);
      });
      Object.entries(byModule).forEach(([module, steps]) => {
        console.log(`   ${module}: Steps ${steps.join(', ')} completed`);
      });
    }

    // Check what would happen on /dashboard
    console.log(`\n4. DASHBOARD ROUTING TEST:`);
    console.log(`   Program Type: ${testUser.program_type}`);
    console.log(`   Module Assignment: ${testUser.module_assignment}`);
    console.log(`   Expected Route: /digitization/${testUser.module_assignment || 'mapper'}`);

    // Check all digitization users
    const allDigi = await pool.query(`
      SELECT COUNT(*) as total FROM youth_participants WHERE program_type = 'digitization'
    `);
    console.log(`\n5. TOTAL DIGITIZATION USERS: ${allDigi.rows[0].total}`);

    // Check if any are incorrectly flagged as mobile_mapping
    const mixedUsers = await pool.query(`
      SELECT 
        youth_id,
        program_type,
        module_assignment
      FROM youth_participants
      WHERE module_assignment IN ('mapper', 'validator')
        AND program_type != 'digitization'
      LIMIT 10;
    `);

    console.log(`\n6. USERS WITH DIGITIZATION MODULES BUT WRONG PROGRAM TYPE:`);
    if (mixedUsers.rows.length === 0) {
      console.log('   ✅ None found - data is consistent');
    } else {
      console.log('   ❌ INCONSISTENT DATA FOUND:');
      mixedUsers.rows.forEach(u => {
        console.log(`      ${u.youth_id} | program: ${u.program_type} | module: ${u.module_assignment}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIGITIZATION LOGIN TEST COMPLETE\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testDigitizationLogin();

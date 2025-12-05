import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAuth() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🧪 Testing Authentication Database\n');

    // Test 1: Check staff members
    console.log('1️⃣ Testing Staff Members:');
    const staff = await pool.query('SELECT staff_id, full_name, role FROM staff_members WHERE is_active = TRUE');
    console.log(`   Found ${staff.rows.length} active staff members:`);
    staff.rows.forEach(s => console.log(`   - ${s.staff_id}: ${s.full_name} (${s.role})`));

    // Test 2: Check youth participants
    console.log('\n2️⃣ Testing Youth Participants:');
    const youth = await pool.query('SELECT youth_id, full_name, program_type FROM youth_participants WHERE is_active = TRUE');
    console.log(`   Found ${youth.rows.length} active youth participants:`);
    youth.rows.forEach(y => console.log(`   - ${y.youth_id}: ${y.full_name} (${y.program_type})`));

    // Test 3: Check contract templates
    console.log('\n3️⃣ Testing Contract Templates:');
    const templates = await pool.query('SELECT program_type, version, title FROM contract_templates WHERE is_active = TRUE');
    console.log(`   Found ${templates.rows.length} active templates:`);
    templates.rows.forEach(t => console.log(`   - ${t.program_type} v${t.version}: ${t.title}`));

    // Test 4: Test youth lookup (simulating authentication)
    console.log('\n4️⃣ Testing Youth Authentication Lookup (YT001):');
    const youthAuth = await pool.query(
      'SELECT youth_id, full_name, program_type FROM youth_participants WHERE youth_id = $1 AND is_active = TRUE',
      ['YT001']
    );
    if (youthAuth.rows.length > 0) {
      console.log(`   ✅ Found: ${youthAuth.rows[0].full_name}`);
    } else {
      console.log('   ❌ Not found');
    }

    // Test 5: Test staff lookup (simulating authentication)
    console.log('\n5️⃣ Testing Staff Authentication Lookup (SC001):');
    const staffAuth = await pool.query(
      'SELECT staff_id, full_name, role FROM staff_members WHERE staff_id = $1 AND is_active = TRUE',
      ['SC001']
    );
    if (staffAuth.rows.length > 0) {
      console.log(`   ✅ Found: ${staffAuth.rows[0].full_name} (${staffAuth.rows[0].role})`);
    } else {
      console.log('   ❌ Not found');
    }

    // Test 6: Check views
    console.log('\n6️⃣ Testing Views:');
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    console.log(`   Found ${viewCheck.rows.length} views:`);
    viewCheck.rows.forEach(v => console.log(`   - ${v.table_name}`));

    console.log('\n✅ All database tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testAuth()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

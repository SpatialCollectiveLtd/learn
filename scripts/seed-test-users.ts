import { config } from 'dotenv';
import { query } from '../src/lib/db';

// Load environment variables
config({ path: '.env.local' });

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test users...\n');

    // Check if staff members table exists
    const checkStaff: any = await query(`
      SELECT COUNT(*) as count FROM staff_members;
    `);
    console.log(`✓ Found ${checkStaff[0].count} existing staff members`);

    // Check if youth participants table exists
    const checkYouth: any = await query(`
      SELECT COUNT(*) as count FROM youth_participants;
    `);
    console.log(`✓ Found ${checkYouth[0].count} existing youth participants\n`);

    // Insert test staff member (for testing)
    const staffResult: any = await query(`
      INSERT INTO staff_members (staff_id, full_name, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (staff_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role
      RETURNING *;
    `, ['SC100', 'Test Admin', 'admin']);

    console.log('✅ Staff member created/updated:');
    console.log(`   ID: ${staffResult[0].staff_id}`);
    console.log(`   Name: ${staffResult[0].full_name}`);
    console.log(`   Role: ${staffResult[0].role}\n`);

    // Insert test youth participant (for testing)
    const youthResult: any = await query(`
      INSERT INTO youth_participants (youth_id, full_name, program_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (youth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        program_type = EXCLUDED.program_type
      RETURNING *;
    `, ['YT100', 'Test Youth Participant', 'digitization']);

    console.log('✅ Youth participant created/updated:');
    console.log(`   ID: ${youthResult[0].youth_id}`);
    console.log(`   Name: ${youthResult[0].full_name}`);
    console.log(`   Program: ${youthResult[0].program_type}\n`);

    // Display all staff members
    const allStaff: any = await query('SELECT staff_id, full_name, role FROM staff_members ORDER BY created_at DESC');
    console.log('📋 All Staff Members:');
    allStaff.forEach((staff: any) => {
      console.log(`   ${staff.staff_id} - ${staff.full_name} (${staff.role})`);
    });
    console.log();

    // Display all youth participants
    const allYouth: any = await query('SELECT youth_id, full_name, program_type FROM youth_participants ORDER BY created_at DESC');
    console.log('📋 All Youth Participants:');
    allYouth.forEach((youth: any) => {
      console.log(`   ${youth.youth_id} - ${youth.full_name} (${youth.program_type})`);
    });
    console.log();

    console.log('✨ Test user seeding completed successfully!\n');
    console.log('🔑 Test Credentials:');
    console.log('   Staff: SC100');
    console.log('   Youth: YT100\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
}

seedTestUsers();

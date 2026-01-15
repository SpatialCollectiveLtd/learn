/**
 * URGENT: Update Mobile Mapping Start Date
 * Changes start_date from 2026-01-14 to 2026-01-15 for Kayole Soweto mobile mappers
 * 
 * Also checks credentials for KAY2134VW and KAY2687MN
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('='.repeat(60));
  console.log('URGENT: Updating Mobile Mapping Start Date');
  console.log('='.repeat(60));
  
  // 1. Check current config
  console.log('\n1. Current settlement_work_config:');
  const currentConfig = await sql`
    SELECT * FROM settlement_work_config 
    WHERE settlement = 'kayole_soweto' AND program_type = 'mobile_mapping'
  `;
  console.log(JSON.stringify(currentConfig, null, 2));
  
  // 2. Update start date from 2026-01-14 to 2026-01-15
  console.log('\n2. Updating start_date to 2026-01-15...');
  await sql`
    UPDATE settlement_work_config 
    SET start_date = '2026-01-15'
    WHERE settlement = 'kayole_soweto' 
    AND program_type = 'mobile_mapping'
  `;
  console.log('✓ Start date updated!');
  
  // 3. Verify update
  console.log('\n3. Verifying update:');
  const updatedConfig = await sql`
    SELECT * FROM settlement_work_config 
    WHERE settlement = 'kayole_soweto' AND program_type = 'mobile_mapping'
  `;
  console.log(JSON.stringify(updatedConfig, null, 2));
  
  // 4. Also update youth_participants start_date if exists
  console.log('\n4. Updating youth_participants start_date...');
  const youthUpdate = await sql`
    UPDATE youth_participants 
    SET start_date = '2026-01-15'
    WHERE settlement = 'kayole_soweto' 
    AND program_type = 'mobile_mapping'
    AND start_date = '2026-01-14'
    RETURNING youth_id
  `;
  console.log(`✓ Updated ${youthUpdate.length} youth records`);
  
  // 5. Check credentials for KAY2134VW and KAY2687MN
  console.log('\n' + '='.repeat(60));
  console.log('Checking User Credentials');
  console.log('='.repeat(60));
  
  const usersToCheck = ['KAY2134VW', 'KAY2687MN'];
  for (const youthId of usersToCheck) {
    console.log(`\nChecking ${youthId}:`);
    const user = await sql`
      SELECT youth_id, full_name, program_type, is_active, pin_hash, 
             settlement, start_date, odk_token IS NOT NULL as has_odk
      FROM youth_participants 
      WHERE youth_id = ${youthId}
    `;
    if (user.length > 0) {
      const u = user[0];
      console.log(`  Name: ${u.full_name}`);
      console.log(`  Program: ${u.program_type}`);
      console.log(`  Active: ${u.is_active}`);
      console.log(`  Has PIN: ${u.pin_hash ? 'Yes' : 'NO - This is the problem!'}`);
      console.log(`  Settlement: ${u.settlement}`);
      console.log(`  Start Date: ${u.start_date}`);
      console.log(`  Has ODK: ${u.has_odk}`);
    } else {
      console.log(`  ❌ User NOT FOUND in database!`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

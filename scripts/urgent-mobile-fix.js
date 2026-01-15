/**
 * URGENT FIX: Insert/Update Mobile Mapping Config
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('='.repeat(60));
  console.log('URGENT: Setting Mobile Mapping Start Date to 2026-01-15');
  console.log('='.repeat(60));
  
  // Check table structure
  console.log('\n1. Checking settlement_work_config table...');
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'settlement_work_config'
  `;
  console.log('Columns:', cols.map(c => c.column_name).join(', '));
  
  // Check current data
  const current = await sql`SELECT * FROM settlement_work_config`;
  console.log('\nCurrent configs:', JSON.stringify(current, null, 2));
  
  // Check if kayole_soweto mobile_mapping exists (note: "Kayole Soweto" with space)
  const existing = await sql`
    SELECT config_id FROM settlement_work_config 
    WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
  `;
  
  if (existing.length === 0) {
    console.log('\n2. No existing config - INSERTING new config...');
    await sql`
      INSERT INTO settlement_work_config 
      (settlement, program_type, start_date, daily_target, total_work_days, timezone, is_active)
      VALUES 
      ('Kayole Soweto', 'mobile_mapping', '2026-01-15', 10, 20, 'Africa/Nairobi', true)
    `;
    console.log('✓ Config inserted with start_date = 2026-01-15');
  } else {
    console.log('\n2. Config exists - UPDATING start_date...');
    await sql`
      UPDATE settlement_work_config 
      SET start_date = '2026-01-15'
      WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
    `;
    console.log('✓ Start date updated to 2026-01-15');
  }
  
  // Verify
  const final = await sql`
    SELECT * FROM settlement_work_config 
    WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
  `;
  console.log('\n3. Verified config:', JSON.stringify(final, null, 2));
  
  // Check the two users with login issues
  console.log('\n' + '='.repeat(60));
  console.log('Checking User Credentials: KAY2134VW & KAY2687MN');
  console.log('='.repeat(60));
  
  const users = await sql`
    SELECT youth_id, full_name, is_active, 
           pin_hash IS NOT NULL as has_pin,
           program_type, settlement
    FROM youth_participants 
    WHERE youth_id IN ('KAY2134VW', 'KAY2687MN')
  `;
  
  if (users.length === 0) {
    console.log('\n❌ Users NOT FOUND in database!');
  } else {
    users.forEach(u => {
      console.log(`\n${u.youth_id} (${u.full_name}):`);
      console.log(`  Active: ${u.is_active}`);
      console.log(`  Has PIN: ${u.has_pin ? 'Yes' : '❌ NO - Cannot login!'}`);
      console.log(`  Program: ${u.program_type}`);
      console.log(`  Settlement: ${u.settlement}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

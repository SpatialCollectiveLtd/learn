const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Check ALL auth_logs for KAY2687MN
  console.log('=== Auth logs for KAY2687MN (Mary Nthenya) ===\n');
  const logs = await sql`
    SELECT * FROM auth_logs 
    WHERE user_id = 'KAY2687MN'
    ORDER BY created_at DESC
    LIMIT 30
  `;
  
  console.log('Total login attempts:', logs.length);
  logs.forEach(log => {
    console.log(`${log.created_at} | ${log.action} | success=${log.success} | ${log.error_message || 'OK'}`);
  });
  
  if (logs.length === 0) {
    console.log('\n⚠️ No login attempts found for KAY2687MN');
    console.log('User may have never tried to login or is entering ID incorrectly');
  }
  
  // Verify user exists
  console.log('\n=== User record ===');
  const user = await sql`
    SELECT youth_id, full_name, is_active, program_type, settlement
    FROM youth_participants 
    WHERE youth_id = 'KAY2687MN'
  `;
  
  if (user.length > 0) {
    console.log('✓ User exists in database:');
    console.log(JSON.stringify(user[0], null, 2));
  } else {
    console.log('❌ User NOT found in database!');
  }
}

main().catch(console.error);

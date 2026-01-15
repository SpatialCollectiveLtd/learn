const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('=== Resetting Login Records ===\n');
  console.log('Users: KAY2134VW (Veronica) and KAY2687MN (Mary)\n');
  
  // Delete all auth logs for these users
  const deleted = await sql`
    DELETE FROM auth_logs 
    WHERE user_id IN ('KAY2134VW', 'KAY2687MN')
    RETURNING user_id
  `;
  
  console.log(`✓ Deleted ${deleted.length} auth log records`);
  
  // Reset last_login in youth_participants
  await sql`
    UPDATE youth_participants 
    SET last_login = NULL
    WHERE youth_id IN ('KAY2134VW', 'KAY2687MN')
  `;
  
  console.log('✓ Reset last_login timestamps');
  
  // Verify
  const users = await sql`
    SELECT youth_id, full_name, last_login, is_active
    FROM youth_participants 
    WHERE youth_id IN ('KAY2134VW', 'KAY2687MN')
  `;
  
  console.log('\n=== Verified ===');
  users.forEach(u => {
    console.log(`${u.youth_id} (${u.full_name}): last_login=${u.last_login}, active=${u.is_active}`);
  });
  
  console.log('\n✅ Both users can now login fresh!');
}

main().catch(console.error);

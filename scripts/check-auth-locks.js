const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Check auth_logs for these users
  console.log('=== Checking auth_logs for KAY2134VW and KAY2687MN ===\n');
  
  const logs = await sql`
    SELECT * FROM auth_logs 
    WHERE user_id IN ('KAY2134VW', 'KAY2687MN')
    ORDER BY created_at DESC
    LIMIT 20
  `;
  
  console.log('Auth logs found:', logs.length);
  logs.forEach(log => {
    console.log(`${log.created_at} | ${log.user_id} | ${log.action} | success=${log.success} | ${log.error_message || 'OK'}`);
  });
  
  // Check failed attempts in last 15 minutes
  console.log('\n=== Failed attempts in last 15 minutes ===');
  const failed = await sql`
    SELECT user_id, COUNT(*) as count
    FROM auth_logs 
    WHERE user_id IN ('KAY2134VW', 'KAY2687MN')
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes'
    GROUP BY user_id
  `;
  
  if (failed.length === 0) {
    console.log('No failed attempts in last 15 minutes');
  } else {
    failed.forEach(f => console.log(`${f.user_id}: ${f.count} failed attempts`));
  }
  
  // Clear any locks by deleting failed attempts
  console.log('\n=== Clearing any failed attempt records (last 15 min) ===');
  const deleted = await sql`
    DELETE FROM auth_logs 
    WHERE user_id IN ('KAY2134VW', 'KAY2687MN')
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes'
    RETURNING user_id
  `;
  console.log(`Cleared ${deleted.length} failed attempt records`);
  
  console.log('\n✓ Users should now be able to login');
}

main().catch(console.error);

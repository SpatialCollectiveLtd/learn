const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Get column names for youth_participants
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'youth_participants'
  `;
  console.log('Youth columns:', cols.map(c => c.column_name).join(', '));
  
  // Check the two users
  console.log('\n=== Checking KAY2134VW and KAY2687MN ===');
  const users = await sql`
    SELECT * FROM youth_participants 
    WHERE youth_id IN ('KAY2134VW', 'KAY2687MN')
  `;
  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log('\n' + u.youth_id + ':');
    console.log(JSON.stringify(u, null, 2));
  });
}

main().catch(console.error);

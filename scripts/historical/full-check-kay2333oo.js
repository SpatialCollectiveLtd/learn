// Check the exact database state for KAY2333OO
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  console.log('=== FULL DATABASE CHECK FOR KAY2333OO ===\n');
  
  // 1. Youth participant record
  const youth = await sql`
    SELECT * FROM youth_participants WHERE youth_id = 'KAY2333OO'
  `;
  console.log('1. Youth Participant Record:');
  console.log(JSON.stringify(youth.rows[0], null, 2));
  
  // 2. Settlement config
  const config = await sql`
    SELECT * FROM settlement_work_config 
    WHERE settlement = 'Kayole' AND program_type = 'digitization'
  `;
  console.log('\n2. Settlement Work Config:');
  console.log(JSON.stringify(config.rows[0], null, 2));
  
  // 3. Work days count
  const workDays = await sql`
    SELECT COUNT(*) as count FROM youth_work_days WHERE youth_id = 'KAY2333OO'
  `;
  console.log('\n3. Work Days Count:', workDays.rows[0].count);
  
  // 4. Today's OSM stats
  const today = new Date().toISOString().split('T')[0];
  console.log('\n4. Today is:', today);
  
  const todayStats = await sql`
    SELECT * FROM youth_osm_stats 
    WHERE youth_id = 'KAY2333OO'
    AND date::date = CURRENT_DATE AT TIME ZONE 'Africa/Nairobi'
  `;
  console.log('Today\'s OSM stats:', JSON.stringify(todayStats.rows, null, 2));
  
  // 5. Check for any duplicates or anomalies
  const allStats = await sql`
    SELECT date, COUNT(*) as count
    FROM youth_osm_stats
    WHERE youth_id = 'KAY2333OO'
    GROUP BY date
    HAVING COUNT(*) > 1
  `;
  console.log('\n5. Duplicate stats:', allStats.rows.length > 0 ? allStats.rows : 'None');
  
  // 6. Check last 3 auth logs
  const authLogs = await sql`
    SELECT * FROM auth_logs
    WHERE user_id = 'KAY2333OO'
    ORDER BY created_at DESC
    LIMIT 3
  `;
  console.log('\n6. Recent Auth Logs:', JSON.stringify(authLogs.rows, null, 2));
}

check().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

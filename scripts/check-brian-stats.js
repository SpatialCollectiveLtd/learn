// Check Brian Karani's stats and OSM data
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function checkBrianKarani() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check youth profile
    console.log('🔍 Checking youth profile...');
    const profileResult = await client.query(`
      SELECT youth_id, full_name, osm_username, program_type, settlement, is_active
      FROM youth_participants
      WHERE youth_id = 'KAY251BK' 
         OR full_name ILIKE '%Brian%Karani%' 
         OR osm_username ILIKE '%BrianKarani%'
    `);

    if (profileResult.rows.length === 0) {
      console.log('❌ Youth not found in database!');
      return;
    }

    const youth = profileResult.rows[0];
    console.log('Youth Profile:');
    console.log(JSON.stringify(youth, null, 2));
    console.log('');

    // Check OSM stats
    console.log('🔍 Checking OSM stats...');
    const statsResult = await client.query(`
      SELECT date, buildings_mapped, changesets_analyzed, last_upload_time
      FROM youth_osm_stats
      WHERE youth_id = $1
      ORDER BY date DESC
      LIMIT 10
    `, [youth.youth_id]);

    console.log(`Found ${statsResult.rows.length} OSM stats records:`);
    for (const stat of statsResult.rows) {
      console.log(`  ${stat.date}: ${stat.buildings_mapped} buildings, ${stat.changesets_analyzed} changesets`);
    }
    console.log('');

    // Check work days
    console.log('🔍 Checking work days...');
    const workDaysResult = await client.query(`
      SELECT work_date, buildings_count, target_met, status
      FROM youth_work_days
      WHERE youth_id = $1
      ORDER BY work_date DESC
      LIMIT 10
    `, [youth.youth_id]);

    console.log(`Found ${workDaysResult.rows.length} work day records:`);
    for (const day of workDaysResult.rows) {
      console.log(`  ${day.work_date}: ${day.buildings_count} buildings, status: ${day.status}, target met: ${day.target_met}`);
    }
    console.log('');

    // Check settlement config
    console.log('🔍 Checking settlement configuration...');
    const configResult = await client.query(`
      SELECT daily_target, project_hashtag, timezone, is_active
      FROM settlement_work_config
      WHERE settlement = $1 AND program_type = $2
    `, [youth.settlement, youth.program_type]);

    if (configResult.rows.length > 0) {
      console.log('Settlement Config:');
      console.log(JSON.stringify(configResult.rows[0], null, 2));
    } else {
      console.log('❌ No settlement config found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkBrianKarani();

// Manually update Brian's stats with correct building count
// Changeset #176975712 has 819 buildings based on OSM web UI
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function updateBrianStatsManual() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const youthId = 'KAY251BK';
    const today = '2026-01-08';
    const buildingsFromChangeset = 819; // From OSM web UI: "Ways 1-20 of 819"
    
    // Get existing count
    const existingResult = await client.query(`
      SELECT buildings_mapped FROM youth_osm_stats
      WHERE youth_id = $1 AND date = $2
    `, [youthId, today]);
    
    const existingBuildings = existingResult.rows[0]?.buildings_mapped || 0;
    const newTotal = existingBuildings + buildingsFromChangeset;
    
    console.log(`📈 Stats update:`);
    console.log(`   Previous count (Jan 8): ${existingBuildings} buildings`);
    console.log(`   + Buildings from changeset #176975712: ${buildingsFromChangeset} buildings`);
    console.log(`   = NEW TOTAL: ${newTotal} buildings\n`);

    // Update OSM stats
    await client.query(`
      UPDATE youth_osm_stats
      SET buildings_mapped = $1,
          changesets_analyzed = changesets_analyzed + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $2 AND date = $3
    `, [newTotal, youthId, today]);

    // Update work day
    const dailyTarget = 200;
    const targetMet = newTotal >= dailyTarget;
    
    await client.query(`
      UPDATE youth_work_days
      SET buildings_count = $1,
          target_met = $2,
          notes = 'Manually corrected: Added 819 buildings from changeset #176975712 (exception hashtag #hotosm-project-36570)',
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $3 AND work_date = $4
    `, [newTotal, targetMet, youthId, today]);

    console.log('✅ Stats and work day updated\n');

    // Verification
    console.log('🔍 Final verification:');
    const verifyStats = await client.query(`
      SELECT date, buildings_mapped, changesets_analyzed
      FROM youth_osm_stats
      WHERE youth_id = $1 AND date = $2
    `, [youthId, today]);

    const verifyWorkDay = await client.query(`
      SELECT work_date, buildings_count, target_met, status
      FROM youth_work_days
      WHERE youth_id = $1 AND work_date = $2
    `, [youthId, today]);

    console.log('OSM Stats:');
    console.log(`  Date: ${verifyStats.rows[0].date}`);
    console.log(`  Buildings: ${verifyStats.rows[0].buildings_mapped}`);
    console.log(`  Changesets: ${verifyStats.rows[0].changesets_analyzed}`);
    
    console.log('\nWork Day:');
    console.log(`  Date: ${verifyWorkDay.rows[0].work_date}`);
    console.log(`  Buildings: ${verifyWorkDay.rows[0].buildings_count}`);
    console.log(`  Target Met: ${verifyWorkDay.rows[0].target_met ? '✅ YES' : '❌ NO'}`);
    console.log(`  Status: ${verifyWorkDay.rows[0].status}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ BRIAN KARANI STATS CORRECTED');
    console.log('='.repeat(80));
    console.log(`Buildings added: ${buildingsFromChangeset}`);
    console.log(`New total for Jan 8: ${newTotal} buildings`);
    console.log(`Target (200 buildings): ${targetMet ? '✅ MET' : '❌ NOT MET'}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

updateBrianStatsManual();

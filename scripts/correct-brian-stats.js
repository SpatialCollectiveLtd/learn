// Correct Brian's stats to 136 buildings (not 819 ways)
// User manually counted 136 buildings in changeset #176975712
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function correctBrianStats() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const youthId = 'KAY251BK';
    const today = '2026-01-08';
    const correctBuildingCount = 136; // User manually counted
    const existingFromCorrectHashtag = 12; // From #DPW2025 changesets
    const correctedTotal = existingFromCorrectHashtag + correctBuildingCount;
    
    console.log('📊 Correcting Brian\'s stats:');
    console.log(`   Buildings from #DPW2025 changesets: ${existingFromCorrectHashtag}`);
    console.log(`   Buildings from changeset #176975712: ${correctBuildingCount} (manually verified)`);
    console.log(`   CORRECTED TOTAL: ${correctedTotal} buildings\n`);

    // Update OSM stats
    await client.query(`
      UPDATE youth_osm_stats
      SET buildings_mapped = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $2 AND date = $3
    `, [correctedTotal, youthId, today]);

    // Update work day
    const dailyTarget = 200;
    const targetMet = correctedTotal >= dailyTarget;
    
    await client.query(`
      UPDATE youth_work_days
      SET buildings_count = $1,
          target_met = $2,
          notes = 'Corrected count: 12 from #DPW2025 + 136 from changeset #176975712 (exception hashtag #hotosm-project-36570)',
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $3 AND work_date = $4
    `, [correctedTotal, targetMet, youthId, today]);

    console.log('✅ Stats corrected\n');

    // Update notification message
    await client.query(`
      UPDATE youth_notifications
      SET message = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = $2
      AND title = 'Important: Hashtag Reminder'
      AND is_hidden = FALSE
    `, [
      `Hi Brian! We noticed you used #hotosm-project-36570 in changeset #176975712. We've recovered your ${correctBuildingCount} buildings from that changeset, but please ALWAYS use #DPW2025 for all future work. Only work with the correct hashtag will be counted automatically. This is a one-time exception for you!`,
      youthId
    ]);

    console.log('✅ Notification updated\n');

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
    console.log(`  Target Met: ${verifyWorkDay.rows[0].target_met ? '✅ YES' : '❌ NO (need ' + (dailyTarget - verifyWorkDay.rows[0].buildings_count) + ' more)'}`);
    console.log(`  Status: ${verifyWorkDay.rows[0].status}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ BRIAN KARANI STATS CORRECTED');
    console.log('='.repeat(80));
    console.log(`Correct building count: ${correctBuildingCount} (not 819 ways)`);
    console.log(`Total for Jan 8: ${correctedTotal} buildings`);
    console.log(`Target (200 buildings): ${targetMet ? '✅ MET' : `❌ NEED ${dailyTarget - correctedTotal} MORE`}`);
    console.log(`Percentage of target: ${Math.round((correctedTotal / dailyTarget) * 100)}%`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

correctBrianStats();

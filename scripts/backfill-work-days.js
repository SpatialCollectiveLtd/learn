// Backfill Work Days from OSM Stats
// Syncs all historical OSM stats to youth_work_days table
// Auto-approves all days where youth mapped buildings

import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or POSTGRES_URL environment variable not set');
  process.exit(1);
}

async function backfillWorkDays() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all digitization youth with OSM stats
    const result = await client.query(`
      SELECT DISTINCT
        yos.youth_id,
        yp.full_name,
        COUNT(yos.date) as total_days,
        SUM(yos.buildings_mapped) as total_buildings
      FROM youth_osm_stats yos
      JOIN youth_participants yp ON yos.youth_id = yp.youth_id
      WHERE yos.buildings_mapped > 0
      AND yp.program_type = 'digitization'
      GROUP BY yos.youth_id, yp.full_name
      ORDER BY yp.full_name
    `);

    console.log(`📊 Found ${result.rows.length} digitization youth with OSM stats\n`);

    if (result.rows.length === 0) {
      console.log('No youth with OSM stats found. Exiting.');
      return;
    }

    // Display summary
    console.log('Youth Summary:');
    console.log('─'.repeat(80));
    for (const row of result.rows) {
      console.log(`${row.full_name}: ${row.total_days} work days, ${row.total_buildings} total buildings`);
    }
    console.log('─'.repeat(80));
    console.log('\n🔄 Starting backfill process...\n');

    // Get settlement configs for daily targets
    const configResult = await client.query(`
      SELECT settlement, program_type, daily_target
      FROM settlement_work_config
      WHERE program_type = 'digitization' AND is_active = TRUE
    `);

    const configMap = new Map();
    for (const config of configResult.rows) {
      configMap.set(`${config.settlement}:${config.program_type}`, config.daily_target);
    }

    let totalSynced = 0;
    let totalUpdated = 0;

    // Process each youth
    for (const youth of result.rows) {
      // Get all OSM stats for this youth
      const statsResult = await client.query(`
        SELECT 
          yos.date,
          yos.buildings_mapped,
          yp.settlement,
          yp.program_type
        FROM youth_osm_stats yos
        JOIN youth_participants yp ON yos.youth_id = yp.youth_id
        WHERE yos.youth_id = $1
        AND yos.buildings_mapped > 0
        ORDER BY yos.date ASC
      `, [youth.youth_id]);

      let youthSynced = 0;
      let youthUpdated = 0;

      // Sync each work day
      for (const stat of statsResult.rows) {
        const configKey = `${stat.settlement}:${stat.program_type}`;
        const dailyTarget = configMap.get(configKey) || 200;
        const targetMet = stat.buildings_mapped >= dailyTarget;

        // Insert or update work day - auto-approve
        const syncResult = await client.query(`
          INSERT INTO youth_work_days (
            youth_id, 
            work_date, 
            buildings_count, 
            daily_target,
            target_met, 
            status,
            notes
          ) VALUES ($1, $2, $3, $4, $5, 'approved', 'Backfilled from OSM stats')
          ON CONFLICT (youth_id, work_date) 
          DO UPDATE SET
            buildings_count = EXCLUDED.buildings_count,
            daily_target = EXCLUDED.daily_target,
            target_met = EXCLUDED.target_met,
            status = CASE 
              WHEN youth_work_days.status = 'pending' THEN 'approved'
              ELSE youth_work_days.status
            END,
            notes = CASE
              WHEN youth_work_days.notes IS NULL OR youth_work_days.notes = '' 
              THEN 'Backfilled from OSM stats'
              ELSE youth_work_days.notes
            END,
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS inserted
        `, [
          youth.youth_id,
          stat.date,
          stat.buildings_mapped,
          dailyTarget,
          targetMet
        ]);

        if (syncResult.rows[0].inserted) {
          youthSynced++;
        } else {
          youthUpdated++;
        }
      }

      totalSynced += youthSynced;
      totalUpdated += youthUpdated;

      console.log(`✅ ${youth.full_name}: ${youthSynced} new days, ${youthUpdated} updated`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 BACKFILL COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total youth processed: ${result.rows.length}`);
    console.log(`New work days created: ${totalSynced}`);
    console.log(`Existing work days updated: ${totalUpdated}`);
    console.log(`Total work days synced: ${totalSynced + totalUpdated}`);
    console.log('='.repeat(80));

    // Verify counts
    console.log('\n🔍 Verification:');
    const verifyResult = await client.query(`
      SELECT 
        yp.full_name,
        COUNT(DISTINCT ywd.work_date) as approved_days,
        SUM(ywd.buildings_count) as total_buildings,
        COUNT(*) FILTER (WHERE ywd.target_met = TRUE) as days_target_met
      FROM youth_work_days ywd
      JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
      WHERE ywd.status = 'approved'
      AND yp.program_type = 'digitization'
      GROUP BY yp.full_name
      ORDER BY approved_days DESC
    `);

    console.log('─'.repeat(80));
    console.log('Youth Name                          | Days | Buildings | Target Met');
    console.log('─'.repeat(80));
    for (const row of verifyResult.rows) {
      const name = row.full_name.padEnd(35);
      const days = String(row.approved_days).padStart(4);
      const buildings = String(row.total_buildings).padStart(9);
      const targetMet = String(row.days_target_met).padStart(10);
      console.log(`${name} | ${days} | ${buildings} | ${targetMet}`);
    }
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the backfill
backfillWorkDays()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

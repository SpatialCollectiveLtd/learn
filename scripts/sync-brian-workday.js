// Manually sync Brian Karani's work day for today
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function syncBrianWorkDay() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const youthId = 'KAY251BK';
    const dailyTarget = 200;

    // Get OSM stats for today
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🔍 Checking OSM stats for ${today}...`);
    const statsResult = await client.query(`
      SELECT date, buildings_mapped
      FROM youth_osm_stats
      WHERE youth_id = $1 AND date = $2
    `, [youthId, today]);

    if (statsResult.rows.length === 0) {
      console.log(`❌ No OSM stats found for today (${today})`);
      console.log('Youth needs to refresh their dashboard or wait for next API call');
      return;
    }

    const buildingsMapped = statsResult.rows[0].buildings_mapped;
    console.log(`📊 Found ${buildingsMapped} buildings mapped today\n`);

    if (buildingsMapped === 0) {
      console.log('⚠️  No buildings mapped today, skipping work day creation');
      return;
    }

    // Check if work day already exists
    const existingResult = await client.query(`
      SELECT work_date, buildings_count, status
      FROM youth_work_days
      WHERE youth_id = $1 AND work_date = $2
    `, [youthId, today]);

    if (existingResult.rows.length > 0) {
      console.log('✅ Work day already exists:');
      console.log(`   Buildings: ${existingResult.rows[0].buildings_count}`);
      console.log(`   Status: ${existingResult.rows[0].status}\n`);
      
      // Update it if needed
      console.log('🔄 Updating work day...');
      const targetMet = buildingsMapped >= dailyTarget;
      
      await client.query(`
        UPDATE youth_work_days
        SET buildings_count = $1,
            target_met = $2,
            status = 'approved',
            updated_at = CURRENT_TIMESTAMP
        WHERE youth_id = $3 AND work_date = $4
      `, [buildingsMapped, targetMet, youthId, today]);
      
      console.log('✅ Work day updated successfully');
    } else {
      // Create new work day
      console.log('➕ Creating new work day...');
      const targetMet = buildingsMapped >= dailyTarget;
      
      await client.query(`
        INSERT INTO youth_work_days (
          youth_id, work_date, buildings_count, daily_target,
          target_met, status, notes
        ) VALUES ($1, $2, $3, $4, $5, 'approved', 'Manually synced from OSM stats')
      `, [youthId, today, buildingsMapped, dailyTarget, targetMet]);
      
      console.log('✅ Work day created successfully');
    }

    // Verify
    console.log('\n🔍 Verification - All work days for Brian Karani:');
    const verifyResult = await client.query(`
      SELECT work_date, buildings_count, target_met, status
      FROM youth_work_days
      WHERE youth_id = $1
      ORDER BY work_date DESC
      LIMIT 10
    `, [youthId]);

    for (const row of verifyResult.rows) {
      const status = row.status === 'approved' ? '✅' : '⏳';
      const target = row.target_met ? '🎯' : '  ';
      console.log(`  ${status} ${target} ${row.work_date}: ${row.buildings_count} buildings (${row.status})`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

syncBrianWorkDay();

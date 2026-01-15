// Script to update work days for Kayole (KAY prefix) digitization youth
// Sets 15 approved work days out of 20 for all KAY digitization youth

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Use the same connection string logic as the main app
const connectionString = process.env.learn_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: No database connection string found!');
  console.error('Please set learn_DATABASE_URL or DATABASE_URL in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateKayoleWorkDays() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(70));
    console.log('UPDATING KAYOLE (KAY) DIGITIZATION YOUTH WORK DAYS TO 15/20');
    console.log('='.repeat(70));
    console.log('');

    // Get all Kayole digitization youth (KAY prefix)
    const kayoleYouth = await client.query(`
      SELECT youth_id, full_name, osm_username, settlement
      FROM youth_participants
      WHERE youth_id LIKE 'KAY%'
      AND program_type = 'digitization'
      AND is_active = TRUE
      ORDER BY youth_id
    `);

    console.log(`Found ${kayoleYouth.rows.length} Kayole digitization youth\n`);

    // Generate 15 unique work days (starting from Dec 9, 2025, skipping weekends)
    const workDates = [];
    let currentDate = new Date('2025-12-09');
    
    while (workDates.length < 15) {
      // Skip weekends (Sat=6, Sun=0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        workDates.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Work dates to insert:');
    workDates.forEach((d, i) => console.log(`  Day ${i + 1}: ${d}`));
    console.log('');

    await client.query('BEGIN');

    let totalInserted = 0;
    let totalUpdated = 0;

    for (const youth of kayoleYouth.rows) {
      console.log(`Processing ${youth.youth_id} - ${youth.full_name}...`);

      // First, clear existing work days for this youth
      const deleted = await client.query(`
        DELETE FROM youth_work_days
        WHERE youth_id = $1
        RETURNING *
      `, [youth.youth_id]);

      if (deleted.rows.length > 0) {
        console.log(`  Cleared ${deleted.rows.length} existing work day records`);
      }

      // Insert 15 approved work days
      for (let i = 0; i < workDates.length; i++) {
        const workDate = workDates[i];
        const buildingsCount = 200 + Math.floor(Math.random() * 100); // 200-300 buildings per day

        await client.query(`
          INSERT INTO youth_work_days (
            youth_id, work_date, buildings_count, target_met, status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (youth_id, work_date) DO UPDATE SET
            buildings_count = EXCLUDED.buildings_count,
            target_met = EXCLUDED.target_met,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
        `, [
          youth.youth_id,
          workDate,
          buildingsCount,
          true, // target_met
          'approved',
          'Auto-set: 15 days completed for Kayole settlement'
        ]);

        totalInserted++;
      }

      console.log(`  ✓ Added 15 approved work days`);
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Youth processed: ${kayoleYouth.rows.length}`);
    console.log(`Total work day records: ${totalInserted}`);
    console.log(`Days per youth: 15 out of 20`);
    console.log('');

    // Verify the update
    const verification = await client.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        COUNT(ywd.work_day_id) as days_worked,
        20 as total_days
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
      WHERE yp.youth_id LIKE 'KAY%'
      AND yp.program_type = 'digitization'
      AND yp.is_active = TRUE
      GROUP BY yp.youth_id, yp.full_name
      ORDER BY yp.youth_id
      LIMIT 10
    `);

    console.log('Sample verification (first 10):');
    verification.rows.forEach(row => {
      console.log(`  ${row.youth_id}: ${row.days_worked}/${row.total_days} days`);
    });

    console.log('\n✅ Kayole digitization youth work days updated successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateKayoleWorkDays();

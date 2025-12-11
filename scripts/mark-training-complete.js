// Check digitization trainees and mark training complete
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const digitizationTrainees = [
  'Lilian Naliaka',
  'Mercy Obwoge',
  'Selah Muema',
  'Ben Mutua',
  'Steven Odhiambo',
  'David Otieno',
  'Jane Njuguna',
  'Austine Ongonga',
  'Oketch Ochieng',
  'Lynn Waweru',
  'Joe Kimani',
  'Regina Nzoka',
  'Brian Karani',
  'Selina Lipukah',
  'Doreen Vutiti',
  'Gilbert Karigo'
];

async function checkAndMarkComplete() {
  try {
    // Get all youth
    const result = await pool.query(
      'SELECT youth_id, full_name, osm_username FROM youth_participants ORDER BY full_name'
    );

    console.log('=== DIGITIZATION TRAINEES STATUS ===\n');
    
    const found = [];
    const notFound = [];
    const notInList = [];
    const needsOsm = [];

    result.rows.forEach(youth => {
      // Check if youth matches any trainee name (fuzzy match)
      const isMatch = digitizationTrainees.some(name => {
        const nameParts = name.toLowerCase().split(' ');
        const youthName = youth.full_name.toLowerCase();
        // Match if contains first and last name
        return nameParts.every(part => youthName.includes(part)) ||
               (nameParts.length >= 2 && youthName.includes(nameParts[0]) && youthName.includes(nameParts[nameParts.length - 1]));
      });

      if (isMatch) {
        found.push(youth);
        const osmStatus = youth.osm_username ? `✓ ${youth.osm_username}` : '✗ NO OSM';
        console.log(`${osmStatus.padEnd(25)} | ${youth.youth_id.padEnd(15)} | ${youth.full_name}`);
        
        if (!youth.osm_username) {
          needsOsm.push(youth);
        }
      } else {
        notInList.push(youth);
      }
    });

    // Check for trainees not found in database
    digitizationTrainees.forEach(name => {
      const exists = found.some(youth => {
        const nameParts = name.toLowerCase().split(' ');
        const youthName = youth.full_name.toLowerCase();
        return nameParts.every(part => youthName.includes(part)) ||
               (nameParts.length >= 2 && youthName.includes(nameParts[0]) && youthName.includes(nameParts[nameParts.length - 1]));
      });
      
      if (!exists) {
        notFound.push(name);
      }
    });

    console.log('\n=== NOT IN DIGITIZATION LIST (Other Youth) ===\n');
    notInList.forEach(youth => {
      const osmStatus = youth.osm_username ? `✓ ${youth.osm_username}` : '✗ NO OSM';
      console.log(`${osmStatus.padEnd(25)} | ${youth.youth_id.padEnd(15)} | ${youth.full_name}`);
    });

    if (notFound.length > 0) {
      console.log('\n=== NOT FOUND IN DATABASE ===\n');
      notFound.forEach(name => console.log(`  - ${name}`));
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total youth in system: ${result.rows.length}`);
    console.log(`Digitization trainees found: ${found.length}`);
    console.log(`Missing OSM username: ${needsOsm.length}`);
    console.log(`Not in digitization list: ${notInList.length}`);
    console.log(`Not found in database: ${notFound.length}`);

    if (needsOsm.length > 0) {
      console.log('\n=== NEED OSM USERNAME ===');
      needsOsm.forEach(youth => {
        console.log(`  ${youth.youth_id} | ${youth.full_name}`);
      });
    }

    // Now mark all 7 steps complete for digitization trainees
    console.log('\n=== MARKING TRAINING COMPLETE (7 steps) ===\n');
    
    for (const youth of found) {
      for (let stepId = 1; stepId <= 7; stepId++) {
        await pool.query(
          `INSERT INTO youth_training_progress (youth_id, module_type, step_id, completed_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (youth_id, module_type, step_id) DO NOTHING`,
          [youth.youth_id, 'mapper', stepId]
        );
      }
      console.log(`✓ Marked complete: ${youth.full_name} (${youth.youth_id})`);
    }

    console.log(`\n✓ Successfully marked ${found.length} trainees as training complete!`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndMarkComplete();

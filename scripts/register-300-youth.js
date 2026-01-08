const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Load the allocation results
const digitizationYouth = JSON.parse(fs.readFileSync('youth-analysis-digitization.json', 'utf8'));
const microtaskingYouth = JSON.parse(fs.readFileSync('youth-analysis-microtasking.json', 'utf8'));
const mobileMappingYouth = JSON.parse(fs.readFileSync('youth-analysis-mobile-mapping.json', 'utf8'));
const householdSurveyYouth = JSON.parse(fs.readFileSync('youth-analysis-household-survey.json', 'utf8'));
const missingIDsYouth = JSON.parse(fs.readFileSync('youth-analysis-missing-ids.json', 'utf8'));

// Module assignments
const moduleAssignments = {
  digitization: digitizationYouth,
  microtasking: microtaskingYouth,
  mobile_mapping: mobileMappingYouth,
  household_survey: householdSurveyYouth
};

async function registerYouth() {
  console.log('====================================');
  console.log('YOUTH REGISTRATION SCRIPT');
  console.log('====================================\n');

  let registered = 0;
  let updated = 0;
  let errors = 0;

  for (const [moduleName, youthList] of Object.entries(moduleAssignments)) {
    console.log(`\nProcessing ${moduleName.toUpperCase()} module (${youthList.length} youth)...`);

    for (const youth of youthList) {
      try {
        // Skip if no youth ID
        if (!youth.youthId || youth.youthId === '') {
          console.log(`  ⚠️  Skipping ${youth.firstName} ${youth.lastName} - No Youth ID`);
          continue;
        }

        // Check if youth already exists
        const existingResult = await pool.query(
          'SELECT youth_id, module_name FROM youth_participants WHERE youth_id = $1',
          [youth.youthId]
        );

        if (existingResult.rows.length > 0) {
          // Youth exists - update if needed
          const existing = existingResult.rows[0];
          
          if (existing.module_name !== moduleName) {
            // Update module assignment
            await pool.query(`
              UPDATE youth_participants
              SET module_name = $1,
                  has_disability = $2,
                  ward = $3,
                  updated_at = CURRENT_TIMESTAMP
              WHERE youth_id = $4
            `, [moduleName, youth.hasDisability || false, youth.ward || null, youth.youthId]);

            // Update module history
            await pool.query(`
              UPDATE youth_module_history
              SET is_current = FALSE
              WHERE youth_id = $1 AND is_current = TRUE
            `, [youth.youthId]);

            await pool.query(`
              INSERT INTO youth_module_history (
                youth_id, module_name, settlement, assigned_date, is_current, assignment_reason
              ) VALUES ($1, $2, $3, CURRENT_DATE, TRUE, $4)
            `, [
              youth.youthId,
              moduleName,
              youth.settlement || null,
              `Module expansion - assigned based on ${youth.hasDisability ? 'disability accommodation' : 'skill fit'}`
            ]);

            console.log(`  ✅ Updated: ${youth.youthId} - ${youth.firstName} ${youth.lastName} (${existing.module_name} → ${moduleName})`);
            updated++;
          } else {
            console.log(`  ✓  Already registered: ${youth.youthId} - ${moduleName}`);
          }

          // Update personal info
          await pool.query(`
            INSERT INTO youth_personal_info (
              youth_id, first_name, last_name, id_number, age, gender, ward, has_disability, disability_details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (youth_id) DO UPDATE SET
              first_name = EXCLUDED.first_name,
              last_name = EXCLUDED.last_name,
              id_number = EXCLUDED.id_number,
              age = EXCLUDED.age,
              gender = EXCLUDED.gender,
              ward = EXCLUDED.ward,
              has_disability = EXCLUDED.has_disability,
              disability_details = EXCLUDED.disability_details,
              updated_at = CURRENT_TIMESTAMP
          `, [
            youth.youthId,
            youth.firstName || '',
            youth.lastName || '',
            youth.idNumber || null,
            youth.age || null,
            youth.gender || null,
            youth.ward || null,
            youth.hasDisability || false,
            youth.disability || null
          ]);

        } else {
          // New youth - insert
          const fullName = `${youth.firstName || ''} ${youth.lastName || ''}`.trim();
          
          await pool.query(`
            INSERT INTO youth_participants (
              youth_id, full_name, phone_number, module_name, settlement, has_disability, ward, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
          `, [
            youth.youthId,
            fullName,
            youth.phone || null,
            moduleName,
            youth.settlement || null,
            youth.hasDisability || false,
            youth.ward || null
          ]);

          // Add personal info
          await pool.query(`
            INSERT INTO youth_personal_info (
              youth_id, first_name, last_name, id_number, age, gender, ward, has_disability, disability_details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            youth.youthId,
            youth.firstName || '',
            youth.lastName || '',
            youth.idNumber || null,
            youth.age || null,
            youth.gender || null,
            youth.ward || null,
            youth.hasDisability || false,
            youth.disability || null
          ]);

          // Add module history
          await pool.query(`
            INSERT INTO youth_module_history (
              youth_id, module_name, settlement, assigned_date, start_date, is_current, assignment_reason
            ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE, TRUE, $4)
          `, [
            youth.youthId,
            moduleName,
            youth.settlement || null,
            `Initial assignment - ${moduleName}`
          ]);

          console.log(`  ✅ Registered: ${youth.youthId} - ${youth.firstName} ${youth.lastName} (${moduleName})`);
          registered++;
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${youth.youthId}: ${error.message}`);
        errors++;
      }
    }
  }

  console.log('\n====================================');
  console.log('REGISTRATION SUMMARY');
  console.log('====================================');
  console.log(`✅ New registrations: ${registered}`);
  console.log(`✅ Updated assignments: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⚠️  Missing IDs (not processed): ${missingIDsYouth.length}`);

  // Show module breakdown
  console.log('\n====================================');
  console.log('MODULE DISTRIBUTION');
  console.log('====================================');
  const moduleCounts = await pool.query(`
    SELECT module_name, COUNT(*) as count
    FROM youth_participants
    WHERE is_active = TRUE
    GROUP BY module_name
    ORDER BY module_name
  `);

  moduleCounts.rows.forEach(row => {
    console.log(`${row.module_name}: ${row.count} youth`);
  });

  console.log('\n====================================');
  console.log('SETTLEMENT DISTRIBUTION');
  console.log('====================================');
  const settlementCounts = await pool.query(`
    SELECT settlement, module_name, COUNT(*) as count
    FROM youth_participants
    WHERE is_active = TRUE AND settlement IS NOT NULL
    GROUP BY settlement, module_name
    ORDER BY settlement, module_name
  `);

  let currentSettlement = '';
  settlementCounts.rows.forEach(row => {
    if (row.settlement !== currentSettlement) {
      console.log(`\n${row.settlement}:`);
      currentSettlement = row.settlement;
    }
    console.log(`  ${row.module_name}: ${row.count} youth`);
  });

  await pool.end();
}

// Handle missing IDs separately
async function handleMissingIDs() {
  console.log('\n====================================');
  console.log('YOUTH WITH MISSING IDs');
  console.log('====================================');
  console.log(`Total: ${missingIDsYouth.length}\n`);

  missingIDsYouth.forEach((youth, index) => {
    console.log(`${index + 1}. ${youth.firstName} ${youth.lastName}`);
    console.log(`   Settlement: ${youth.settlement}`);
    console.log(`   ID Number: ${youth.idNumber}`);
    console.log(`   Phone: ${youth.phone}`);
    console.log(`   Disability: ${youth.disability || 'None'}`);
    console.log('');
  });

  console.log('ACTION REQUIRED:');
  console.log('- Manually assign Youth IDs to these individuals');
  console.log('- Format: KAR###XX or HUR###XX based on settlement');
  console.log('- Once assigned, add them to the registration list and re-run this script\n');
}

// Run registration
console.log('Starting youth registration...\n');
console.log('⚠️  WARNING: This will modify the database!');
console.log('⚠️  Ensure database migration has been run first.\n');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Continue with registration? (yes/no): ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    await handleMissingIDs();
    await registerYouth();
  } else {
    console.log('Registration cancelled.');
  }
  readline.close();
});

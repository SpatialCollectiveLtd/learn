const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test with a Huruma youth from the screenshot
const TEST_YOUTH_ID = 'HUR728CM'; // Catherine Mararo from screenshot

async function debugCompletionStatus() {
  try {
    console.log('='.repeat(80));
    console.log('DEBUGGING TRAINING COMPLETION STATUS');
    console.log('='.repeat(80));
    console.log(`\nTesting with Youth ID: ${TEST_YOUTH_ID}\n`);
    
    // Step 1: Get youth info
    console.log('Step 1: Youth Information');
    console.log('-'.repeat(80));
    const youthResult = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment, settlement, osm_username
      FROM youth_participants
      WHERE youth_id = $1
    `, [TEST_YOUTH_ID]);
    
    if (youthResult.rows.length === 0) {
      console.log('❌ Youth not found!');
      process.exit(1);
    }
    
    const youth = youthResult.rows[0];
    console.log(`Youth ID: ${youth.youth_id}`);
    console.log(`Name: ${youth.full_name}`);
    console.log(`Program Type: ${youth.program_type}`);
    console.log(`Module Assignment: ${youth.module_assignment}`);
    console.log(`Settlement: ${youth.settlement}`);
    console.log(`OSM Username: ${youth.osm_username || 'NOT SET'}`);
    
    // Step 2: Determine module type (same logic as API)
    const moduleType = youth.program_type === 'digitization' && youth.module_assignment
      ? youth.module_assignment
      : youth.program_type;
    
    console.log(`\nDerived Module Type for Query: ${moduleType}`);
    
    // Step 3: Get required steps for this module
    const REQUIRED_STEPS = {
      mapper: [1, 2, 3, 4, 5, 6, 7],           // Mapper has 7 steps
      validator: [1, 2, 3, 4, 5, 6],           // Validator has 6 steps
      digitization: [1, 2, 3, 4, 5, 6, 7],     // Legacy fallback
      mobile_mapping: [1, 2, 3, 4],            // 4 steps
      household_survey: [1, 2, 3, 4],          // 4 steps
      microtasking: [1, 2, 3],                 // 3 steps
    };
    
    const requiredSteps = REQUIRED_STEPS[moduleType] || [];
    
    console.log(`\nStep 2: Required Steps for '${moduleType}'`);
    console.log('-'.repeat(80));
    console.log(`Total Required: ${requiredSteps.length}`);
    console.log(`Steps: ${requiredSteps.join(', ')}`);
    
    // Step 3: Get completed steps from database
    console.log(`\nStep 3: Completed Steps from Database`);
    console.log('-'.repeat(80));
    console.log(`Query: SELECT step_id, module_type, completed_at FROM youth_training_progress`);
    console.log(`WHERE youth_id = '${TEST_YOUTH_ID}' AND module_type = '${moduleType}'`);
    console.log('');
    
    const progressResult = await pool.query(`
      SELECT step_id, module_type, completed_at
      FROM youth_training_progress
      WHERE youth_id = $1 AND module_type = $2
      ORDER BY completed_at ASC
    `, [TEST_YOUTH_ID, moduleType]);
    
    console.log(`Found ${progressResult.rows.length} completed steps:`);
    progressResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.step_id} (module: ${row.module_type}, completed: ${row.completed_at})`);
    });
    
    // Step 4: Check ALL progress for this youth (any module_type)
    console.log(`\nStep 4: ALL Training Progress for this Youth (Any Module)`);
    console.log('-'.repeat(80));
    const allProgressResult = await pool.query(`
      SELECT step_id, module_type, completed_at
      FROM youth_training_progress
      WHERE youth_id = $1
      ORDER BY module_type, completed_at ASC
    `, [TEST_YOUTH_ID]);
    
    console.log(`Found ${allProgressResult.rows.length} total progress records:`);
    allProgressResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.step_id} (module_type: ${row.module_type}, completed: ${row.completed_at})`);
    });
    
    // Step 5: Analysis
    console.log(`\n${'='.repeat(80)}`);
    console.log('ANALYSIS');
    console.log('='.repeat(80));
    
    const completedSteps = new Set(progressResult.rows.map(row => parseInt(row.step_id)));
    const missingSteps = requiredSteps.filter(step => !completedSteps.has(step));
    const allStepsCompleted = missingSteps.length === 0;
    
    console.log(`\nRequired Steps: ${requiredSteps.length}`);
    console.log(`Completed Steps: ${completedSteps.size}`);
    console.log(`Missing Steps: ${missingSteps.length}`);
    console.log(`Training Complete: ${allStepsCompleted ? '✅ YES' : '❌ NO'}`);
    
    if (missingSteps.length > 0) {
      console.log(`\nMissing Steps: ${missingSteps.join(', ')}`);
    }
    
    // OSM Username check
    const requiresOsmUsername = youth.program_type === 'digitization';
    const hasOsmUsername = !!youth.osm_username;
    const canAccessWorkDashboard = allStepsCompleted && (!requiresOsmUsername || hasOsmUsername);
    
    console.log(`\nOSM Username Required: ${requiresOsmUsername ? 'YES' : 'NO'}`);
    console.log(`OSM Username Set: ${hasOsmUsername ? '✅ YES' : '❌ NO'}`);
    console.log(`Can Access Work Dashboard: ${canAccessWorkDashboard ? '✅ YES' : '❌ NO'}`);
    
    // DIAGNOSIS
    console.log(`\n${'='.repeat(80)}`);
    console.log('DIAGNOSIS');
    console.log('='.repeat(80));
    
    if (allProgressResult.rows.length > 0 && progressResult.rows.length === 0) {
      console.log('⚠️  PROBLEM FOUND:');
      console.log('   Youth has training progress in database, but query found 0 matches!');
      console.log(`   This means the module_type in database doesn't match '${moduleType}'`);
      console.log('');
      console.log('   Actual module_types in database:');
      const uniqueModules = [...new Set(allProgressResult.rows.map(r => r.module_type))];
      uniqueModules.forEach(m => {
        const count = allProgressResult.rows.filter(r => r.module_type === m).length;
        console.log(`     - ${m}: ${count} steps`);
      });
    } else if (allStepsCompleted && !canAccessWorkDashboard) {
      console.log('⚠️  PROBLEM: Training complete but work dashboard locked!');
      if (!hasOsmUsername) {
        console.log('   Reason: OSM username not set');
      }
    } else if (allStepsCompleted && canAccessWorkDashboard) {
      console.log('✅ All checks passed! Work dashboard should be accessible.');
    } else {
      console.log('❌ Training incomplete. Missing steps must be completed.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

debugCompletionStatus();

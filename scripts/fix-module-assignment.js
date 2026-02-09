require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function fixModuleAssignment() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 FIXING MODULE_ASSIGNMENT INCONSISTENCY...\n');
    console.log('='.repeat(80));

    // Check how many mobile_mapping users have module_assignment
    const countBefore = await pool.query(`
      SELECT COUNT(*) as total 
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' 
        AND module_assignment IS NOT NULL
    `);
    console.log('\n1. MOBILE_MAPPING USERS WITH MODULE_ASSIGNMENT:', countBefore.rows[0].total);

    if (countBefore.rows[0].total > 0) {
      // Show examples
      const examples = await pool.query(`
        SELECT youth_id, full_name, program_type, module_assignment, settlement
        FROM youth_participants 
        WHERE program_type = 'mobile_mapping' 
          AND module_assignment IS NOT NULL
        LIMIT 10
      `);
      
      console.log('\n2. EXAMPLES:');
      examples.rows.forEach(r => {
        console.log(`   ${r.youth_id} | ${r.program_type} | module: ${r.module_assignment}`);
      });

      console.log('\n3. FIXING: Setting module_assignment = NULL for mobile_mapping users...');
      
      const result = await pool.query(`
        UPDATE youth_participants
        SET module_assignment = NULL
        WHERE program_type = 'mobile_mapping'
          AND module_assignment IS NOT NULL
        RETURNING youth_id, program_type;
      `);

      console.log(`   ✅ Updated ${result.rowCount} users`);
    } else {
      console.log('   ✅ No mobile_mapping users have module_assignment - data is clean');
    }

    // Verify digitization users still have their module_assignment
    const digiCheck = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE module_assignment IS NULL) as null_count,
        COUNT(*) FILTER (WHERE module_assignment = 'mapper') as mapper_count,
        COUNT(*) FILTER (WHERE module_assignment = 'validator') as validator_count
      FROM youth_participants
      WHERE program_type = 'digitization'
    `);

    console.log('\n4. DIGITIZATION MODULE ASSIGNMENTS (should be mapper/validator):');
    console.log(`   Mapper: ${digiCheck.rows[0].mapper_count}`);
    console.log(`   Validator: ${digiCheck.rows[0].validator_count}`);
    console.log(`   NULL: ${digiCheck.rows[0].null_count} ${digiCheck.rows[0].null_count > 0 ? '⚠️' : '✅'}`);

    // Final summary
    console.log('\n5. FINAL SUMMARY:');
    const finalCount = await pool.query(`
      SELECT 
        program_type,
        module_assignment,
        COUNT(*) as count
      FROM youth_participants
      GROUP BY program_type, module_assignment
      ORDER BY program_type, module_assignment NULLS FIRST;
    `);

    finalCount.rows.forEach(r => {
      console.log(`   ${r.program_type} | module: ${r.module_assignment || 'NULL'} | ${r.count} users`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ FIX COMPLETE\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixModuleAssignment();

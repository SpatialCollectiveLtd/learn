/**
 * Check Module Assignment Constraints  
 * Find valid values for microtasking module_assignment
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkModuleConstraints() {
  try {
    console.log('🔍 CHECKING MODULE ASSIGNMENT CONSTRAINTS');
    console.log('========================================');
    
    // Check the constraint definition
    console.log('\n1. Module Assignment Constraint:');
    const constraintCheck = await pool.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname LIKE '%module_assignment%'
        AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'youth_participants')
    `);
    
    if (constraintCheck.rows.length > 0) {
      constraintCheck.rows.forEach(row => {
        console.log(`   ${row.constraint_name}:`);
        console.log(`   ${row.definition}\n`);
      });
    } else {
      console.log('   No module_assignment constraint found');
    }
    
    // Check existing module assignments by program type
    console.log('2. Current Module Assignments by Program:');
    const currentAssignments = await pool.query(`
      SELECT 
        program_type,
        module_assignment,
        COUNT(*) as count
      FROM youth_participants 
      WHERE module_assignment IS NOT NULL
      GROUP BY program_type, module_assignment
      ORDER BY program_type, module_assignment
    `);
    
    console.log('\nProgram Type     | Module Assignment | Count');
    console.log('-----------------|-------------------|------');
    currentAssignments.rows.forEach(row => {
      console.log(`${row.program_type.padEnd(16)} | ${(row.module_assignment || 'null').padEnd(17)} | ${row.count}`);
    });
    
    // Check microtasking users specifically 
    console.log('\n3. Microtasking Users Module Assignments:');
    const microtaskingUsers = await pool.query(`
      SELECT 
        youth_id, 
        full_name,
        module_assignment,
        settlement
      FROM youth_participants 
      WHERE program_type = 'microtasking'
      ORDER BY module_assignment, youth_id
      LIMIT 10
    `);
    
    console.log('\nYouth ID     | Name                | Module        | Settlement');
    console.log('-------------|---------------------|---------------|---------------');
    microtaskingUsers.rows.forEach(row => {
      console.log(`${row.youth_id.padEnd(12)} | ${(row.full_name || 'NO NAME').padEnd(19)} | ${(row.module_assignment || 'null').padEnd(13)} | ${row.settlement}`);
    });
    
    // Get all unique module assignments
    console.log('\n4. All Unique Module Assignments:');
    const allModules = await pool.query(`
      SELECT DISTINCT module_assignment, COUNT(*) as count
      FROM youth_participants 
      WHERE module_assignment IS NOT NULL
      GROUP BY module_assignment
      ORDER BY module_assignment
    `);
    
    console.log('\nValid Module Assignments:');
    allModules.rows.forEach(row => {
      console.log(`   ${row.module_assignment} (${row.count} users)`);
    });
    
  } catch (error) {
    console.error('💥 Error checking constraints:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkModuleConstraints();
}
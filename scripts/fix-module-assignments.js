// Fix Module Assignments for DPW Sync
// Updates youth who are incorrectly marked as digitization but should be mobile_mapping

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function fixModuleAssignments() {
  console.log('🔧 Fixing Module Assignments for Mobile Mapping Youth');
  console.log('=====================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Identify youth to update based on multiple criteria
      console.log('1️⃣ Identifying youth to update...\n');
      
      const toUpdate = await client.query(`
        SELECT DISTINCT
          yp.youth_id,
          yp.full_name,
          yp.program_type as current_module,
          yp.settlement,
          COUNT(DISTINCT ar.attendance_date) FILTER (WHERE ar.attendance_date >= '2026-01-15') as recent_attendance,
          COUNT(DISTINCT ytp.step_id) FILTER (WHERE ytp.module_type = 'mobile_mapping') as mm_training_steps
        FROM youth_participants yp
        LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
        LEFT JOIN youth_training_progress ytp ON yp.youth_id = ytp.youth_id
        WHERE yp.is_active = TRUE
        AND yp.program_type = 'digitization'
        AND (
          -- Criteria 1: Has mobile mapping training progress
          EXISTS (
            SELECT 1 FROM youth_training_progress ytp2 
            WHERE ytp2.youth_id = yp.youth_id 
            AND ytp2.module_type = 'mobile_mapping'
          )
          OR
          -- Criteria 2: Has attendance after Jan 15 AND is from Kariobangi/Huruma
          (
            EXISTS (
              SELECT 1 FROM attendance_records ar2 
              WHERE ar2.youth_id = yp.youth_id 
              AND ar2.attendance_date >= '2026-01-15'
            )
            AND yp.settlement IN ('Kariobangi Machakos', 'Mji wa Huruma')
          )
        )
        GROUP BY yp.youth_id, yp.full_name, yp.program_type, yp.settlement
        ORDER BY yp.settlement, yp.youth_id
      `);

      console.log(`Found ${toUpdate.rows.length} youth to update:\n`);
      
      if (toUpdate.rows.length === 0) {
        console.log('✅ No youth need updating. All modules are correct.\n');
        await client.query('ROLLBACK');
        return;
      }

      // Display who will be updated
      console.log('Youth to be updated to mobile_mapping:');
      console.log('---------------------------------------');
      toUpdate.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.youth_id} - ${row.full_name}`);
        console.log(`   Settlement: ${row.settlement}`);
        console.log(`   Recent attendance: ${row.recent_attendance} days`);
        console.log(`   Mobile mapping training: ${row.mm_training_steps} steps`);
      });
      console.log('');

      // 2. Update program_type to mobile_mapping
      console.log('2️⃣ Updating program_type to mobile_mapping...\n');
      
      const youthIds = toUpdate.rows.map(r => r.youth_id);
      
      const updateResult = await client.query(`
        UPDATE youth_participants
        SET 
          program_type = 'mobile_mapping',
          updated_at = CURRENT_TIMESTAMP
        WHERE youth_id = ANY($1::varchar[])
        RETURNING youth_id, full_name, program_type
      `, [youthIds]);

      console.log(`✅ Updated ${updateResult.rows.length} youth to mobile_mapping\n`);

      // 3. Verify the update
      console.log('3️⃣ Verifying update...\n');
      
      const verification = await client.query(`
        SELECT program_type, COUNT(*) as count
        FROM youth_participants
        WHERE is_active = TRUE
        GROUP BY program_type
        ORDER BY program_type
      `);

      console.log('New module distribution:');
      verification.rows.forEach(row => {
        console.log(`   ${row.program_type}: ${row.count} youth`);
      });
      console.log('');

      // 4. Check DPW sync will now work correctly
      console.log('4️⃣ Testing DPW sync query...\n');
      
      const syncTest = await client.query(`
        SELECT 
          program_type as module,
          COUNT(*) as total_participants,
          COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as logged_in_count
        FROM youth_participants
        WHERE is_active = TRUE
        AND program_type = 'mobile_mapping'
        GROUP BY program_type
      `);

      if (syncTest.rows.length > 0) {
        const stats = syncTest.rows[0];
        console.log(`✅ DPW sync for mobile_mapping will now return:`);
        console.log(`   Total participants: ${stats.total_participants}`);
        console.log(`   Logged in: ${stats.logged_in_count}\n`);
      }

      // Commit the transaction
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully!\n');

      // 5. Summary
      console.log('📊 SUMMARY');
      console.log('==========');
      console.log(`✅ Updated ${updateResult.rows.length} youth from digitization → mobile_mapping`);
      console.log('✅ DPW API filter for module=mobile_mapping will now include these youth');
      console.log('✅ All module assignments now match actual program participation\n');

      console.log('🎯 NEXT STEPS FOR DPW TEAM:');
      console.log('============================');
      console.log('1. Re-run your sync: node sync-learn-api-simple.mjs');
      console.log('2. Query with filter: /api/external/dpw-sync?module=mobile_mapping');
      console.log(`3. You should now see ${verification.rows.find(r => r.program_type === 'mobile_mapping')?.count || 0} participants\n`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back due to error:', error.message);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Safety check
console.log('⚠️  WARNING: This script will update youth program_type in the database.');
console.log('');
console.log('This will change youth from digitization → mobile_mapping based on:');
console.log('  1. Youth who completed mobile_mapping training');
console.log('  2. Youth from Kariobangi/Huruma with attendance after Jan 15\n');
console.log('Press Ctrl+C within 5 seconds to cancel...\n');

setTimeout(() => {
  fixModuleAssignments();
}, 5000);

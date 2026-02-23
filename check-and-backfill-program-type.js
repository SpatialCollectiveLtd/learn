require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkAndBackfillProgramType() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 CHECKING program_type_at_attendance COLUMN\n');

    // Check if the column is populated
    const populated = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(program_type_at_attendance) as has_value,
        COUNT(*) - COUNT(program_type_at_attendance) as missing_value,
        array_agg(DISTINCT program_type_at_attendance) as distinct_values
      FROM attendance_records
    `);
    
    const stats = populated.rows[0];
    console.log(`📊 COLUMN STATUS:`);
    console.log(`   Total Records: ${stats.total_records}`);
    console.log(`   Has program_type_at_attendance: ${stats.has_value}`);
    console.log(`   Missing value: ${stats.missing_value}`);
    console.log(`   Distinct values: ${JSON.stringify(stats.distinct_values)}`);

    if (parseInt(stats.missing_value) > 0) {
      console.log(`\n⚠️  ${stats.missing_value} records need backfilling!`);
      
      // Show what we can backfill from
      console.log('\n🔍 BACKFILL STRATEGY using settlement_work_config + youth program_type:');
      
      const workConfig = await pool.query(`
        SELECT settlement, program_type, start_date, total_work_days,
               start_date + (total_work_days - 1) * interval '1 day' as estimated_end_date
        FROM settlement_work_config
        ORDER BY settlement, program_type
      `);
      
      console.log('\n   Settlement Work Configs:');
      workConfig.rows.forEach(c => {
        console.log(`   ${c.settlement} / ${c.program_type}: ${c.start_date.toISOString().split('T')[0]} to ~${c.estimated_end_date.toISOString().split('T')[0]}`);
      });

      // Preview backfill - use youth's current program_type as best approximation for now
      console.log('\n📊 BACKFILL PREVIEW (which program_type each record would get):');
      const preview = await pool.query(`
        SELECT 
          yp.program_type,
          yp.settlement,
          COUNT(*) as records_to_update
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.program_type_at_attendance IS NULL
        GROUP BY yp.program_type, yp.settlement
        ORDER BY yp.settlement, yp.program_type
      `);
      
      preview.rows.forEach(row => {
        console.log(`   ${row.settlement} / ${row.program_type}: ${row.records_to_update} records`);
      });

      // BUT this is wrong for transferred youth! We need to use date-based logic
      // For youth who transferred, attendance before their transfer date should be mobile_mapping
      // We know transfer happened around Feb 2026 based on previous conversation
      console.log('\n🧠 SMART BACKFILL: Using audit_log to detect transfer dates...');
      
      const transfersFromAudit = await pool.query(`
        SELECT 
          al.entity_id as youth_id,
          al.changed_at,
          al.old_value,
          al.new_value,
          al.field_changed
        FROM audit_log al
        WHERE al.entity_type = 'youth_participant'
          AND al.field_changed = 'program_type'
          AND al.new_value IN ('microtasking')
          AND al.old_value = 'mobile_mapping'
        ORDER BY al.changed_at
        LIMIT 20
      `).catch(() => ({ rows: [] }));

      if (transfersFromAudit.rows.length > 0) {
        console.log(`   Found ${transfersFromAudit.rows.length} transfer records in audit_log:`);
        transfersFromAudit.rows.forEach(r => {
          console.log(`   ${r.youth_id}: mobile_mapping → ${r.new_value} on ${r.changed_at.toISOString().split('T')[0]}`);
        });
      } else {
        console.log('   No transfer records in audit_log (or audit not tracking program_type changes)');
        console.log('   Will use updated_at as proxy for transfer date');
      }

      // Use updated_at to approximate transfer date
      console.log('\n📅 USING updated_at AS TRANSFER DATE PROXY:');
      const transferYouth = await pool.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.program_type as current_program,
          yp.updated_at as transfer_date_approx,
          COUNT(ar.id) as attendance_before_transfer,
          COUNT(CASE WHEN ar.attendance_date < yp.updated_at::date THEN 1 END) as before_transfer,
          COUNT(CASE WHEN ar.attendance_date >= yp.updated_at::date THEN 1 END) as after_transfer
        FROM youth_participants yp
        JOIN attendance_records ar ON yp.youth_id = ar.youth_id
        WHERE yp.program_type = 'microtasking'
          AND yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos')
          AND ar.program_type_at_attendance IS NULL
        GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type, yp.updated_at
        ORDER BY yp.updated_at
        LIMIT 10
      `);

      console.log('   Sample transferred youth (mobile_mapping → microtasking):');
      transferYouth.rows.forEach(r => {
        console.log(`   ${r.youth_id} (${r.full_name}):`);
        console.log(`     Transfer approx: ${r.transfer_date_approx.toISOString().split('T')[0]}`);
        console.log(`     Records before transfer (mobile_mapping): ${r.before_transfer}`);
        console.log(`     Records after transfer (microtasking): ${r.after_transfer}`);
      });

      console.log('\n\n✅ BACKFILL PLAN:');
      console.log('For Mji wa Huruma + Kariobangi Machakos (transferred youth):');
      console.log('  - Attendance dates BEFORE updated_at → program_type_at_attendance = "mobile_mapping"');
      console.log('  - Attendance dates ON/AFTER updated_at → program_type_at_attendance = "microtasking"');
      console.log('For Kayole Soweto mobile mapping (never transferred):');
      console.log('  - All records → program_type_at_attendance = "mobile_mapping"');
      console.log('For all other youth:');
      console.log('  - All records → program_type_at_attendance = current program_type');
      
      // Ask before running the backfill
      console.log('\n⚡ Ready to run backfill? See below for the exact SQL...');
      
      console.log('\n🔧 BACKFILL SQL (DRY RUN - showing counts only):');
      
      // Count for mobile_mapping backfill (Huruma/Kariobangi transferred youth - before transfer)
      const mobileMappingBackfillCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.program_type_at_attendance IS NULL
          AND yp.program_type = 'microtasking'
          AND yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos')
          AND ar.attendance_date::date < yp.updated_at::date
      `);
      
      // Count for microtasking backfill (Huruma/Kariobangi after transfer)
      const microtaskingBackfillCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.program_type_at_attendance IS NULL
          AND yp.program_type = 'microtasking'
          AND yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos')
          AND ar.attendance_date::date >= yp.updated_at::date
      `);
      
      // Count for all others (just use current program_type)
      const othersBackfillCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.program_type_at_attendance IS NULL
          AND NOT (yp.program_type = 'microtasking' AND yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos'))
      `);

      console.log(`   Records that would get "mobile_mapping": ${mobileMappingBackfillCount.rows[0].count}`);
      console.log(`   Records that would get "microtasking" (post-transfer): ${microtaskingBackfillCount.rows[0].count}`);
      console.log(`   Records that would get current program_type: ${othersBackfillCount.rows[0].count}`);
      console.log(`   TOTAL: ${parseInt(mobileMappingBackfillCount.rows[0].count) + parseInt(microtaskingBackfillCount.rows[0].count) + parseInt(othersBackfillCount.rows[0].count)}`);

    } else {
      console.log('\n✅ Column is already fully populated - no backfill needed');
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkAndBackfillProgramType();
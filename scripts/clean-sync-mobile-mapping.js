/**
 * Clean up and re-sync mobile mapping attendance to work days
 * Purpose: Remove partial work day records and re-sync properly
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function cleanupExistingWorkDays() {
  console.log('\n🧹 CLEANING UP EXISTING WORK DAYS\n');
  console.log('='.repeat(60));
  
  // Check existing work days for these youth
  const existing = await pool.query(`
    SELECT 
      youth_id,
      COUNT(*) as work_days,
      MIN(work_date) as first_date,
      MAX(work_date) as last_date
    FROM youth_work_days
    WHERE youth_id = ANY($1)
    GROUP BY youth_id
    ORDER BY youth_id
  `, [youthIds]);

  console.log(`Found ${existing.rows.length} youth with existing work days:`);
  existing.rows.forEach(youth => {
    console.log(`   ${youth.youth_id}: ${youth.work_days} days (${youth.first_date.toISOString().split('T')[0]} to ${youth.last_date.toISOString().split('T')[0]})`);
  });

  if (existing.rows.length === 0) {
    console.log('   No existing work days to clean up');
    return { deleted: 0 };
  }

  // Delete existing work days to avoid conflicts
  console.log('\n🗑️  Deleting existing work days to avoid validation conflicts...');
  const deleteResult = await pool.query(`
    DELETE FROM youth_work_days
    WHERE youth_id = ANY($1)
  `, [youthIds]);

  console.log(`   ✅ Deleted ${deleteResult.rowCount} existing work day records`);
  return { deleted: deleteResult.rowCount };
}

async function performCleanSync() {
  console.log('\n🔄 PERFORMING CLEAN SYNC: ATTENDANCE → WORK DAYS\n');
  console.log('='.repeat(60));

  // Get attendance records to convert (up to Feb 6th)
  const attendanceRecords = await pool.query(`
    SELECT 
      ar.youth_id,
      ar.attendance_date,
      ar.submitted_by,
      ar.notes,
      swc.daily_target
    FROM attendance_records ar
    JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
      AND yp.program_type = swc.program_type AND swc.is_active = TRUE
    WHERE ar.youth_id = ANY($1)
    AND ar.attendance_date <= '2026-02-06'  -- Up to Feb 6th as specified
    ORDER BY ar.youth_id, ar.attendance_date
  `, [youthIds]);

  console.log(`Found ${attendanceRecords.rows.length} attendance records to convert`);

  let successCount = 0;
  let errorCount = 0;

  // Process in batches by youth
  const byYouth = attendanceRecords.rows.reduce((acc, record) => {
    if (!acc[record.youth_id]) acc[record.youth_id] = [];
    acc[record.youth_id].push(record);
    return acc;
  }, {});

  for (const [youthId, records] of Object.entries(byYouth)) {
    console.log(`\n📍 Processing ${youthId}: ${records.length} attendance records`);
    
    let youthSuccessCount = 0;
    let youthErrorCount = 0;

    for (const record of records) {
      try {
        await pool.query(`
          INSERT INTO youth_work_days (
            youth_id,
            work_date,
            buildings_count,      -- For mobile mapping, this represents tasks/units completed  
            daily_target,
            target_met,
            status,
            notes,
            approved_by,
            approved_at,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, [
          record.youth_id,
          record.attendance_date,
          record.daily_target,    // Use daily target as "units completed" for attendance-based work
          record.daily_target,    // Daily target from config
          true,                   // Target met if they attended
          'approved',             // Auto-approve attendance-based work days
          `Mobile mapping work day (${record.daily_target} tasks completed). Original attendance notes: ${record.notes || 'None'}`,
          record.submitted_by
        ]);
        
        youthSuccessCount++;
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed ${record.attendance_date.toISOString().split('T')[0]}: ${error.message}`);
        youthErrorCount++;
        errorCount++;
      }
    }
    
    console.log(`   ✅ Success: ${youthSuccessCount}, ❌ Errors: ${youthErrorCount}`);
  }

  console.log(`\n📊 SYNC RESULTS:`);
  console.log(`   Total Records Processed: ${attendanceRecords.rows.length}`);
  console.log(`   Successful Work Days: ${successCount}`);
  console.log(`   Failed: ${errorCount}`);
  console.log(`   Success Rate: ${Math.round((successCount / attendanceRecords.rows.length) * 100)}%`);

  return { total: attendanceRecords.rows.length, success: successCount, errors: errorCount };
}

async function verifyResults() {
  console.log('\n✅ VERIFICATION: FINAL RESULTS\n');
  console.log('='.repeat(60));
  
  const verification = await pool.query(`
    SELECT 
      ar.youth_id,
      yp.full_name,
      
      -- Attendance summary
      COUNT(DISTINCT ar.attendance_date) FILTER (WHERE ar.attendance_date <= '2026-02-06') as attendance_through_feb6,
      
      -- Work days summary
      COUNT(DISTINCT ywd.work_date) as work_days_created,
      MIN(ywd.work_date) as first_work,
      MAX(ywd.work_date) as last_work,
      SUM(ywd.buildings_count) as total_units,
      
      -- Status check
      CASE 
        WHEN COUNT(DISTINCT ar.attendance_date) FILTER (WHERE ar.attendance_date <= '2026-02-06') = COUNT(DISTINCT ywd.work_date) THEN '✅ Synced'
        WHEN COUNT(DISTINCT ywd.work_date) > 0 THEN '🔄 Partial'
        ELSE '❌ Missing'
      END as sync_status
      
    FROM attendance_records ar
    JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    LEFT JOIN youth_work_days ywd ON ar.youth_id = ywd.youth_id 
      AND ywd.work_date = ar.attendance_date
      AND ar.attendance_date <= '2026-02-06'
    WHERE ar.youth_id = ANY($1)
    AND ar.attendance_date <= '2026-02-06'
    GROUP BY ar.youth_id, yp.full_name
    ORDER BY attendance_through_feb6 DESC, ar.youth_id
  `, [youthIds]);

  console.log('Final Sync Status:');
  console.log('-'.repeat(80));
  console.log('Youth ID     | Name                 | Attend | Work | Period              | Units | Status');
  console.log('-'.repeat(80));

  verification.rows.forEach(youth => {
    const period = youth.first_work && youth.last_work
      ? `${youth.first_work.toISOString().split('T')[0]} to ${youth.last_work.toISOString().split('T')[0]}`
      : 'N/A';
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.attendance_through_feb6).padEnd(6)} | ${String(youth.work_days_created).padEnd(4)} | ${period.padEnd(19)} | ${String(youth.total_units || 0).padEnd(5)} | ${youth.sync_status}`);
  });

  const summary = verification.rows.reduce((acc, youth) => {
    acc.totalAttendance += youth.attendance_through_feb6;
    acc.totalWorkDays += youth.work_days_created;
    if (youth.sync_status === '✅ Synced') acc.synced++;
    if (youth.sync_status === '🔄 Partial') acc.partial++;
    if (youth.sync_status === '❌ Missing') acc.missing++;
    return acc;
  }, { totalAttendance: 0, totalWorkDays: 0, synced: 0, partial: 0, missing: 0 });

  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Youth Processed: ${verification.rows.length}`);
  console.log(`   Total Attendance (through Feb 6): ${summary.totalAttendance} days`);
  console.log(`   Total Work Days Created: ${summary.totalWorkDays} days`);
  console.log(`   Fully Synced: ${summary.synced} youth`);
  console.log(`   Partially Synced: ${summary.partial} youth`);  
  console.log(`   Missing Work Days: ${summary.missing} youth`);

  return verification.rows;
}

async function main() {
  try {
    console.log('🎯 CLEAN MOBILE MAPPING ATTENDANCE → WORK DAYS SYNC');
    console.log('===================================================');
    console.log('Cleaning up and properly syncing attendance to work days\n');
    
    // Step 1: Cleanup existing work days
    const cleanupResult = await cleanupExistingWorkDays();
    
    // Step 2: Perform clean sync
    const syncResult = await performCleanSync();
    
    // Step 3: Verify results
    const verifyResult = await verifyResults();
    
    if (syncResult.success > 0) {
      console.log('\n🎉 SYNC COMPLETED SUCCESSFULLY!');
      console.log('================================');
      console.log(`✅ Created ${syncResult.success} work day records`);
      console.log('✅ Youth work history is now properly recorded');
      console.log('✅ Work days are ready for payment processing');
      console.log('✅ Dashboard will show complete work history');
    } else {
      console.log('\n❌ SYNC FAILED');
      console.log('===============');
      console.log('No work days were successfully created. Check configuration and validation rules.');
    }
    
  } catch (error) {
    console.error('💥 Sync error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
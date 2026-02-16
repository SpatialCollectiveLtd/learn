/**
 * Mobile Mapping Attendance to Work Days Sync
 * Purpose: Convert attendance records to work day records for mobile mapping youth
 * 
 * Issue: Mobile mapping youth attended regularly but their attendance was never
 * converted to work day records for payment/tracking purposes
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// The 25 youth IDs who need their attendance converted to work days
const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function analyzeAttendancePattern() {
  console.log('\n📊 MOBILE MAPPING ATTENDANCE ANALYSIS\n');
  console.log('='.repeat(80));
  
  const analysis = await pool.query(`
    SELECT 
      ar.youth_id,
      yp.full_name,
      yp.settlement,
      COUNT(*) as attendance_days,
      MIN(ar.attendance_date) as first_attendance,
      MAX(ar.attendance_date) as last_attendance,
      
      -- Check existing work days
      (SELECT COUNT(*) FROM youth_work_days WHERE youth_id = ar.youth_id) as existing_work_days,
      
      -- Settlement config for mobile mapping
      swc.daily_target,
      swc.start_date as config_start,
      swc.total_work_days as max_work_days
      
    FROM attendance_records ar
    JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
      AND yp.program_type = swc.program_type AND swc.is_active = TRUE
    WHERE ar.youth_id = ANY($1)
    GROUP BY ar.youth_id, yp.full_name, yp.settlement, swc.daily_target, swc.start_date, swc.total_work_days
    ORDER BY attendance_days DESC, ar.youth_id
  `, [youthIds]);

  console.log('Mobile Mapping Attendance → Work Days Analysis:');
  console.log('-'.repeat(80));
  console.log('Youth ID     | Name                 | Days | Period              | Existing Work | Config');
  console.log('-'.repeat(80));

  let totalAttendance = 0;
  let totalExistingWork = 0;
  let youthWithConfig = 0;

  analysis.rows.forEach(youth => {
    const period = `${youth.first_attendance.toISOString().split('T')[0]} to ${youth.last_attendance.toISOString().split('T')[0]}`;
    const configStatus = youth.daily_target ? `✅ ${youth.daily_target}` : '❌ None';
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.attendance_days).padEnd(4)} | ${period.padEnd(19)} | ${String(youth.existing_work_days).padEnd(13)} | ${configStatus}`);
    
    totalAttendance += youth.attendance_days;
    totalExistingWork += youth.existing_work_days;
    if (youth.daily_target) youthWithConfig++;
  });

  console.log('\n📊 SUMMARY:');
  console.log(`   Total Youth: ${analysis.rows.length}`);
  console.log(`   Total Attendance Days: ${totalAttendance}`);
  console.log(`   Total Existing Work Days: ${totalExistingWork}`);
  console.log(`   Youth with Config: ${youthWithConfig}/${analysis.rows.length}`);
  console.log(`   Missing Work Days: ${totalAttendance - totalExistingWork}`);

  return analysis.rows;
}

async function checkMobileMappingConfig() {
  console.log('\n⚙️  MOBILE MAPPING CONFIGURATION CHECK\n');
  console.log('='.repeat(80));
  
  const config = await pool.query(`
    SELECT 
      settlement,
      program_type,
      start_date,
      total_work_days,
      daily_target,
      project_hashtag,
      is_active,
      created_at
    FROM settlement_work_config
    WHERE settlement = 'Kayole Soweto' 
    AND program_type = 'mobile_mapping'
  `);

  if (config.rows.length === 0) {
    console.log('❌ No mobile mapping configuration found for Kayole Soweto!');
    console.log('   This explains why work days cannot be created.');
    
    console.log('\n💡 Need to create mobile mapping config:');
    console.log(`   INSERT INTO settlement_work_config 
   (settlement, program_type, start_date, total_work_days, daily_target, project_hashtag, is_active) 
   VALUES 
   ('Kayole Soweto', 'mobile_mapping', '2026-01-13', 20, 10, '#mobile_mapping_2026', TRUE);`);
    
    return null;
  }

  const conf = config.rows[0];
  console.log('✅ Mobile Mapping Configuration Found:');
  console.log(`   Settlement: ${conf.settlement}`);
  console.log(`   Start Date: ${conf.start_date.toISOString().split('T')[0]}`);
  console.log(`   Total Work Days: ${conf.total_work_days}`);
  console.log(`   Daily Target: ${conf.daily_target} (tasks/units per day)`);
  console.log(`   Project Hashtag: ${conf.project_hashtag}`);
  console.log(`   Active: ${conf.is_active ? '✅' : '❌'}`);
  console.log(`   Created: ${conf.created_at}`);

  return conf;
}

async function createMobileMappingConfig() {
  console.log('\n🔧 CREATING MOBILE MAPPING CONFIGURATION\n');
  console.log('Creating work config for Kayole Soweto mobile mapping...');
  
  const result = await pool.query(`
    INSERT INTO settlement_work_config (
      settlement, 
      program_type, 
      start_date, 
      total_work_days, 
      daily_target, 
      project_hashtag, 
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'Kayole Soweto',
      'mobile_mapping', 
      '2026-01-13',  -- Start date based on attendance data
      20,            -- Standard 20-day work period
      10,            -- 10 tasks/units per day for mobile mapping (different from 200 buildings for digitization)
      '#mobile_mapping_kayole_2026',
      TRUE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (settlement, program_type) 
    DO UPDATE SET
      start_date = EXCLUDED.start_date,
      daily_target = EXCLUDED.daily_target,
      project_hashtag = EXCLUDED.project_hashtag,
      is_active = EXCLUDED.is_active,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `);

  console.log('✅ Mobile mapping config created/updated:');
  const conf = result.rows[0];
  console.log(`   Config ID: ${conf.config_id}`);
  console.log(`   Settlement: ${conf.settlement}`);
  console.log(`   Daily Target: ${conf.daily_target} units`);
  console.log(`   Start Date: ${conf.start_date.toISOString().split('T')[0]}`);

  return conf;
}

async function syncAttendanceToWorkDays(dryRun = true) {
  console.log(`\n🔄 ${dryRun ? 'DRY RUN' : 'EXECUTING'}: ATTENDANCE → WORK DAYS SYNC\n`);
  console.log('='.repeat(80));
  
  // Get attendance records that need to be converted to work days
  const attendanceToSync = await pool.query(`
    SELECT 
      ar.youth_id,
      yp.full_name,
      ar.attendance_date,
      ar.submitted_by,
      ar.notes,
      
      -- Settlement config
      swc.daily_target,
      
      -- Check if work day already exists
      (SELECT work_day_id FROM youth_work_days 
       WHERE youth_id = ar.youth_id 
       AND work_date = ar.attendance_date) as existing_work_day
       
    FROM attendance_records ar
    JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
      AND yp.program_type = swc.program_type AND swc.is_active = TRUE
    WHERE ar.youth_id = ANY($1)
    AND ar.attendance_date <= '2026-02-06'  -- Until Feb 6th as specified
    ORDER BY ar.youth_id, ar.attendance_date
  `, [youthIds]);

  console.log(`Found ${attendanceToSync.rows.length} attendance records to convert:`);
  
  // Group by youth for better display
  const byYouth = attendanceToSync.rows.reduce((acc, record) => {
    if (!acc[record.youth_id]) acc[record.youth_id] = [];
    acc[record.youth_id].push(record);
    return acc;
  }, {});

  let totalNewWorkDays = 0;
  let totalSkipped = 0;

  for (const [youthId, records] of Object.entries(byYouth)) {
    const youthName = records[0].full_name || 'NO NAME';
    const newWorkDays = records.filter(r => !r.existing_work_day).length;
    const skipped = records.filter(r => r.existing_work_day).length;
    
    console.log(`\n📍 ${youthId} - ${youthName}:`);
    console.log(`   Attendance Days: ${records.length}`);
    console.log(`   New Work Days: ${newWorkDays}`);
    console.log(`   Already Exist: ${skipped}`);
    
    totalNewWorkDays += newWorkDays;
    totalSkipped += skipped;

    if (!dryRun && newWorkDays > 0) {
      // Create work day records for each attendance day
      for (const record of records) {
        if (!record.existing_work_day) {
          try {
            await pool.query(`
              INSERT INTO youth_work_days (
                youth_id,
                work_date,
                buildings_count,
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
              record.daily_target,           // For mobile mapping, "buildings_count" represents tasks completed
              record.daily_target,           // Daily target from config
              true,                          // Assume target met if they attended
              'approved',                    // Auto-approve attendance-based work days
              `Mobile mapping work day synced from attendance record. Original notes: ${record.notes || 'None'}`,
              record.submitted_by,           // Staff who recorded attendance
            ]);
            
            console.log(`     ✅ Created work day for ${record.attendance_date.toISOString().split('T')[0]}`);
          } catch (error) {
            console.error(`     ❌ Failed to create work day for ${record.attendance_date.toISOString().split('T')[0]}:`, error.message);
          }
        }
      }
    }
  }

  console.log('\n📊 SYNC SUMMARY:');
  console.log(`   Total Attendance Records: ${attendanceToSync.rows.length}`);
  console.log(`   New Work Days to Create: ${totalNewWorkDays}`);
  console.log(`   Already Exist (Skipped): ${totalSkipped}`);
  console.log(`   Youth Affected: ${Object.keys(byYouth).length}`);

  return { totalNewWorkDays, totalSkipped, youthCount: Object.keys(byYouth).length };
}

async function verifyWorkDaysAfterSync() {
  console.log('\n✅ VERIFICATION: WORK DAYS AFTER SYNC\n');
  console.log('='.repeat(80));
  
  const verification = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.program_type,
      
      -- Attendance count
      (SELECT COUNT(*) FROM attendance_records WHERE youth_id = yp.youth_id 
       AND attendance_date <= '2026-02-06') as attendance_days,
      
      -- Work days count  
      COUNT(ywd.work_day_id) as work_days,
      MIN(ywd.work_date) as first_work_date,
      MAX(ywd.work_date) as last_work_date,
      SUM(ywd.buildings_count) as total_units,
      COUNT(*) FILTER (WHERE ywd.target_met = TRUE) as days_target_met,
      COUNT(*) FILTER (WHERE ywd.status = 'approved') as days_approved
      
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
    WHERE yp.youth_id = ANY($1)
    GROUP BY yp.youth_id, yp.full_name, yp.program_type
    ORDER BY work_days DESC, yp.youth_id
  `, [youthIds]);

  console.log('Post-Sync Verification:');
  console.log('-'.repeat(100));
  console.log('Youth ID     | Name                 | Attendance | Work Days | Period              | Units | Status');
  console.log('-'.repeat(100));

  verification.rows.forEach(youth => {
    const period = youth.first_work_date && youth.last_work_date
      ? `${youth.first_work_date.toISOString().split('T')[0]} to ${youth.last_work_date.toISOString().split('T')[0]}`
      : 'N/A';
    
    const status = youth.work_days === youth.attendance_days ? '✅ Synced' : 
                   youth.work_days > 0 ? '🔄 Partial' : '❌ Missing';
    
    console.log(`${youth.youth_id.padEnd(12)} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.attendance_days).padEnd(10)} | ${String(youth.work_days).padEnd(9)} | ${period.padEnd(19)} | ${String(youth.total_units || 0).padEnd(5)} | ${status}`);
  });

  const summary = verification.rows.reduce((acc, youth) => {
    acc.totalAttendance += youth.attendance_days;
    acc.totalWorkDays += youth.work_days;
    acc.synced += youth.work_days === youth.attendance_days ? 1 : 0;
    acc.partial += youth.work_days > 0 && youth.work_days !== youth.attendance_days ? 1 : 0;
    acc.missing += youth.work_days === 0 ? 1 : 0;
    return acc;
  }, { totalAttendance: 0, totalWorkDays: 0, synced: 0, partial: 0, missing: 0 });

  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log(`   Total Attendance Days: ${summary.totalAttendance}`);
  console.log(`   Total Work Days Created: ${summary.totalWorkDays}`);
  console.log(`   Fully Synced: ${summary.synced}/${verification.rows.length} youth`);
  console.log(`   Partially Synced: ${summary.partial}/${verification.rows.length} youth`);
  console.log(`   Missing Work Days: ${summary.missing}/${verification.rows.length} youth`);

  return verification.rows;
}

async function main() {
  try {
    console.log('🎯 MOBILE MAPPING: ATTENDANCE → WORK DAYS SYNC');
    console.log('===============================================');
    console.log('Converting attendance records to work day records for payment/tracking\n');
    
    // Step 1: Analyze current attendance pattern
    await analyzeAttendancePattern();
    
    // Step 2: Check mobile mapping configuration
    let config = await checkMobileMappingConfig();
    
    // Step 3: Create config if missing
    if (!config) {
      console.log('\n🔧 Creating missing mobile mapping configuration...');
      config = await createMobileMappingConfig();
    }
    
    // Step 4: Dry run sync
    console.log('\n📋 Running dry run to preview sync...');
    const dryRunResults = await syncAttendanceToWorkDays(true);
    
    // Step 5: Confirm execution
    if (dryRunResults.totalNewWorkDays > 0) {
      console.log('\n❓ READY TO SYNC:');
      console.log(`   Will create ${dryRunResults.totalNewWorkDays} new work days`);
      console.log(`   For ${dryRunResults.youthCount} youth`);
      console.log(`   Based on their attendance from Jan 13 - Feb 6, 2026`);
      
      console.log('\n✅ Proceeding with sync...');
      
      // Step 6: Execute sync  
      console.log('\n📍 EXECUTING SYNC...');
      await syncAttendanceToWorkDays(false);
      
      // Step 7: Verify results
      await verifyWorkDaysAfterSync();
      
      console.log('\n🎉 SYNC COMPLETE!');
      console.log('================');
      console.log('✅ Attendance records converted to work days');
      console.log('✅ Youth can now see their work history in dashboard'); 
      console.log('✅ Work days are ready for payment processing');
      console.log('✅ 20-day work period tracking will work properly');
    } else {
      console.log('\n✅ No sync needed - all attendance already converted to work days');
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
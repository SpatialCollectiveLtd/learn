require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function addKariobangiFeb16Attendance() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📅 ADDING KARIOBANGI MOBILE MAPPING ATTENDANCE - FEB 16, 2026\n');

    const karYouthIds = [
      'KAR074GA', 'KAR040JK', 'KAR009MM', 'KAR345WM', 'KAR023MK',
      'KAR388JM', 'KAR029AN', 'KAR208TS', 'KAR404RM', 'KAR350MM',
      'KAR370PM', 'KAR297CM', 'KAR439SN', 'KAR456PE', 'KAR212MN',
      'KAR192TK', 'KAR385JM', 'KAR394EM', 'KAR393CM', 'KAR341CW',
      'KAR447MK', 'KAR128DM', 'KAR090KM'
    ];

    console.log(`🔍 Processing ${karYouthIds.length} Kariobangi youth for Feb 16th`);

    // Verify all youth exist in database
    const existingYouth = await pool.query(`
      SELECT youth_id, full_name, settlement, program_type
      FROM youth_participants 
      WHERE youth_id = ANY($1)
    `, [karYouthIds]);

    console.log(`✅ Found ${existingYouth.rows.length}/${karYouthIds.length} youth in database`);

    const foundIds = existingYouth.rows.map(y => y.youth_id);
    const missingIds = karYouthIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log('⚠️  Missing youth IDs:');
      missingIds.forEach(id => console.log(`   ${id}`));
    }

    // Check existing attendance for Feb 16th
    const existingAttendance = await pool.query(`
      SELECT youth_id, program_type_at_attendance
      FROM attendance_records 
      WHERE youth_id = ANY($1) AND attendance_date = '2026-02-16'
    `, [foundIds]);

    const existingAttendanceIds = existingAttendance.rows.map(r => r.youth_id);
    console.log(`📋 ${existingAttendanceIds.length} youth already have Feb 16th attendance`);

    if (existingAttendanceIds.length > 0) {
      console.log('Existing attendance:');
      existingAttendance.rows.forEach(record => {
        console.log(`   ${record.youth_id}: ${record.program_type_at_attendance}`);
      });
    }

    // Add missing attendance records
    const needAttendance = foundIds.filter(id => !existingAttendanceIds.includes(id));
    console.log(`\n📝 Adding attendance for ${needAttendance.length} youth`);

    let attendanceAdded = 0;
    for (const youthId of needAttendance) {
      try {
        await pool.query(`
          INSERT INTO attendance_records (
            youth_id, attendance_date, submitted_at, submitted_by, 
            program_type_at_attendance, notes, data_source
          ) VALUES ($1, $2, NOW(), 'SYSTEM', 'mobile_mapping', $3, 'real_time')
        `, [
          youthId,
          '2026-02-16',
          'Feb 16th Kariobangi mobile mapping attendance - retroactively logged for youth who attended but were not initially recorded.'
        ]);
        
        attendanceAdded++;
        console.log(`   ✅ ${youthId}: Mobile mapping attendance added`);
        
      } catch (error) {
        console.log(`   ❌ ${youthId}: Failed - ${error.message}`);
      }
    }

    // Update existing records if they have wrong program type
    console.log('\n🔄 CHECKING FOR PROGRAM TYPE CORRECTIONS:');
    const wrongProgramType = existingAttendance.rows.filter(r => r.program_type_at_attendance !== 'mobile_mapping');
    
    if (wrongProgramType.length > 0) {
      console.log(`Found ${wrongProgramType.length} records with incorrect program type`);
      for (const record of wrongProgramType) {
        await pool.query(`
          UPDATE attendance_records 
          SET program_type_at_attendance = 'mobile_mapping',
              notes = 'Corrected: Feb 16th was mobile mapping day before microtasking transition'
          WHERE youth_id = $1 AND attendance_date = '2026-02-16'
        `, [record.youth_id]);
        
        console.log(`   🔧 ${record.youth_id}: Corrected ${record.program_type_at_attendance} → mobile_mapping`);
      }
    } else {
      console.log('✅ All existing records have correct program type');
    }

    // Final verification
    console.log('\n📊 FINAL VERIFICATION:');
    
    const finalCheck = await pool.query(`
      SELECT 
        program_type_at_attendance,
        COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) AND attendance_date = '2026-02-16'
      GROUP BY program_type_at_attendance
    `, [foundIds]);

    console.log('Feb 16th attendance by program type:');
    finalCheck.rows.forEach(row => {
      console.log(`   ${row.program_type_at_attendance}: ${row.count} records`);
    });

    const totalFeb16 = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) AND attendance_date = '2026-02-16'
    `, [foundIds]);

    console.log(`\n✅ Total Feb 16th records: ${totalFeb16.rows[0].count}/${foundIds.length} youth`);

    // Show sample of added records
    const sampleRecords = await pool.query(`
      SELECT youth_id, program_type_at_attendance, notes
      FROM attendance_records 
      WHERE youth_id = ANY($1) AND attendance_date = '2026-02-16'
      ORDER BY youth_id
      LIMIT 5
    `, [needAttendance]);

    if (sampleRecords.rows.length > 0) {
      console.log('\n📋 Sample added records:');
      sampleRecords.rows.forEach(record => {
        console.log(`   ${record.youth_id}: ${record.program_type_at_attendance}`);
      });
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`✅ Added ${attendanceAdded} new mobile mapping attendance records`);
    console.log(`✅ Corrected ${wrongProgramType.length} program type mismatches`);
    console.log('✅ Feb 16th Kariobangi mobile mapping attendance complete');
    console.log('✅ Records properly flagged as mobile mapping (before microtasking transition)');

  } catch (error) {
    console.error('❌ Adding attendance failed:', error.message);
  } finally {
    await pool.end();
  }
}

addKariobangiFeb16Attendance();
require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function batchMoveMicrotasking() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 BATCH MOVING YOUTH TO MICROTASKING\n');

    // HUR group (Mji wa Huruma) - Feb 16-18, 2026
    const hurGroup = [
      'HUR610SW', 'HUR438PW', 'HUR714AK', 'HUR558AC', 'HUR703SN',
      'HUR772BN', 'HUR770AN', 'HUR564KM', 'HUR788AW', 'HUR792SW',
      'HUR600HW', 'HUR689DM', 'HUR478JM', 'HUR468GW', 'HUR386PM',
      'HUR659SM', 'HUR452DM', 'HUR503EN', 'HUR773MN', 'HUR343SK'
    ];

    // KAR group (Kariobangi) - Feb 17-20, 2026
    const karGroup = [
      'KAR074GA', 'KAR040JK', 'KAR127FM', 'KAR422MM', 'KAR345WM',
      'KAR023MK', 'KAR388JM', 'KAR029AN', 'KAR208TS', 'KAR404RM',
      'KAR350MM', 'KAR370PM', 'KAR189CM', 'KAR297CM', 'KAR439SN',
      'KAR456PE', 'KAR212MN', 'KAR192TK', 'KAR385JM', 'KAR394EM',
      'KAR446FM', 'KAR393CM', 'KAR341CW', 'KAR447MK', 'KAR188MN',
      'KAR008CM', 'KAR342RK', 'KAR128DM', 'KAR090KM', 'KAR096WM',
      'KAR290SK', 'KAR285JM', 'KAR284KM', 'KAR092GS', 'KAR009MM',
      'KAR108BM', 'KAR112CM', 'KAR026MM', 'KAR191VM'
    ];

    console.log(`📊 Processing ${hurGroup.length} HUR youth and ${karGroup.length} KAR youth`);

    // Verify all youth exist and get current status
    console.log('\n🔍 VERIFYING ALL YOUTH EXIST:');
    const allYouthIds = [...hurGroup, ...karGroup];
    
    const existingYouth = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement
      FROM youth_participants 
      WHERE youth_id = ANY($1)
    `, [allYouthIds]);

    console.log(`✅ Found ${existingYouth.rows.length}/${allYouthIds.length} youth in database`);

    const foundIds = existingYouth.rows.map(y => y.youth_id);
    const missingIds = allYouthIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log('⚠️  Missing youth IDs:');
      missingIds.forEach(id => console.log(`   ${id}`));
    }

    // Update all youth to microtasking program
    console.log('\n🔄 UPDATING ALL YOUTH TO MICROTASKING PROGRAM...');
    
    await pool.query(`
      UPDATE youth_participants 
      SET program_type = 'microtasking', updated_at = NOW()
      WHERE youth_id = ANY($1)
    `, [foundIds]);
    
    console.log(`✅ Updated ${foundIds.length} youth to microtasking program`);

    // Add attendance for HUR group (Feb 16-18)
    console.log('\n📅 ADDING HUR GROUP ATTENDANCE (Feb 16-18):');
    const hurDates = ['2026-02-16', '2026-02-17', '2026-02-18'];
    const hurFoundIds = foundIds.filter(id => id.startsWith('HUR'));
    
    let hurAttendanceCount = 0;
    for (const youthId of hurFoundIds) {
      for (const date of hurDates) {
        // Check if attendance already exists
        const existing = await pool.query(
          'SELECT id FROM attendance_records WHERE youth_id = $1 AND attendance_date = $2',
          [youthId, date]
        );

        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO attendance_records (
              youth_id, attendance_date, submitted_at, submitted_by, 
              program_type_at_attendance, notes, data_source
            ) VALUES ($1, $2, NOW(), 'SYSTEM', 'microtasking', $3, 'real_time')
          `, [
            youthId, 
            date, 
            'Microtasking period: Feb 16-18, 2026. Huruma batch transition from mobile mapping.'
          ]);
          hurAttendanceCount++;
        }
      }
    }
    console.log(`✅ Added ${hurAttendanceCount} HUR attendance records`);

    // Add attendance for KAR group (Feb 17-20)
    console.log('\n📅 ADDING KAR GROUP ATTENDANCE (Feb 17-20):');
    const karDates = ['2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];
    const karFoundIds = foundIds.filter(id => id.startsWith('KAR'));
    
    let karAttendanceCount = 0;
    for (const youthId of karFoundIds) {
      for (const date of karDates) {
        // Check if attendance already exists
        const existing = await pool.query(
          'SELECT id FROM attendance_records WHERE youth_id = $1 AND attendance_date = $2',
          [youthId, date]
        );

        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO attendance_records (
              youth_id, attendance_date, submitted_at, submitted_by, 
              program_type_at_attendance, notes, data_source
            ) VALUES ($1, $2, NOW(), 'SYSTEM', 'microtasking', $3, 'real_time')
          `, [
            youthId, 
            date, 
            'Microtasking period: Feb 17-20, 2026. Kariobangi batch transition from mobile mapping.'
          ]);
          karAttendanceCount++;
        }
      }
    }
    console.log(`✅ Added ${karAttendanceCount} KAR attendance records`);

    // Verification summary
    console.log('\n📊 VERIFICATION SUMMARY:');
    
    const microtaskingCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM youth_participants 
      WHERE youth_id = ANY($1) AND program_type = 'microtasking'
    `, [foundIds]);
    
    console.log(`✅ Youth now in microtasking: ${microtaskingCount.rows[0].count}`);

    // Check attendance by settlement
    const hurAttendanceCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) 
        AND attendance_date BETWEEN '2026-02-16' AND '2026-02-18'
        AND program_type_at_attendance = 'microtasking'
    `, [hurFoundIds]);

    const karAttendanceCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) 
        AND attendance_date BETWEEN '2026-02-17' AND '2026-02-20'
        AND program_type_at_attendance = 'microtasking'
    `, [karFoundIds]);

    console.log(`✅ HUR microtasking attendance records: ${hurAttendanceCheck.rows[0].count}`);
    console.log(`✅ KAR microtasking attendance records: ${karAttendanceCheck.rows[0].count}`);

    // Show sample from each group
    console.log('\n📋 SAMPLE VERIFICATION:');
    
    const sampleHur = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement
      FROM youth_participants 
      WHERE youth_id = ANY($1) AND youth_id LIKE 'HUR%'
      LIMIT 3
    `, [foundIds]);

    console.log('HUR Group Sample:');
    sampleHur.rows.forEach(youth => {
      console.log(`   ${youth.youth_id} (${youth.full_name}) - ${youth.program_type} in ${youth.settlement}`);
    });

    const sampleKar = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement
      FROM youth_participants 
      WHERE youth_id = ANY($1) AND youth_id LIKE 'KAR%'
      LIMIT 3
    `, [foundIds]);

    console.log('KAR Group Sample:');
    sampleKar.rows.forEach(youth => {
      console.log(`   ${youth.youth_id} (${youth.full_name}) - ${youth.program_type} in ${youth.settlement}`);
    });

    console.log('\n🎉 BATCH MIGRATION COMPLETE!');
    console.log(`✅ ${hurFoundIds.length} Huruma youth: Feb 16-18 microtasking`);
    console.log(`✅ ${karFoundIds.length} Kariobangi youth: Feb 17-20 microtasking`);
    console.log(`✅ Total: ${foundIds.length} youth moved to microtasking`);
    console.log('✅ Mobile mapping history preserved for all');

  } catch (error) {
    console.error('❌ Batch migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

batchMoveMicrotasking();
require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function movePaulToMicrotaskingFixed() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('👤 MOVING PAUL NJOROGE (HUR438PW) TO MICROTASKING\n');

    // First, check Paul's current status (using correct column names)
    console.log('📋 CHECKING CURRENT PAUL STATUS:');
    const currentStatus = await pool.query(`
      SELECT youth_id, youth_name, program_type, settlement, osm_username
      FROM youth_participants 
      WHERE youth_id = 'HUR438PW'
    `);

    if (currentStatus.rows.length === 0) {
      console.log('❌ Paul not found in database');
      return;
    }

    const paul = currentStatus.rows[0];
    console.log(`   Name: ${paul.youth_name}`);
    console.log(`   Current Program: ${paul.program_type}`);
    console.log(`   Settlement: ${paul.settlement}`);
    console.log(`   OSM Username: ${paul.osm_username || 'None'}`);

    // Check existing attendance records
    const existingAttendance = await pool.query(`
      SELECT attendance_date, program_type_at_attendance, submitted_by, notes
      FROM attendance_records 
      WHERE youth_id = 'HUR438PW'
      ORDER BY attendance_date DESC
      LIMIT 10
    `);

    console.log(`\n📅 EXISTING ATTENDANCE (last 10):`);
    if (existingAttendance.rows.length === 0) {
      console.log('   No attendance records found');
    } else {
      existingAttendance.rows.forEach(record => {
        console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.program_type_at_attendance}`);
      });
    }

    // Update Paul's program type to microtasking
    console.log('\n🔄 UPDATING PROGRAM TYPE TO MICROTASKING...');
    await pool.query(`
      UPDATE youth_participants 
      SET program_type = 'microtasking'
      WHERE youth_id = 'HUR438PW'
    `);
    console.log('✅ Program type updated to microtasking');

    // Add attendance records for Feb 16-18, 2026
    console.log('\n📝 ADDING MICROTASKING ATTENDANCE RECORDS:');
    
    const attendanceDates = [
      { date: '2026-02-16', day: 'Monday' },
      { date: '2026-02-17', day: 'Tuesday' },
      { date: '2026-02-18', day: 'Wednesday' }
    ];

    for (const { date, day } of attendanceDates) {
      // Check if attendance already exists for this date
      const existingCheck = await pool.query(`
        SELECT id FROM attendance_records 
        WHERE youth_id = 'HUR438PW' AND attendance_date = $1
      `, [date]);

      if (existingCheck.rows.length > 0) {
        console.log(`   ${date} (${day}): Already exists, updating to microtasking`);
        await pool.query(`
          UPDATE attendance_records 
          SET program_type_at_attendance = 'microtasking',
              notes = 'Updated: Switched to microtasking program Feb 16-18'
          WHERE youth_id = 'HUR438PW' AND attendance_date = $1
        `, [date]);
      } else {
        console.log(`   ${date} (${day}): Adding new microtasking attendance`);
        await pool.query(`
          INSERT INTO attendance_records (
            youth_id, attendance_date, submitted_at, submitted_by, 
            program_type_at_attendance, notes, data_source
          ) VALUES ($1, $2, NOW(), 'SYSTEM', $3, $4, 'real_time')
        `, [
          'HUR438PW',
          date,
          'microtasking',
          'Microtasking period: Feb 16-18, 2026. Switched from mobile mapping.'
        ]);
      }
    }

    // Verify final status
    console.log('\n✅ VERIFICATION:');
    
    const finalStatus = await pool.query(`
      SELECT program_type FROM youth_participants WHERE youth_id = 'HUR438PW'
    `);
    console.log(`   Program type: ${finalStatus.rows[0].program_type}`);

    const recentAttendance = await pool.query(`
      SELECT attendance_date, program_type_at_attendance, notes
      FROM attendance_records 
      WHERE youth_id = 'HUR438PW' 
        AND attendance_date BETWEEN '2026-02-16' AND '2026-02-18'
      ORDER BY attendance_date
    `);

    console.log('\n📅 MICROTASKING ATTENDANCE RECORDS:');
    recentAttendance.rows.forEach(record => {
      console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.program_type_at_attendance}`);
      if (record.notes) console.log(`     Notes: ${record.notes}`);
    });

    // Show his mobile mapping history is preserved
    const mobileHistory = await pool.query(`
      SELECT attendance_date, program_type_at_attendance
      FROM attendance_records 
      WHERE youth_id = 'HUR438PW' 
        AND program_type_at_attendance = 'mobile_mapping'
      ORDER BY attendance_date DESC
      LIMIT 5
    `);

    if (mobileHistory.rows.length > 0) {
      console.log('\n📱 MOBILE MAPPING HISTORY PRESERVED (last 5):');
      mobileHistory.rows.forEach(record => {
        console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.program_type_at_attendance}`);
      });
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Paul Njoroge (HUR438PW) moved to microtasking');
    console.log('✅ Attendance logged for Feb 16-18, 2026');
    console.log('✅ Mobile mapping history preserved');
    console.log('✅ Microtasking period documented');

  } catch (error) {
    console.error('❌ Paul migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

movePaulToMicrotaskingFixed();
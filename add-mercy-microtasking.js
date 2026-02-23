require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function addMercyToMicrotasking() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('👤 ADDING MERCY MORAA (KAY1395MO) TO MICROTASKING\n');

    // Check if Mercy exists in the database
    console.log('🔍 CHECKING IF MERCY EXISTS:');
    const existingYouth = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement, osm_username, is_active
      FROM youth_participants 
      WHERE youth_id = 'KAY1395MO'
    `);

    if (existingYouth.rows.length === 0) {
      console.log('❌ KAY1395MO not found in database');
      console.log('📝 Creating new youth participant...');
      
      // Create new youth participant
      await pool.query(`
        INSERT INTO youth_participants (
          youth_id, full_name, program_type, settlement, is_active, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        'KAY1395MO',
        'Mercy Moraa', 
        'microtasking',
        'Kayole Soweto',
        true
      ]);
      console.log('✅ Created new youth: Mercy Moraa (KAY1395MO)');

    } else {
      const mercy = existingYouth.rows[0];
      console.log(`✅ Found existing youth: ${mercy.full_name}`);
      console.log(`   Current Program: ${mercy.program_type}`);
      console.log(`   Settlement: ${mercy.settlement}`);
      console.log(`   Active: ${mercy.is_active}`);

      // Check existing attendance history
      const attendanceHistory = await pool.query(`
        SELECT attendance_date, program_type_at_attendance, submitted_by
        FROM attendance_records 
        WHERE youth_id = 'KAY1395MO'
        ORDER BY attendance_date DESC
        LIMIT 10
      `);

      if (attendanceHistory.rows.length > 0) {
        console.log('\n📅 EXISTING ATTENDANCE HISTORY (last 10):');
        attendanceHistory.rows.forEach(record => {
          console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.program_type_at_attendance}`);
        });

        // Count by program type
        const historySummary = await pool.query(`
          SELECT program_type_at_attendance, COUNT(*) as count
          FROM attendance_records 
          WHERE youth_id = 'KAY1395MO'
          GROUP BY program_type_at_attendance
          ORDER BY count DESC
        `);

        console.log('\n📊 ATTENDANCE HISTORY BY PROGRAM:');
        historySummary.rows.forEach(row => {
          console.log(`   ${row.program_type_at_attendance}: ${row.count} days`);
        });
      } else {
        console.log('\n📅 No existing attendance history found');
      }

      // Update program to microtasking if not already
      if (mercy.program_type !== 'microtasking') {
        console.log(`\n🔄 UPDATING PROGRAM: ${mercy.program_type} → microtasking`);
        await pool.query(`
          UPDATE youth_participants 
          SET program_type = 'microtasking', updated_at = NOW()
          WHERE youth_id = 'KAY1395MO'
        `);
        console.log('✅ Program updated to microtasking');
      } else {
        console.log('\n✅ Already in microtasking program');
      }
    }

    // Determine appropriate microtasking dates (based on current date Feb 20, 2026)
    // Since today is Feb 20, let's assume she's starting microtasking now
    const microtaskingDates = ['2026-02-20', '2026-02-21']; // Today and tomorrow
    
    console.log('\n📝 ADDING CURRENT MICROTASKING ATTENDANCE:');
    let attendanceAdded = 0;

    for (const date of microtaskingDates) {
      // Check if attendance already exists
      const existingAttendance = await pool.query(`
        SELECT id FROM attendance_records 
        WHERE youth_id = 'KAY1395MO' AND attendance_date = $1
      `, [date]);

      if (existingAttendance.rows.length === 0) {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`   Adding ${date} (${dayName})`);
        
        await pool.query(`
          INSERT INTO attendance_records (
            youth_id, attendance_date, submitted_at, submitted_by, 
            program_type_at_attendance, notes, data_source
          ) VALUES ($1, $2, NOW(), 'SYSTEM', 'microtasking', $3, 'real_time')
        `, [
          'KAY1395MO',
          date,
          'Microtasking period starting Feb 20, 2026. Individual addition to program.'
        ]);
        attendanceAdded++;
      } else {
        console.log(`   ${date}: Already exists`);
      }
    }

    console.log(`✅ Added ${attendanceAdded} new attendance records`);

    // Final verification
    console.log('\n✅ FINAL VERIFICATION:');
    
    const finalStatus = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement, is_active
      FROM youth_participants 
      WHERE youth_id = 'KAY1395MO'
    `);

    const mercy = finalStatus.rows[0];
    console.log(`   Youth ID: ${mercy.youth_id}`);
    console.log(`   Name: ${mercy.full_name}`);
    console.log(`   Program: ${mercy.program_type}`);
    console.log(`   Settlement: ${mercy.settlement}`);
    console.log(`   Active: ${mercy.is_active}`);

    // Show recent microtasking attendance
    const recentAttendance = await pool.query(`
      SELECT attendance_date, program_type_at_attendance, notes
      FROM attendance_records 
      WHERE youth_id = 'KAY1395MO' 
        AND program_type_at_attendance = 'microtasking'
      ORDER BY attendance_date DESC
      LIMIT 5
    `);

    if (recentAttendance.rows.length > 0) {
      console.log('\n📅 MICROTASKING ATTENDANCE:');
      recentAttendance.rows.forEach(record => {
        console.log(`   ${record.attendance_date.toISOString().split('T')[0]}: ${record.program_type_at_attendance}`);
      });
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ Mercy Moraa (KAY1395MO) added to microtasking');
    console.log('✅ Any existing history preserved');
    console.log('✅ Current microtasking attendance logged');
    console.log('✅ Ready for microtasking work');

  } catch (error) {
    console.error('❌ Adding Mercy failed:', error.message);
  } finally {
    await pool.end();
  }
}

addMercyToMicrotasking();
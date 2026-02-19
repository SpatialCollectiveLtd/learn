require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function verifyAndCompleteTransition() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 VERIFYING MICROTASKING TRANSITION STATUS\n');

    // All target youth
    const hurGroup = [
      'HUR610SW', 'HUR438PW', 'HUR714AK', 'HUR558AC', 'HUR703SN',
      'HUR772BN', 'HUR770AN', 'HUR564KM', 'HUR788AW', 'HUR792SW',
      'HUR600HW', 'HUR689DM', 'HUR478JM', 'HUR468GW', 'HUR386PM',
      'HUR659SM', 'HUR452DM', 'HUR503EN', 'HUR773MN', 'HUR343SK'
    ];

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

    // Check program status
    const programStatus = await pool.query(`
      SELECT 
        CASE WHEN youth_id LIKE 'HUR%' THEN 'HUR' ELSE 'KAR' END as group_name,
        program_type,
        COUNT(*) as count
      FROM youth_participants 
      WHERE youth_id = ANY($1)
      GROUP BY 1, 2
      ORDER BY 1, 2
    `, [[...hurGroup, ...karGroup]]);

    console.log('📊 CURRENT PROGRAM STATUS:');
    programStatus.rows.forEach(row => {
      console.log(`   ${row.group_name} - ${row.program_type}: ${row.count} youth`);
    });

    // Check attendance status
    const hurAttendanceStatus = await pool.query(`
      SELECT 
        attendance_date,
        COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) 
        AND attendance_date BETWEEN '2026-02-16' AND '2026-02-18'
        AND program_type_at_attendance = 'microtasking'
      GROUP BY attendance_date
      ORDER BY attendance_date
    `, [hurGroup]);

    console.log('\n📅 HUR ATTENDANCE STATUS (Feb 16-18):');
    hurAttendanceStatus.rows.forEach(row => {
      console.log(`   ${row.attendance_date.toISOString().split('T')[0]}: ${row.count} records`);
    });

    const karAttendanceStatus = await pool.query(`
      SELECT 
        attendance_date,
        COUNT(*) as count
      FROM attendance_records 
      WHERE youth_id = ANY($1) 
        AND attendance_date BETWEEN '2026-02-17' AND '2026-02-20'
        AND program_type_at_attendance = 'microtasking'
      GROUP BY attendance_date
      ORDER BY attendance_date
    `, [karGroup]);

    console.log('\n📅 KAR ATTENDANCE STATUS (Feb 17-20):');
    if (karAttendanceStatus.rows.length === 0) {
      console.log('   No KAR microtasking attendance found - needs completion');
    } else {
      karAttendanceStatus.rows.forEach(row => {
        console.log(`   ${row.attendance_date.toISOString().split('T')[0]}: ${row.count} records`);
      });
    }

    // Complete missing KAR attendance
    console.log('\n🔧 COMPLETING KAR ATTENDANCE...');
    const karDates = ['2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20'];
    
    // Get existing KAR youth in microtasking
    const karInMicrotasking = await pool.query(`
      SELECT youth_id FROM youth_participants 
      WHERE youth_id = ANY($1) AND program_type = 'microtasking'
    `, [karGroup]);

    const karFoundIds = karInMicrotasking.rows.map(r => r.youth_id);
    console.log(`   Found ${karFoundIds.length} KAR youth in microtasking`);

    let karAttendanceAdded = 0;
    for (const youthId of karFoundIds) {
      for (const date of karDates) {
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
            'Microtasking period: Feb 17-20, 2026. Kariobangi batch transition.'
          ]);
          karAttendanceAdded++;
        }
      }
      
      if ((karFoundIds.indexOf(youthId) + 1) % 10 === 0) {
        console.log(`   Processed ${karFoundIds.indexOf(youthId) + 1}/${karFoundIds.length} KAR youth`);
      }
    }

    console.log(`✅ Added ${karAttendanceAdded} KAR attendance records`);

    // Final verification
    console.log('\n📊 FINAL VERIFICATION:');
    
    const finalCounts = await pool.query(`
      SELECT 
        CASE WHEN youth_id LIKE 'HUR%' THEN 'HUR' ELSE 'KAR' END as group_name,
        COUNT(*) as youth_count
      FROM youth_participants 
      WHERE youth_id = ANY($1) AND program_type = 'microtasking'
      GROUP BY 1
    `, [[...hurGroup, ...karGroup]]);

    finalCounts.rows.forEach(row => {
      console.log(`   ${row.group_name} youth in microtasking: ${row.youth_count}`);
    });

    const attendanceTotals = await pool.query(`
      SELECT 
        CASE WHEN youth_id LIKE 'HUR%' THEN 'HUR' ELSE 'KAR' END as group_name,
        COUNT(*) as attendance_count
      FROM attendance_records 
      WHERE youth_id = ANY($1) 
        AND program_type_at_attendance = 'microtasking'
        AND (
          (youth_id LIKE 'HUR%' AND attendance_date BETWEEN '2026-02-16' AND '2026-02-18') OR
          (youth_id LIKE 'KAR%' AND attendance_date BETWEEN '2026-02-17' AND '2026-02-20')
        )
      GROUP BY 1
    `, [[...hurGroup, ...karGroup]]);

    attendanceTotals.rows.forEach(row => {
      console.log(`   ${row.group_name} attendance records: ${row.attendance_count}`);
    });

    console.log('\n🎉 MICROTASKING TRANSITION COMPLETE!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAndCompleteTransition();
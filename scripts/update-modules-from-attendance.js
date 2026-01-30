// Update Module Assignments Based on Attendance Data Truth
// Attendance records are the source of truth for module assignment

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

async function updateModulesFromAttendance() {
  console.log('🔄 UPDATING MODULE ASSIGNMENTS FROM ATTENDANCE DATA');
  console.log('===================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Analyze current state vs attendance
    console.log('1️⃣ Analyzing current assignments vs attendance:');
    
    const analysis = await pool.query(`
      WITH attendance_patterns AS (
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.program_type as current_module,
          COUNT(ar.id) as attendance_count,
          MIN(ar.attendance_date) as first_attendance,
          MAX(ar.attendance_date) as last_attendance,
          -- Determine correct module based on attendance
          CASE
            -- Kayole with attendance before Jan 23 (digitization period) = digitization
            WHEN yp.settlement = 'Kayole' AND MIN(ar.attendance_date) <= '2026-01-22' THEN 'digitization'
            -- All other attendance = mobile_mapping
            WHEN COUNT(ar.id) > 0 THEN 'mobile_mapping'
            -- No attendance, keep current assignment
            ELSE yp.program_type
          END as correct_module
        FROM youth_participants yp
        LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
        WHERE yp.is_active = TRUE
        GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type
      )
      SELECT 
        youth_id,
        full_name,
        settlement,
        current_module,
        correct_module,
        attendance_count,
        first_attendance,
        last_attendance
      FROM attendance_patterns
      WHERE current_module != correct_module
      ORDER BY settlement, youth_id
    `);

    console.log(`   Found ${analysis.rows.length} youth needing module updates:\n`);
    
    if (analysis.rows.length === 0) {
      console.log('   ✅ All module assignments match attendance data!');
      console.log('   No updates needed.\n');
      await pool.end();
      return;
    }

    // Group by change type
    const toDigitization = analysis.rows.filter(y => y.correct_module === 'digitization');
    const toMobileMapping = analysis.rows.filter(y => y.correct_module === 'mobile_mapping');

    console.log(`   → Moving to digitization: ${toDigitization.length} youth`);
    toDigitization.forEach(y => {
      console.log(`      ${y.youth_id} - ${y.full_name} (${y.settlement})`);
      console.log(`         Currently: ${y.current_module}, Attendance: ${y.attendance_count} days (${y.first_attendance} to ${y.last_attendance})`);
    });
    
    console.log(`\n   → Moving to mobile_mapping: ${toMobileMapping.length} youth`);
    toMobileMapping.forEach(y => {
      console.log(`      ${y.youth_id} - ${y.full_name} (${y.settlement})`);
      console.log(`         Currently: ${y.current_module}, Attendance: ${y.attendance_count} days (${y.first_attendance} to ${y.last_attendance})`);
    });
    console.log('');

    // 2. Create backup
    console.log('2️⃣ Creating backup before updates...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = 'backups';
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup all youth data
    const allYouth = await pool.query('SELECT * FROM youth_participants ORDER BY youth_id');
    fs.writeFileSync(
      `${backupDir}/youth_participants_backup_${timestamp}.json`,
      JSON.stringify(allYouth.rows, null, 2)
    );

    // Backup youth to be changed
    fs.writeFileSync(
      `${backupDir}/youth_to_update_${timestamp}.json`,
      JSON.stringify(analysis.rows, null, 2)
    );

    // Create SQL backup
    const sqlStatements = analysis.rows.map(y => 
      `UPDATE youth_participants SET program_type = '${y.current_module}' WHERE youth_id = '${y.youth_id}';`
    ).join('\n');
    
    fs.writeFileSync(
      `${backupDir}/restore_youth_modules_${timestamp}.sql`,
      `-- Restore script - run this to undo the module updates\n-- Created: ${new Date().toISOString()}\n\n${sqlStatements}\n`
    );

    console.log(`   ✅ Backups created:`);
    console.log(`      - ${backupDir}/youth_participants_backup_${timestamp}.json (all youth)`);
    console.log(`      - ${backupDir}/youth_to_update_${timestamp}.json (${analysis.rows.length} youth to change)`);
    console.log(`      - ${backupDir}/restore_youth_modules_${timestamp}.sql (rollback script)\n`);

    // 3. Apply updates in transaction
    console.log('3️⃣ Applying module updates...');
    console.log('   ⏳ Starting transaction in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    await pool.query('BEGIN');

    try {
      // Update based on attendance patterns
      const updateResult = await pool.query(`
        UPDATE youth_participants yp
        SET program_type = CASE
          -- Kayole with attendance before Jan 23 = digitization
          WHEN yp.settlement = 'Kayole' 
            AND EXISTS (
              SELECT 1 FROM attendance_records ar 
              WHERE ar.youth_id = yp.youth_id 
              AND ar.attendance_date <= '2026-01-22'
            ) THEN 'digitization'
          -- All other attendance = mobile_mapping  
          WHEN EXISTS (
            SELECT 1 FROM attendance_records ar 
            WHERE ar.youth_id = yp.youth_id
          ) THEN 'mobile_mapping'
          -- No change if no attendance
          ELSE yp.program_type
        END
        WHERE yp.is_active = TRUE
        AND yp.program_type != CASE
          WHEN yp.settlement = 'Kayole' 
            AND EXISTS (
              SELECT 1 FROM attendance_records ar 
              WHERE ar.youth_id = yp.youth_id 
              AND ar.attendance_date <= '2026-01-22'
            ) THEN 'digitization'
          WHEN EXISTS (
            SELECT 1 FROM attendance_records ar 
            WHERE ar.youth_id = yp.youth_id
          ) THEN 'mobile_mapping'
          ELSE yp.program_type
        END
      `);

      await pool.query('COMMIT');
      
      console.log(`   ✅ Successfully updated ${updateResult.rowCount} youth\n`);

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    // 4. Verify updates
    console.log('4️⃣ Verifying updates:');
    
    const verification = await pool.query(`
      SELECT 
        settlement,
        program_type,
        COUNT(*) as youth_count,
        COUNT(DISTINCT ar.youth_id) as with_attendance,
        COUNT(*) - COUNT(DISTINCT ar.youth_id) as without_attendance
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY settlement, program_type
      ORDER BY settlement, program_type
    `);

    verification.rows.forEach(row => {
      console.log(`   ${row.settlement} - ${row.program_type}:`);
      console.log(`      Total: ${row.youth_count} youth`);
      console.log(`      With attendance: ${row.with_attendance}`);
      console.log(`      Without attendance: ${row.without_attendance}`);
    });
    console.log('');

    // 5. Verify against attendance records
    console.log('5️⃣ Cross-checking with attendance records:');
    
    const attendanceCheck = await pool.query(`
      SELECT 
        yp.settlement,
        yp.program_type,
        COUNT(ar.id) as attendance_records,
        COUNT(DISTINCT ar.youth_id) as unique_youth
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.program_type
    `);

    console.log('   Attendance records by settlement and module:');
    attendanceCheck.rows.forEach(row => {
      console.log(`      ${row.settlement} - ${row.program_type}: ${row.attendance_records} records (${row.unique_youth} youth)`);
    });
    console.log('');

    // 6. Summary
    console.log('📊 UPDATE SUMMARY');
    console.log('=================');
    
    const finalCounts = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as total_youth,
        COUNT(DISTINCT ar.youth_id) as youth_with_attendance
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE
      GROUP BY program_type
      ORDER BY program_type
    `);

    finalCounts.rows.forEach(row => {
      console.log(`${row.program_type}: ${row.total_youth} youth (${row.youth_with_attendance} with attendance)`);
    });

    console.log('\n✅ Module assignments now match attendance data!');
    console.log('   Attendance records are the source of truth.');
    console.log(`   Backup available for rollback: ${backupDir}/restore_youth_modules_${timestamp}.sql\n`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

updateModulesFromAttendance();

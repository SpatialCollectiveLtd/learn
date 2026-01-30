// Backup Youth Participants Data Before Module Fix
// Creates a timestamped backup of youth_participants table

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');

async function backupYouthData() {
  console.log('💾 Backing Up Youth Participants Data');
  console.log('======================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = 'backups';
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      console.log(`✅ Created ${backupDir}/ directory\n`);
    }

    // 1. Backup all youth_participants data
    console.log('1️⃣ Backing up youth_participants table...\n');
    
    const allYouth = await pool.query(`
      SELECT 
        youth_id,
        full_name,
        email,
        phone_number,
        program_type,
        settlement,
        osm_username,
        is_active,
        created_at,
        updated_at,
        last_login
      FROM youth_participants
      ORDER BY youth_id
    `);

    const jsonBackupPath = `${backupDir}/youth_participants_backup_${timestamp}.json`;
    fs.writeFileSync(jsonBackupPath, JSON.stringify(allYouth.rows, null, 2));
    console.log(`✅ JSON backup saved: ${jsonBackupPath}`);
    console.log(`   Records: ${allYouth.rows.length}\n`);

    // 2. Create SQL INSERT statements for easy restoration
    console.log('2️⃣ Creating SQL backup...\n');
    
    const sqlBackupPath = `${backupDir}/youth_participants_backup_${timestamp}.sql`;
    let sqlContent = `-- Youth Participants Backup\n`;
    sqlContent += `-- Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- Total records: ${allYouth.rows.length}\n\n`;
    sqlContent += `-- To restore, run this file in psql or pgAdmin\n\n`;
    
    // Create update statements for restoration
    sqlContent += `-- Update statements to restore program_type values\n`;
    sqlContent += `BEGIN;\n\n`;
    
    allYouth.rows.forEach(row => {
      sqlContent += `UPDATE youth_participants SET program_type = '${row.program_type}' WHERE youth_id = '${row.youth_id}';\n`;
    });
    
    sqlContent += `\nCOMMIT;\n`;
    
    fs.writeFileSync(sqlBackupPath, sqlContent);
    console.log(`✅ SQL backup saved: ${sqlBackupPath}\n`);

    // 3. Backup specific youth that will be updated
    console.log('3️⃣ Backing up youth that will be updated...\n');
    
    const toUpdate = await pool.query(`
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
        EXISTS (
          SELECT 1 FROM youth_training_progress ytp2 
          WHERE ytp2.youth_id = yp.youth_id 
          AND ytp2.module_type = 'mobile_mapping'
        )
        OR
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

    const updateListPath = `${backupDir}/youth_to_update_${timestamp}.json`;
    fs.writeFileSync(updateListPath, JSON.stringify(toUpdate.rows, null, 2));
    console.log(`✅ Youth to update list saved: ${updateListPath}`);
    console.log(`   Records to update: ${toUpdate.rows.length}\n`);

    // 4. Create restoration script
    console.log('4️⃣ Creating restoration script...\n');
    
    const restoreScriptPath = `${backupDir}/restore_youth_modules_${timestamp}.sql`;
    let restoreContent = `-- RESTORATION SCRIPT\n`;
    restoreContent += `-- Use this to restore original program_type values if needed\n`;
    restoreContent += `-- Created: ${new Date().toISOString()}\n\n`;
    restoreContent += `BEGIN;\n\n`;
    
    toUpdate.rows.forEach(row => {
      restoreContent += `-- ${row.full_name} (${row.settlement})\n`;
      restoreContent += `UPDATE youth_participants SET program_type = '${row.current_module}' WHERE youth_id = '${row.youth_id}';\n\n`;
    });
    
    restoreContent += `COMMIT;\n\n`;
    restoreContent += `-- Verify restoration:\n`;
    restoreContent += `SELECT program_type, COUNT(*) FROM youth_participants WHERE is_active = TRUE GROUP BY program_type;\n`;
    
    fs.writeFileSync(restoreScriptPath, restoreContent);
    console.log(`✅ Restoration script saved: ${restoreScriptPath}\n`);

    // 5. Summary
    console.log('📊 BACKUP SUMMARY');
    console.log('=================');
    console.log(`✅ Full JSON backup: ${jsonBackupPath}`);
    console.log(`✅ Full SQL backup: ${sqlBackupPath}`);
    console.log(`✅ Update list: ${updateListPath}`);
    console.log(`✅ Restoration script: ${restoreScriptPath}\n`);
    
    console.log(`Total youth in database: ${allYouth.rows.length}`);
    console.log(`Youth to be updated: ${toUpdate.rows.length}\n`);
    
    // Current distribution
    const distribution = await pool.query(`
      SELECT program_type, COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE
      GROUP BY program_type
      ORDER BY program_type
    `);
    
    console.log('Current module distribution:');
    distribution.rows.forEach(row => {
      console.log(`   ${row.program_type}: ${row.count}`);
    });
    console.log('');
    
    console.log('✅ Backup complete! Safe to proceed with fixes.\n');
    console.log('To restore if needed:');
    console.log(`   psql $DATABASE_URL -f ${restoreScriptPath}\n`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

backupYouthData();

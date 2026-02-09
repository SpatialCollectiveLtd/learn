require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function emergencyCheckProgramTypes() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚨 EMERGENCY: CHECKING PROGRAM TYPE DISTRIBUTION...\n');
    console.log('='.repeat(80));

    // 1. Count by program_type
    const programCount = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as count
      FROM youth_participants
      GROUP BY program_type
      ORDER BY count DESC;
    `);
    
    console.log('\n1. CURRENT PROGRAM TYPE DISTRIBUTION:');
    programCount.rows.forEach(row => {
      console.log(`   ${row.program_type}: ${row.count} users`);
    });

    // 2. Check module_assignment for digitization users
    const digitizationModules = await pool.query(`
      SELECT 
        module_assignment,
        COUNT(*) as count
      FROM youth_participants
      WHERE program_type = 'digitization'
      GROUP BY module_assignment;
    `);
    
    console.log('\n2. DIGITIZATION MODULE ASSIGNMENTS:');
    if (digitizationModules.rows.length === 0) {
      console.log('   ❌ NO DIGITIZATION USERS FOUND!');
    } else {
      digitizationModules.rows.forEach(row => {
        console.log(`   ${row.module_assignment}: ${row.count} users`);
      });
    }

    // 3. Sample youth IDs by program
    const samples = await pool.query(`
      SELECT 
        youth_id,
        full_name,
        program_type,
        module_assignment,
        settlement
      FROM youth_participants
      ORDER BY youth_id
      LIMIT 30;
    `);
    
    console.log('\n3. SAMPLE YOUTH (First 30):');
    samples.rows.forEach(row => {
      console.log(`   ${row.youth_id} | ${row.program_type} | ${row.module_assignment || 'N/A'} | ${row.settlement}`);
    });

    // 4. Check if we have backup data
    console.log('\n4. CHECKING BACKUP DATA...');
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, '..', 'backups', 'full-database-backup');
    
    if (fs.existsSync(backupDir)) {
      const backupFolders = fs.readdirSync(backupDir).filter(f => f.startsWith('backup-'));
      if (backupFolders.length > 0) {
        const latestBackup = backupFolders.sort().reverse()[0];
        const backupFile = path.join(backupDir, latestBackup, 'json', 'youth_participants.json');
        
        if (fs.existsSync(backupFile)) {
          console.log(`   ✅ Found backup: ${latestBackup}`);
          const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
          
          // Count program types in backup
          const backupCounts = {};
          backupData.forEach(youth => {
            backupCounts[youth.program_type] = (backupCounts[youth.program_type] || 0) + 1;
          });
          
          console.log('\n   BACKUP PROGRAM TYPE DISTRIBUTION:');
          Object.entries(backupCounts).forEach(([type, count]) => {
            console.log(`     ${type}: ${count} users`);
          });
          
          console.log(`\n   Total in backup: ${backupData.length} users`);
        } else {
          console.log('   ⚠️  Backup file not found');
        }
      } else {
        console.log('   ⚠️  No backup folders found');
      }
    } else {
      console.log('   ⚠️  Backup directory not found');
    }

    // 5. Check recent audit logs for program_type changes
    const auditLogs = await pool.query(`
      SELECT 
        action,
        table_name,
        record_id,
        changes,
        changed_by,
        changed_at
      FROM audit_log
      WHERE table_name = 'youth_participants'
        AND changes::text ILIKE '%program_type%'
      ORDER BY changed_at DESC
      LIMIT 20;
    `);
    
    console.log('\n5. RECENT PROGRAM_TYPE CHANGES IN AUDIT LOG:');
    if (auditLogs.rows.length === 0) {
      console.log('   ⚠️  No program_type changes found in audit log');
    } else {
      auditLogs.rows.forEach(log => {
        console.log(`   ${log.changed_at} | ${log.action} | ${log.record_id} | By: ${log.changed_by}`);
        console.log(`     Changes: ${JSON.stringify(log.changes)}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🚨 EMERGENCY CHECK COMPLETE\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

emergencyCheckProgramTypes();

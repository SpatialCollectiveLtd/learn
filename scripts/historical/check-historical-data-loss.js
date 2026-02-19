require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkHistoricalDataLoss() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚨 INVESTIGATING HISTORICAL DATA LOSS\n');

    // Check what data exists now
    const currentData = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as records
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-20' AND '2026-02-10'
      GROUP BY DATE(attendance_date)
      ORDER BY date
    `);

    console.log('📅 CURRENT ATTENDANCE RECORDS:');
    if (currentData.rows.length === 0) {
      console.log('❌ NO DATA FOUND in Jan-Feb period!');
    } else {
      currentData.rows.forEach(row => {
        console.log(`   ${row.date}: ${row.records} records`);
      });
    }

    // Check if backup data exists that we can restore
    const fs = require('fs');
    const backupDir = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z';
    const fullBackupPath = `${backupDir}/attendance_records_complete.json`;

    if (fs.existsSync(fullBackupPath)) {
      console.log('\n💾 CHECKING BACKUP DATA...');
      
      const backupData = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));
      
      // Count historical records in backup
      const historicalInBackup = backupData.filter(record => {
        const recordDate = new Date(record.attendance_date);
        return recordDate >= new Date('2026-01-26') && recordDate <= new Date('2026-02-06');
      });

      console.log(`📋 Historical records in backup (Jan 26 - Feb 6): ${historicalInBackup.length}`);
      
      if (historicalInBackup.length > 0) {
        // Group by date for summary
        const dailyBreakdown = {};
        historicalInBackup.forEach(record => {
          const date = record.attendance_date.split('T')[0];
          if (!dailyBreakdown[date]) {
            dailyBreakdown[date] = { total: 0, programs: {} };
          }
          dailyBreakdown[date].total++;
          const program = record.program_type_at_attendance || 'unknown';
          dailyBreakdown[date].programs[program] = (dailyBreakdown[date].programs[program] || 0) + 1;
        });
        
        console.log('\n📊 HISTORICAL DATA AVAILABLE FOR RESTORATION:');
        Object.entries(dailyBreakdown).sort().forEach(([date, data]) => {
          console.log(`   ${date}: ${data.total} records`);
          Object.entries(data.programs).forEach(([program, count]) => {
            console.log(`     ${program}: ${count}`);
          });
        });

        console.log('\n🚨 CRITICAL AUDIT ISSUE:');
        console.log('   ✅ Historical data exists in backup');
        console.log('   ❌ Historical data removed from active database');
        console.log('   ⚠️  Audit trail compromised');
        console.log('   💡 SOLUTION: Restore historical data with AUDIT flags');
        
      } else {
        console.log('❌ No historical records found in backup');
      }
      
    } else {
      console.log('❌ Backup file not found!');
      console.log(`   Expected: ${fullBackupPath}`);
    }

    console.log('\n🎯 IMMEDIATE ACTION REQUIRED:');
    console.log('1. Restore historical data from backup');
    console.log('2. Flag restored data as "RECONSTRUCTED" for audit purposes');
    console.log('3. Maintain audit trail while preserving data integrity flags');
    console.log('4. Implement separate flagging system instead of deletion');

  } catch (error) {
    console.error('❌ Investigation Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkHistoricalDataLoss();
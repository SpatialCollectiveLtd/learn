require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');

async function completeRestoration() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🎯 COMPLETING HISTORICAL RESTORATION FOR MISSING DATES\n');

    // Load backup data
    const backupPath = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z/attendance_records_complete.json';
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Check what dates are actually in the backup
    const missingDates = [
      '2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', 
      '2026-01-30', '2026-01-31', '2026-02-06'
    ];

    console.log('📊 CHECKING BACKUP FOR MISSING DATES:');
    
    for (const targetDate of missingDates) {
      const recordsForDate = backupData.filter(record => {
        const recordDate = new Date(record.attendance_date).toISOString().split('T')[0];
        return recordDate === targetDate;
      });
      
      console.log(`   ${targetDate}: ${recordsForDate.length} records in backup`);
      
      if (recordsForDate.length > 0) {
        // Check if already restored
        const existingCheck = await pool.query(`
          SELECT COUNT(*) as count 
          FROM attendance_records 
          WHERE attendance_date::date = $1
        `, [targetDate]);
        
        const existingCount = existingCheck.rows[0].count;
        console.log(`     Current in DB: ${existingCount} records`);
        
        if (existingCount == 0 && recordsForDate.length > 0) {
          console.log(`     ⚡ Restoring ${recordsForDate.length} records for ${targetDate}`);
          
          let restored = 0;
          for (const record of recordsForDate) {
            try {
              await pool.query(`
                INSERT INTO attendance_records (
                  youth_id, attendance_date, submitted_at, submitted_by, notes,
                  program_type_at_attendance, data_source, audit_notes, restored_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
              `, [
                record.youth_id,
                record.attendance_date,
                record.submitted_at,
                record.submitted_by, 
                record.notes,
                record.program_type_at_attendance,
                'bulk_reconstructed',
                'Historical attendance restored for audit compliance. Original bulk reconstruction preserved with quality flag.'
              ]);
              restored++;
            } catch (error) {
              if (!error.message.includes('duplicate')) {
                console.log(`     ⚠️  Error: ${error.message}`);
              }
            }
          }
          console.log(`     ✅ Successfully restored: ${restored} records`);
        }
      }
    }

    // Final verification
    console.log('\n📋 FINAL VERIFICATION:');
    
    const finalCheck = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as count,
        data_source
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
      GROUP BY DATE(attendance_date), data_source
      ORDER BY date, data_source
    `);

    finalCheck.rows.forEach(row => {
      console.log(`   ${row.date}: ${row.count} records (${row.data_source})`);
    });

    const totalAuditRecords = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
    `);

    console.log(`\n🎉 AUDIT COMPLIANCE SUMMARY:`);
    console.log(`✅ Total historical records restored: ${totalAuditRecords.rows[0].count}`);
    console.log(`✅ All records flagged as 'bulk_reconstructed'`);
    console.log(`✅ Audit notes provide quality context`);
    console.log(`✅ Historical timeline preserved for compliance`);

  } catch (error) {
    console.error('❌ Completion failed:', error.message);
  } finally {
    await pool.end();
  }
}

completeRestoration();
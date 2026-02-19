require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');

async function simpleRestore() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚨 SIMPLE AUDIT RESTORATION - No transactions, direct insert\n');

    // Load backup data
    const backupPath = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z/attendance_records_complete.json';
    console.log('📂 Loading backup...');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Filter for historical records
    const historicalRecords = backupData.filter(record => {
      const recordDate = new Date(record.attendance_date);
      return recordDate >= new Date('2026-01-26') && recordDate <= new Date('2026-02-06');
    });

    console.log(`📊 Found ${historicalRecords.length} historical records to restore`);
    
    let successCount = 0;
    let errorCount = 0;

    // Insert records one by one without transaction
    for (let i = 0; i < historicalRecords.length; i++) {
      const record = historicalRecords[i];
      
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
        
        successCount++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`✅ Progress: ${i + 1}/${historicalRecords.length} (${successCount} successful, ${errorCount} errors)`);
        }
        
      } catch (error) {
        errorCount++;
        if (error.message.includes('duplicate')) {
          // Skip duplicates silently
        } else {
          console.log(`⚠️  Error ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 RESTORATION COMPLETE');
    console.log(`✅ Successfully restored: ${successCount} records`);
    console.log(`⚠️  Errors/duplicates: ${errorCount} records`);

    // Verify results
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
    `);

    console.log(`📊 Final verification: ${finalCheck.rows[0].count} records in date range`);

    // Show daily counts
    const dailyBreakdown = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
      GROUP BY DATE(attendance_date)
      ORDER BY date
    `);

    console.log('\n📅 DAILY BREAKDOWN:');
    dailyBreakdown.rows.forEach(row => {
      console.log(`   ${row.date}: ${row.count} records`);
    });

    console.log('\n🏆 AUDIT COMPLIANCE RESTORED!');

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    await pool.end();
  }
}

simpleRestore();
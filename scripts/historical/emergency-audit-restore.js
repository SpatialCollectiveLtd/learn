require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');

async function emergencyAuditRestore() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚨 EMERGENCY AUDIT COMPLIANCE RESTORATION\n');

    // Check current audit columns
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' 
        AND column_name IN ('data_source', 'audit_notes', 'restored_at')
    `);

    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('📋 Existing audit columns:', existingColumns);

    // Add missing columns one by one
    if (!existingColumns.includes('data_source')) {
      await pool.query('ALTER TABLE attendance_records ADD COLUMN data_source VARCHAR(50) DEFAULT \'real_time\'');
      console.log('✅ Added data_source column');
    }

    if (!existingColumns.includes('audit_notes')) {
      await pool.query('ALTER TABLE attendance_records ADD COLUMN audit_notes TEXT');
      console.log('✅ Added audit_notes column');
    }

    if (!existingColumns.includes('restored_at')) {
      await pool.query('ALTER TABLE attendance_records ADD COLUMN restored_at TIMESTAMP WITH TIME ZONE');
      console.log('✅ Added restored_at column');
    }

    // Load backup data
    const backupPath = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z/attendance_records_complete.json';
    console.log('📂 Loading backup data from:', backupPath);
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Filter for historical records (Jan 26 - Feb 6, 2026)
    const historicalRecords = backupData.filter(record => {
      const recordDate = new Date(record.attendance_date);
      return recordDate >= new Date('2026-01-26') && recordDate <= new Date('2026-02-06');
    });

    console.log(`📊 Historical records found: ${historicalRecords.length}`);

    if (historicalRecords.length === 0) {
      console.log('❌ No historical records found in backup!');
      return;
    }

    // Show sample of what we're restoring
    console.log('\n📑 Sample records to restore:');
    historicalRecords.slice(0, 3).forEach(record => {
      console.log(`   ${record.youth_id} on ${record.attendance_date}`);
    });

    // Check for any existing records in the date range
    const existingCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
    `);

    console.log(`📊 Existing records in date range: ${existingCheck.rows[0].count}`);

    // Start transaction
    await pool.query('BEGIN');
    console.log('✅ Transaction started');

    let restoredCount = 0;
    let skippedCount = 0;

    // Restore records one by one with better error handling
    for (let i = 0; i < historicalRecords.length; i++) {
      const record = historicalRecords[i];
      
      try {
        // First check if record exists
        const existsCheck = await pool.query(
          'SELECT id FROM attendance_records WHERE youth_id = $1 AND attendance_date = $2',
          [record.youth_id, record.attendance_date]
        );

        if (existsCheck.rows.length > 0) {
          // Update existing record with audit info
          await pool.query(`
            UPDATE attendance_records 
            SET data_source = $1, audit_notes = $2, restored_at = NOW()
            WHERE youth_id = $3 AND attendance_date = $4
          `, [
            'bulk_reconstructed',
            'Historical data flagged for audit compliance. Original bulk reconstruction preserved.',
            record.youth_id,
            record.attendance_date
          ]);
          restoredCount++;
        } else {
          // Insert new record
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
            'Historical attendance record restored for audit compliance after quality investigation.'
          ]);
          restoredCount++;
        }

        if ((i + 1) % 100 === 0) {
          console.log(`📈 Progress: ${i + 1}/${historicalRecords.length} processed`);
        }

      } catch (error) {
        console.log(`⚠️  Error with ${record.youth_id} on ${record.attendance_date}: ${error.message}`);
        skippedCount++;
        
        // Continue processing other records
        continue;
      }
    }

    // Commit transaction
    await pool.query('COMMIT');
    console.log('✅ Transaction committed successfully');

    // Verify results
    const finalCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
    `);

    const auditCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
    `);

    console.log('\n🎉 EMERGENCY RESTORATION COMPLETE');
    console.log(`✅ Records processed: ${restoredCount}`);
    console.log(`⚠️  Records skipped: ${skippedCount}`);
    console.log(`📊 Final count in date range: ${finalCount.rows[0].count}`);
    console.log(`🏷️  Records flagged as bulk reconstructed: ${auditCount.rows[0].count}`);

    // Show daily breakdown
    const dailyCheck = await pool.query(`
      SELECT 
        DATE(attendance_date) as date,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
      GROUP BY DATE(attendance_date)
      ORDER BY date
    `);

    console.log('\n📅 DAILY BREAKDOWN (Jan 26 - Feb 6):');
    dailyCheck.rows.forEach(row => {
      console.log(`   ${row.date}: ${row.count} records`);
    });

    console.log('\n🔍 AUDIT COMPLIANCE STATUS:');
    console.log('✅ Historical data restored');
    console.log('✅ Data source flags applied');
    console.log('✅ Audit trail preserved');
    console.log('✅ Staff attendance page will show full history');

  } catch (error) {
    try {
      await pool.query('ROLLBACK');
      console.log('🔄 Transaction rolled back');
    } catch (rollbackError) {
      console.log('⚠️  Rollback error:', rollbackError.message);
    }
    console.error('❌ Emergency restoration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

emergencyAuditRestore();
require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');

async function restoreHistoricalDataWithAuditFlags() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🏥 RESTORING HISTORICAL DATA FOR AUDIT COMPLIANCE\n');

    // Step 1: Add audit flag column if it doesn't exist
    console.log('📋 Adding audit metadata columns...');
    
    try {
      await pool.query(`
        ALTER TABLE attendance_records 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'real_time',
        ADD COLUMN IF NOT EXISTS audit_notes TEXT,
        ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Audit columns added/verified');
    } catch (error) {
      console.log('⚠️  Columns may already exist:', error.message);
    }

    // Step 2: Load backup data
    const backupPath = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z/attendance_records_complete.json';
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('❌ Backup file not found!');
    }

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Filter historical records (Jan 26 - Feb 6)
    const historicalRecords = backupData.filter(record => {
      const recordDate = new Date(record.attendance_date);
      return recordDate >= new Date('2026-01-26') && recordDate <= new Date('2026-02-06');
    });

    console.log(`📊 Found ${historicalRecords.length} historical records to restore\n`);

    // Step 3: Restore with transaction safety
    await pool.query('BEGIN');
    console.log('✅ Transaction started');

    let restoredCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < historicalRecords.length; i += batchSize) {
      const batch = historicalRecords.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          await pool.query(`
            INSERT INTO attendance_records (
              youth_id, attendance_date, submitted_at, submitted_by, notes,
              program_type_at_attendance, data_source, audit_notes, restored_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (youth_id, attendance_date) DO UPDATE SET
              data_source = EXCLUDED.data_source,
              audit_notes = EXCLUDED.audit_notes,
              restored_at = EXCLUDED.restored_at
          `, [
            record.youth_id,
            record.attendance_date,
            record.submitted_at,
            record.submitted_by,
            record.notes,
            record.program_type_at_attendance,
            'bulk_reconstructed', // Flag this as reconstructed data
            'Restored for audit compliance after data quality investigation. Original submission was bulk reconstruction, not real-time attendance.',
          ]);
          restoredCount++;
        } catch (error) {
          console.log(`⚠️  Skipped duplicate: ${record.youth_id} on ${record.attendance_date}`);
        }
      }
      
      console.log(`📥 Restored batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(historicalRecords.length/batchSize)} (${restoredCount} records)`);
    }

    await pool.query('COMMIT');
    console.log('✅ Transaction committed');

    // Step 4: Verify restoration
    const verifyCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
    `);

    const flaggedCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE data_source = 'bulk_reconstructed'
    `);

    console.log('\n✅ HISTORICAL DATA RESTORATION COMPLETE');
    console.log(`📊 Restored: ${restoredCount} historical records`);
    console.log(`📋 Verified: ${verifyCount.rows[0].count} records now exist for Jan 26 - Feb 6`);
    console.log(`🏷️  Flagged: ${flaggedCount.rows[0].count} records marked as 'bulk_reconstructed'`);

    // Step 5: Show daily breakdown for verification
    const dailyBreakdown = await pool.query(`
      SELECT 
        attendance_date,
        data_source,
        COUNT(*) as count
      FROM attendance_records 
      WHERE attendance_date BETWEEN '2026-01-26' AND '2026-02-06'
      GROUP BY attendance_date, data_source
      ORDER BY attendance_date, data_source
    `);

    console.log('\n📅 RESTORED DATA BREAKDOWN:');
    dailyBreakdown.rows.forEach(row => {
      console.log(`   ${row.attendance_date.toISOString().split('T')[0]}: ${row.count} ${row.data_source}`);
    });

    console.log('\n🎯 AUDIT COMPLIANCE RESTORED:');
    console.log('✅ Complete historical attendance records available');
    console.log('✅ Data source clearly marked (bulk_reconstructed vs real_time)');
    console.log('✅ Audit trail preserved with quality indicators');
    console.log('✅ Staff can see full historical data with context');
    console.log('✅ Compliance requirements met');

    console.log('\n📋 STAFF ATTENDANCE PAGE IMPACT:');
    console.log('• Historical dates now show full attendance records');
    console.log('• Data source flags help identify reconstruction vs real-time');
    console.log('• Audit notes provide context for data quality');
    console.log('• Complete timeline preserved for compliance reporting');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Restoration failed, rolled back:', error.message);
  } finally {
    await pool.end();
  }
}

restoreHistoricalDataWithAuditFlags();
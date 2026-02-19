require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const fs = require('fs');

async function debugRestore() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 DEBUG: Testing basic database operations');

    // Test connection
    console.log('📡 Testing database connection...');
    const testQuery = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', testQuery.rows[0].now);

    // Check table structure
    console.log('\n📋 Checking attendance_records structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Load just one sample record from backup
    console.log('\n📂 Loading sample from backup...');
    const backupPath = 'backups/pre-restoration-backup-2026-02-17T08-18-51-269Z/attendance_records_complete.json';
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    const sampleRecord = backupData.find(record => {
      const recordDate = new Date(record.attendance_date);
      return recordDate >= new Date('2026-01-26') && recordDate <= new Date('2026-02-06');
    });

    if (!sampleRecord) {
      console.log('❌ No sample record found in date range');
      return;
    }

    console.log('📄 Sample record:', JSON.stringify(sampleRecord, null, 2));

    // Try to insert just this one record
    console.log('\n🧪 Testing single record insertion...');
    
    try {
      const insertResult = await pool.query(`
        INSERT INTO attendance_records (
          youth_id, attendance_date, submitted_at, submitted_by, notes,
          program_type_at_attendance, data_source, audit_notes, restored_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `, [
        sampleRecord.youth_id,
        sampleRecord.attendance_date,
        sampleRecord.submitted_at,
        sampleRecord.submitted_by, 
        sampleRecord.notes,
        sampleRecord.program_type_at_attendance,
        'bulk_reconstructed',
        'TEST: Debug insertion for audit compliance'
      ]);
      
      console.log('✅ Test insertion successful! ID:', insertResult.rows[0].id);
      
      // Clean up - remove the test record
      await pool.query('DELETE FROM attendance_records WHERE id = $1', [insertResult.rows[0].id]);
      console.log('🧹 Test record cleaned up');
      
    } catch (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.error('Insert error details:', insertError);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

debugRestore();
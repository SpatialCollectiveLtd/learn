require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function investigateAttendanceTableAndFix() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check attendance_records structure
    console.log('📋 ATTENDANCE_RECORDS TABLE STRUCTURE:');
    const arCols = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records'
      ORDER BY ordinal_position
    `);
    arCols.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });

    const hasModuleType = arCols.rows.some(c => c.column_name === 'module_type' || c.column_name === 'program_type');
    console.log(`\n   Has program_type/module_type column: ${hasModuleType}`);

    // Count problem scope - transferred youth with mobile mapping attendance
    console.log('\n📊 SCOPE OF PROBLEM:');
    
    // Youth who have attendance in mobile mapping date ranges but are now different programs
    const scope = await pool.query(`
      SELECT 
        yp.program_type as current_program,
        yp.settlement,
        COUNT(DISTINCT yp.youth_id) as youth_count,
        COUNT(DISTINCT ar.attendance_date) as date_count,
        COUNT(*) as total_records,
        MIN(ar.attendance_date) as from_date,
        MAX(ar.attendance_date) as to_date
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.program_type != 'mobile_mapping'
        AND yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos')
        AND ar.attendance_date >= '2026-02-01'
        AND ar.attendance_date <= '2026-02-23'
      GROUP BY yp.program_type, yp.settlement
      ORDER BY yp.settlement, yp.program_type
    `);

    console.log('   Former mobile mappers (now other programs) with Feb attendance:');
    scope.rows.forEach(row => {
      console.log(`   ${row.settlement} [now ${row.current_program}]: ${row.youth_count} youth, ${row.date_count} dates, ${row.total_records} total records`);
      console.log(`     Date range: ${row.from_date.toISOString().split('T')[0]} to ${row.to_date.toISOString().split('T')[0]}`);
    });

    // What DPW needs: full attendance per youth including mobile mapping period
    // even if youth is now microtasking
    console.log('\n🔑 WHAT DPW NEEDS FOR KAY098JO (mobile mapper):');
    const kay098Full = await pool.query(`
      SELECT attendance_date, submitted_at, submitted_by
      FROM attendance_records 
      WHERE youth_id = 'KAY098JO'
      ORDER BY attendance_date DESC
    `);
    console.log(`   Total attendance days (all time): ${kay098Full.rows.length}`);
    kay098Full.rows.forEach(r => {
      console.log(`   ${r.attendance_date.toISOString().split('T')[0]}: submitted ${r.submitted_at.toISOString().split('T')[0]}`);
    });

    console.log('\n🔑 WHAT DPW NEEDS FOR HUR792SW (transferred mobile mapper):');
    const hur792Full = await pool.query(`
      SELECT ar.attendance_date, ar.submitted_at, ar.submitted_by, yp.program_type as current_program
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.youth_id = 'HUR792SW'
      ORDER BY ar.attendance_date
    `);
    console.log(`   Current program: ${hur792Full.rows[0]?.current_program}`);
    console.log(`   Total attendance days: ${hur792Full.rows.length}`);
    hur792Full.rows.forEach(r => {
      console.log(`   ${r.attendance_date.toISOString().split('T')[0]}: submitted ${r.submitted_at.toISOString().split('T')[0]}`);
    });
    console.log('   ☝️  These attendance records exist but are hidden from ?module=mobile_mapping because current_program=microtasking');

    console.log('\n\n🛠️  FIX REQUIRED:');
    console.log('   The API needs to return attendance data for these transferred youth.');
    console.log('   Since there is no transfer history table, there are two approaches:\n');
    console.log('   OPTION A: Add program_type to attendance_records (best long-term)');
    console.log('     - Backfill existing records with program_type at time of submission');
    console.log('     - API queries attendance_records.program_type instead of youth_participants.program_type\n');
    console.log('   OPTION B: Return ALL attendance for all youth regardless of current program (simplest)');
    console.log('     - API returns complete attendance history for every youth');
    console.log('     - DPW filters by program on their end\n');
    console.log('   OPTION C: Add program_type column to attendance_records now + backfill');
    console.log('     - ALTER TABLE attendance_records ADD COLUMN program_type VARCHAR(50)');
    console.log('     - UPDATE based on settlement_work_config date ranges');
    console.log('     - Update attendance submission to record program_type at time of logging');

  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    await pool.end();
  }
}

investigateAttendanceTableAndFix();
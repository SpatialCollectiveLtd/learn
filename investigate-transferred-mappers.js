require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function investigateTransferredMappers() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 INVESTIGATING TRANSFERRED MOBILE MAPPERS');
    console.log('📅 Focus: Youth who worked as mobile mappers then transferred\n');

    // First, check what columns exist on youth_participants to find transfer tracking
    console.log('📋 CHECKING youth_participants TABLE STRUCTURE:');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants'
      ORDER BY ordinal_position
    `);
    const colNames = columns.rows.map(r => r.column_name);
    console.log(`   Columns: ${colNames.join(', ')}`);

    // Check for any history/audit/transfer tables
    console.log('\n📋 CHECKING FOR TRANSFER/HISTORY TABLES:');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log(`   Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);

    // Check if previous_program_type or similar column exists
    const hasPrevProgram = colNames.includes('previous_program_type');
    const hasOriginalProgram = colNames.includes('original_program_type');
    const hasTransferDate = colNames.includes('transfer_date');
    
    console.log(`\n   previous_program_type exists: ${hasPrevProgram}`);
    console.log(`   original_program_type exists: ${hasOriginalProgram}`);
    console.log(`   transfer_date exists: ${hasTransferDate}`);

    // Check relevant columns that might track transfers
    const transferCols = colNames.filter(c => 
      c.includes('previous') || c.includes('transfer') || c.includes('original') || 
      c.includes('history') || c.includes('former')
    );
    console.log(`   Transfer-related columns: ${transferCols.join(', ') || 'NONE'}`);

    // Look at Huruma youth from the screenshot - they're NOW microtasking
    // but were probably mobile_mapping before
    console.log('\n🔍 HURUMA YOUTH PROGRAM HISTORY:');
    const hurumaYouth = ['HUR792SW', 'HUR773MN', 'HUR770AN', 'HUR788AW'];
    
    const hurumaData = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment, settlement, created_at, updated_at
             ${hasPrevProgram ? ', previous_program_type' : ''}
             ${hasTransferDate ? ', transfer_date' : ''}
      FROM youth_participants 
      WHERE youth_id = ANY($1)
    `, [hurumaYouth]);

    hurumaData.rows.forEach(youth => {
      console.log(`   ${youth.youth_id} (${youth.full_name}):`);
      console.log(`     Current Program: ${youth.program_type}`);
      if (hasPrevProgram) console.log(`     Previous Program: ${youth.previous_program_type}`);
      if (hasTransferDate) console.log(`     Transfer Date: ${youth.transfer_date}`);
      console.log(`     Notes: ${youth.notes || 'none'}`);
    });

    // THE KEY QUESTION: Find ALL youth who have mobile_mapping attendance
    // regardless of their current program_type
    console.log('\n🎯 ALL YOUTH WITH MOBILE MAPPING ATTENDANCE (Feb 9-20):');
    console.log('   (Regardless of current program_type)');
    
    const allMobileMapAttendance = await pool.query(`
      SELECT 
        ar.attendance_date,
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type as current_program,
        ar.submitted_at,
        ar.submitted_by
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
        AND (
          yp.program_type = 'mobile_mapping'
          OR ar.youth_id LIKE 'HUR%'  -- include HUR youth regardless of current program
          OR ar.youth_id LIKE 'KAR%'  -- include KAR youth regardless
        )
      ORDER BY yp.settlement, ar.attendance_date DESC
      LIMIT 50
    `);

    console.log(`   Records found: ${allMobileMapAttendance.rows.length}`);
    
    // Group by settlement and current program
    const groups = {};
    allMobileMapAttendance.rows.forEach(record => {
      const key = `${record.settlement} [${record.current_program}]`;
      if (!groups[key]) groups[key] = { dates: new Set(), youth: new Set() };
      groups[key].dates.add(record.attendance_date.toISOString().split('T')[0]);
      groups[key].youth.add(record.youth_id);
    });
    
    Object.keys(groups).sort().forEach(key => {
      const g = groups[key];
      console.log(`   ${key}: ${g.youth.size} youth, ${g.dates.size} dates`);
      console.log(`     Dates: ${Array.from(g.dates).sort().join(', ')}`);
    });

    // Check attendance for the Huruma mobile mapping program on Feb 11
    // The dashboard showed "Mobile Mapping" but youth are now microtasking
    console.log('\n📅 FEB 11 SPECIFICALLY - ALL HUR MOBILE MAPPING YOUTH:');
    const feb11HurData = await pool.query(`
      SELECT 
        ar.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type as current_program,
        ar.attendance_date,
        ar.submitted_at,
        ar.submitted_by,
        sm.full_name as submitter_name
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      LEFT JOIN staff_members sm ON ar.submitted_by = sm.staff_id
      WHERE ar.attendance_date = '2026-02-11'
        AND yp.settlement = 'Mji wa Huruma'
      ORDER BY ar.submitted_at DESC
    `);

    console.log(`   Mji wa Huruma Feb 11 records: ${feb11HurData.rows.length}`);
    
    // Group by current program
    const byProgram = {};
    feb11HurData.rows.forEach(r => {
      if (!byProgram[r.current_program]) byProgram[r.current_program] = [];
      byProgram[r.current_program].push(r);
    });

    Object.keys(byProgram).forEach(prog => {
      const records = byProgram[prog];
      console.log(`\n   Program [${prog}]: ${records.length} youth`);
      records.slice(0, 5).forEach(r => {
        console.log(`     ${r.youth_id} (${r.full_name}): submitted ${r.submitted_at.toISOString().split('T')[1].split('.')[0]} by ${r.submitter_name || r.submitted_by}`);
      });
      if (records.length > 5) console.log(`     ... and ${records.length - 5} more`);
    });

    // THE REAL FIX NEEDED: Check what program type was active when attendance was submitted
    // by looking at the attendance of youth who were originally mobile_mapping
    console.log('\n🔑 KEY INSIGHT - ATTENDANCE ACROSS PROGRAM TRANSITIONS:');
    console.log('   Checking youth with BOTH mobile_mapping AND microtasking/other attendance...');

    const transitionYouth = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        yp.program_type as current_program,
        COUNT(ar.attendance_date) as total_attendance_days,
        MIN(ar.attendance_date) as first_attendance,
        MAX(ar.attendance_date) as last_attendance
      FROM youth_participants yp
      JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.settlement IN ('Mji wa Huruma', 'Kariobangi Machakos')
        AND ar.attendance_date >= '2026-02-09'
        AND ar.attendance_date <= '2026-02-20'
      GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type
      ORDER BY yp.settlement, yp.program_type, total_attendance_days DESC
      LIMIT 20
    `);

    console.log('\n   Huruma/Kariobangi youth with Feb 9-20 attendance:');
    transitionYouth.rows.forEach(r => {
      console.log(`   ${r.youth_id} (${r.full_name}): ${r.current_program}, ${r.total_attendance_days} days (${r.first_attendance.toISOString().split('T')[0]} to ${r.last_attendance.toISOString().split('T')[0]})`);
    });

    console.log('\n🎯 ROOT CAUSE IDENTIFICATION:');
    console.log('   The API query filters attendance using current program_type.');
    console.log('   Youth who transferred from mobile_mapping → microtasking are now');
    console.log('   counted as microtasking youth, so their mobile mapping work history');
    console.log('   does not appear when querying ?module=mobile_mapping');
    console.log('');
    console.log('   FIX NEEDED: API should track original_program_type or use attendance');
    console.log('   date ranges to determine which program was active when work was done.');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

investigateTransferredMappers();
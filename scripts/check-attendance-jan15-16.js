const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAttendance() {
  console.log('Checking attendance for Jan 15th and 16th...\n');
  
  // Check attendance records
  const records = await pool.query(`
    SELECT 
      ar.attendance_date,
      ar.youth_id,
      yp.full_name,
      yp.program_type,
      yp.is_active,
      ar.submitted_at,
      ar.submitted_by
    FROM attendance_records ar
    LEFT JOIN youth_participants yp ON ar.youth_id = yp.youth_id
    WHERE ar.attendance_date IN ('2026-01-15', '2026-01-16')
    ORDER BY ar.attendance_date, ar.submitted_at
  `);
  
  console.log(`Total records found: ${records.rows.length}\n`);
  
  if (records.rows.length === 0) {
    console.log('❌ No attendance records found for Jan 15th or 16th');
    pool.end();
    return;
  }
  
  // Group by date
  const byDate = {};
  records.rows.forEach(r => {
    if (!byDate[r.attendance_date]) {
      byDate[r.attendance_date] = [];
    }
    byDate[r.attendance_date].push(r);
  });
  
  Object.keys(byDate).forEach(date => {
    console.log(`\n📅 ${date}:`);
    console.log(`   Total: ${byDate[date].length} records`);
    
    const programTypes = {};
    byDate[date].forEach(r => {
      const type = r.program_type || 'NULL';
      programTypes[type] = (programTypes[type] || 0) + 1;
    });
    
    console.log('   By program type:');
    Object.keys(programTypes).forEach(type => {
      console.log(`      ${type}: ${programTypes[type]}`);
    });
    
    console.log('\n   Sample records:');
    byDate[date].slice(0, 5).forEach(r => {
      console.log(`      ${r.youth_id} - ${r.full_name || 'NO NAME'} - ${r.program_type || 'NO TYPE'}`);
    });
  });
  
  // Check if any youth IDs in attendance don't exist in youth_participants
  console.log('\n\n🔍 Checking for orphaned records...');
  const orphaned = records.rows.filter(r => !r.full_name);
  if (orphaned.length > 0) {
    console.log(`❌ Found ${orphaned.length} attendance records with no matching youth:`);
    orphaned.forEach(r => {
      console.log(`   ${r.youth_id} - Date: ${r.attendance_date}`);
    });
  } else {
    console.log('✅ All attendance records have matching youth');
  }
  
  pool.end();
}

checkAttendance().catch(console.error);

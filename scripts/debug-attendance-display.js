require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function debugAttendance() {
  console.log('\n🔍 ATTENDANCE DEBUG - Jan 15-16, 2026\n');
  
  // Check raw attendance records
  console.log('1️⃣ Checking raw attendance_records table:');
  const records = await sql`
    SELECT 
      ar.id,
      ar.youth_id,
      ar.attendance_date,
      ar.submitted_at,
      ar.submitted_by,
      yp.full_name,
      yp.program_type
    FROM attendance_records ar
    LEFT JOIN youth_profiles yp ON ar.youth_id = yp.youth_id
    WHERE ar.attendance_date IN ('2026-01-15', '2026-01-16')
    ORDER BY ar.attendance_date, ar.youth_id
    LIMIT 10
  `;
  console.log(`Found ${records.length} records (showing first 10)`);
  records.forEach(r => {
    console.log(`  - ${r.attendance_date} | ${r.youth_id} | ${r.full_name} | ${r.program_type}`);
  });
  
  // Check total count by date
  console.log('\n2️⃣ Counting records by date:');
  const counts = await sql`
    SELECT 
      attendance_date,
      COUNT(*) as count,
      COUNT(DISTINCT youth_id) as unique_youth
    FROM attendance_records
    WHERE attendance_date IN ('2026-01-15', '2026-01-16')
    GROUP BY attendance_date
    ORDER BY attendance_date
  `;
  counts.forEach(c => {
    console.log(`  ${c.attendance_date}: ${c.count} records, ${c.unique_youth} unique youth`);
  });
  
  // Check youth_profiles for mobile_mapping
  console.log('\n3️⃣ Checking youth_profiles for mobile_mapping:');
  const profiles = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN program_type = 'mobile_mapping' THEN 1 END) as mobile_mapping_count
    FROM youth_profiles
  `;
  console.log(`  Total youth: ${profiles[0].total}`);
  console.log(`  Mobile mapping: ${profiles[0].mobile_mapping_count}`);
  
  // Simulate the API query for Jan 15
  console.log('\n4️⃣ Simulating API query for Jan 15, 2026 (mobile_mapping):');
  const apiResult = await sql`
    SELECT 
      ar.id,
      ar.youth_id,
      ar.attendance_date,
      ar.submitted_at,
      ar.submitted_by,
      ar.notes,
      yp.full_name,
      yp.program_type
    FROM attendance_records ar
    INNER JOIN youth_profiles yp ON ar.youth_id = yp.youth_id
    WHERE ar.attendance_date = $1 AND yp.program_type = $2
    ORDER BY ar.submitted_at DESC
  `.bind('2026-01-15', 'mobile_mapping');
  
  console.log(`  API would return: ${apiResult.length} records`);
  if (apiResult.length > 0) {
    console.log('  First 5 records:');
    apiResult.slice(0, 5).forEach(r => {
      console.log(`    ${r.youth_id} | ${r.full_name}`);
    });
  }
  
  // Check for program_type values
  console.log('\n5️⃣ Checking program_type values in youth_profiles:');
  const programTypes = await sql`
    SELECT DISTINCT program_type, COUNT(*) as count
    FROM youth_profiles
    GROUP BY program_type
    ORDER BY count DESC
  `;
  programTypes.forEach(pt => {
    console.log(`  ${pt.program_type}: ${pt.count} youth`);
  });
  
  // Check for attendance with program_type mismatch
  console.log('\n6️⃣ Checking for orphaned attendance (no matching youth):');
  const orphaned = await sql`
    SELECT ar.youth_id, ar.attendance_date
    FROM attendance_records ar
    LEFT JOIN youth_profiles yp ON ar.youth_id = yp.youth_id
    WHERE yp.youth_id IS NULL
    AND ar.attendance_date IN ('2026-01-15', '2026-01-16')
  `;
  console.log(`  Found ${orphaned.length} orphaned records`);
  
  console.log('\n✅ Debug complete\n');
}

debugAttendance().catch(console.error);

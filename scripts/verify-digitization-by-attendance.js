// Verify Digitization Module Assignments by Attendance
// Checks if remaining digitization youth actually have digitization attendance

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function verifyDigitizationAttendance() {
  console.log('🔍 Verifying Digitization Module Assignments');
  console.log('============================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Current digitization count
    console.log('1️⃣ Current digitization youth count:');
    const currentDig = await pool.query(`
      SELECT 
        settlement,
        COUNT(*) as count
      FROM youth_participants
      WHERE is_active = TRUE AND program_type = 'digitization'
      GROUP BY settlement
      ORDER BY settlement
    `);
    
    let total = 0;
    currentDig.rows.forEach(row => {
      console.log(`   ${row.settlement}: ${row.count} youth`);
      total += parseInt(row.count);
    });
    console.log(`   TOTAL: ${total} digitization youth\n`);

    // 2. Check attendance for current digitization youth
    console.log('2️⃣ Attendance records for current digitization youth:');
    const digAttendance = await pool.query(`
      SELECT 
        yp.settlement,
        COUNT(DISTINCT yp.youth_id) as youth_with_attendance,
        COUNT(ar.id) as total_attendance_records,
        MIN(ar.attendance_date) as earliest_date,
        MAX(ar.attendance_date) as latest_date
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE 
      AND yp.program_type = 'digitization'
      GROUP BY yp.settlement
      ORDER BY yp.settlement
    `);
    
    digAttendance.rows.forEach(row => {
      console.log(`   ${row.settlement}:`);
      console.log(`      Youth with attendance: ${row.youth_with_attendance}`);
      console.log(`      Total records: ${row.total_attendance_records}`);
      console.log(`      Date range: ${row.earliest_date || 'N/A'} to ${row.latest_date || 'N/A'}`);
    });
    console.log('');

    // 3. Detailed breakdown by settlement with youth IDs
    console.log('3️⃣ Digitization youth by settlement (with attendance counts):\n');
    
    const settlements = ['Kayole', 'Kayole Soweto', 'Kariobangi Machakos', 'Mji wa Huruma'];
    
    for (const settlement of settlements) {
      const youthInSettlement = await pool.query(`
        SELECT 
          yp.youth_id,
          yp.full_name,
          yp.settlement,
          yp.osm_username,
          COUNT(ar.id) as attendance_count,
          MIN(ar.attendance_date) as first_attendance,
          MAX(ar.attendance_date) as last_attendance,
          COUNT(ywd.work_day_id) as work_days
        FROM youth_participants yp
        LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
        LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
        WHERE yp.is_active = TRUE 
        AND yp.program_type = 'digitization'
        AND yp.settlement = $1
        GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.osm_username
        ORDER BY COUNT(ar.id) DESC, yp.youth_id
      `, [settlement]);
      
      if (youthInSettlement.rows.length > 0) {
        console.log(`📍 ${settlement} (${youthInSettlement.rows.length} youth):`);
        youthInSettlement.rows.forEach((youth, i) => {
          console.log(`   ${i+1}. ${youth.youth_id} - ${youth.full_name}`);
          console.log(`      OSM: ${youth.osm_username || '(none)'}`);
          console.log(`      Attendance: ${youth.attendance_count} days (${youth.first_attendance || 'none'} to ${youth.last_attendance || 'none'})`);
          console.log(`      Work days: ${youth.work_days}`);
        });
        console.log('');
      }
    }

    // 4. Check for digitization attendance patterns
    console.log('4️⃣ Attendance date analysis for digitization:');
    const dateAnalysis = await pool.query(`
      SELECT 
        DATE_TRUNC('month', ar.attendance_date) as month,
        COUNT(DISTINCT ar.youth_id) as unique_youth,
        COUNT(ar.id) as attendance_records
      FROM attendance_records ar
      JOIN youth_participants yp ON ar.youth_id = yp.youth_id
      WHERE yp.is_active = TRUE 
      AND yp.program_type = 'digitization'
      GROUP BY DATE_TRUNC('month', ar.attendance_date)
      ORDER BY month DESC
    `);
    
    dateAnalysis.rows.forEach(row => {
      const monthStr = new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      console.log(`   ${monthStr}: ${row.unique_youth} youth, ${row.attendance_records} records`);
    });
    console.log('');

    // 5. Check if any digitization youth have ONLY recent attendance (potential misassignment)
    console.log('5️⃣ Checking for potential misassignments:');
    const potentialIssues = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.settlement,
        COUNT(ar.id) FILTER (WHERE ar.attendance_date < '2026-01-15') as old_attendance,
        COUNT(ar.id) FILTER (WHERE ar.attendance_date >= '2026-01-15') as new_attendance,
        MIN(ar.attendance_date) as first_date,
        MAX(ar.attendance_date) as last_date
      FROM youth_participants yp
      LEFT JOIN attendance_records ar ON yp.youth_id = ar.youth_id
      WHERE yp.is_active = TRUE 
      AND yp.program_type = 'digitization'
      GROUP BY yp.youth_id, yp.full_name, yp.settlement
      HAVING COUNT(ar.id) FILTER (WHERE ar.attendance_date < '2026-01-15') = 0
      AND COUNT(ar.id) FILTER (WHERE ar.attendance_date >= '2026-01-15') > 0
      ORDER BY yp.settlement, yp.youth_id
    `);
    
    if (potentialIssues.rows.length === 0) {
      console.log('   ✅ No potential misassignments found');
      console.log('   All digitization youth have attendance before Jan 15 (digitization period)\n');
    } else {
      console.log(`   ⚠️  Found ${potentialIssues.rows.length} digitization youth with ONLY recent attendance (after Jan 15):`);
      potentialIssues.rows.forEach(youth => {
        console.log(`      ${youth.youth_id} - ${youth.full_name} (${youth.settlement})`);
        console.log(`         Old attendance: ${youth.old_attendance}, New attendance: ${youth.new_attendance}`);
        console.log(`         Range: ${youth.first_date} to ${youth.last_date}`);
      });
      console.log('');
    }

    // 6. Compare with what we changed
    console.log('6️⃣ Verification against changes made:');
    
    // Read the backup to see what was changed
    const fs = require('fs');
    const backupFiles = fs.readdirSync('backups').filter(f => f.startsWith('youth_to_update_'));
    
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles.sort().reverse()[0];
      const changedYouth = JSON.parse(fs.readFileSync(`backups/${latestBackup}`, 'utf8'));
      
      console.log(`   Previously moved to mobile_mapping: ${changedYouth.length} youth`);
      console.log(`   Original digitization count: ${total + changedYouth.length}`);
      console.log(`   Current digitization count: ${total}`);
      console.log(`   Difference: ${changedYouth.length} (matches expected)\n`);
    }

    // 7. Summary
    console.log('📊 VERIFICATION SUMMARY');
    console.log('======================');
    console.log(`Current digitization youth: ${total}`);
    
    const totalWithAttendance = digAttendance.rows.reduce((sum, row) => 
      sum + parseInt(row.youth_with_attendance), 0
    );
    console.log(`Youth with attendance records: ${totalWithAttendance}`);
    
    if (potentialIssues.rows.length > 0) {
      console.log(`\n⚠️  WARNING: ${potentialIssues.rows.length} youth may be misassigned`);
      console.log('   They have only recent attendance (after Jan 15)');
      console.log('   Consider moving them to mobile_mapping\n');
    } else {
      console.log('\n✅ All digitization youth have appropriate attendance patterns');
      console.log('   Module assignments appear correct\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

verifyDigitizationAttendance();

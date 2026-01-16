const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAttendance() {
  try {
    // Check attendance for Jan 15 and 16
    const dates = ['2026-01-15', '2026-01-16'];
    
    for (const date of dates) {
      const result = await pool.query(`
        SELECT 
          ar.youth_id,
          yp.full_name,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = $1
        ORDER BY ar.submitted_at
      `, [date]);
      
      console.log(`\n📅 ${date}:`);
      console.log(`   Total Attendance: ${result.rows.length}`);
      
      if (result.rows.length > 0) {
        console.log('\n   Attendees:');
        result.rows.forEach((r, i) => {
          const time = new Date(r.submitted_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          console.log(`   ${i + 1}. ${r.youth_id} - ${r.full_name} (${time})`);
        });
      } else {
        console.log('   No attendance records');
      }
    }
    
    // Get total mobile mappers
    const total = await pool.query(`
      SELECT COUNT(*) as count
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Active Mobile Mappers: ${total.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    pool.end();
  }
}

checkAttendance();

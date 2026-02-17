require('dotenv').config({path: '.env.local'});

async function testFixedAPI() {
  try {
    console.log('🧪 Testing Fixed Attendance API\n');
    
    // Get a staff token (simplified test)
    const testDates = ['2026-02-06', '2026-02-04', '2026-02-03'];
    
    for (const date of testDates) {
      console.log(`📅 Testing date: ${date}`);
      
      // Simulate the API call locally (without HTTP)
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      // This is the FIXED query that should now work correctly
      const query = `
        SELECT 
          ar.id,
          ar.youth_id,
          yp.full_name,
          ar.program_type_at_attendance as program_type,
          ar.attendance_date,
          ar.submitted_at,
          ar.submitted_by,
          ar.notes
        FROM attendance_records ar
        JOIN youth_participants yp ON ar.youth_id = yp.youth_id
        WHERE ar.attendance_date = $1 AND ar.program_type_at_attendance = $2
        ORDER BY ar.submitted_at DESC
      `;
      
      const records = await pool.query(query, [date, 'mobile_mapping']);
      
      // Fixed count query (uses historical program type)
      const countQuery = `SELECT COUNT(*) as total FROM attendance_records ar WHERE ar.attendance_date = $1 AND ar.program_type_at_attendance = $2`;
      const countResult = await pool.query(countQuery, [date, 'mobile_mapping']);
      
      // Total active mappers (current)
      const totalMappers = await pool.query(`
        SELECT COUNT(*) as total FROM youth_participants 
        WHERE program_type = $1 AND is_active = TRUE
      `, ['mobile_mapping']);
      
      console.log(`   📋 Records found: ${records.rows.length}`);
      console.log(`   📊 Count result: ${countResult.rows[0].total}`);
      console.log(`   👥 Total active mappers: ${totalMappers.rows[0].total}`);
      console.log(`   ✅ API Response would show: ${countResult.rows[0].total} attendances out of ${totalMappers.rows[0].total} mappers\n`);
      
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testFixedAPI();
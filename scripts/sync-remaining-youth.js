/**
 * Targeted sync for remaining youth who still need work days
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Only the remaining youth who need work days
const remainingYouth = ['KAY461VO', 'KAY465DO', 'KAY498AW', 'KAY574GK', 'KAY868JN', 'KAY924LO'];

async function syncRemainingYouth() {
  try {
    console.log('🎯 TARGETED SYNC FOR REMAINING 6 YOUTH');
    console.log('====================================');
    
    for (const youthId of remainingYouth) {
      console.log(`\n📍 Processing ${youthId}:`);
      
      // Get attendance records for this youth
      const attendanceResult = await pool.query(`
        SELECT attendance_date 
        FROM attendance_records 
        WHERE youth_id = $1 AND attendance_date <= '2026-02-06'
        ORDER BY attendance_date
      `, [youthId]);
      
      console.log(`   Found ${attendanceResult.rows.length} attendance records`);
      
      // Delete any existing work days for this youth
      const deleteResult = await pool.query(`
        DELETE FROM youth_work_days WHERE youth_id = $1
      `, [youthId]);
      
      if (deleteResult.rowCount > 0) {
        console.log(`   Deleted ${deleteResult.rowCount} existing work days`);
      }
      
      // Create work days for each attendance date
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of attendanceResult.rows) {
        try {
          await pool.query(`
            INSERT INTO youth_work_days (
              youth_id, work_date, buildings_count, daily_target, 
              status, notes, target_met
            ) VALUES (
              $1, $2, 0, 10, 'approved', 
              'Mobile mapping work - synced from attendance', false
            )
          `, [youthId, record.attendance_date]);
          
          successCount++;
          
        } catch (insertError) {
          console.log(`   ❌ Failed ${record.attendance_date}: ${insertError.message}`);
          errorCount++;
        }
      }
      
      console.log(`   ✅ Created: ${successCount} work days`);
      if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`);
      }
    }
    
    console.log('\n📊 FINAL CHECK:');
    const finalCheck = await pool.query(`
      SELECT 
        yp.youth_id, 
        (SELECT COUNT(*) FROM attendance_records 
         WHERE youth_id = yp.youth_id AND attendance_date <= '2026-02-06') as attendance,
        COUNT(ywd.work_day_id) as work_days
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id
      ORDER BY yp.youth_id
    `, [remainingYouth]);
    
    finalCheck.rows.forEach(row => {
      const status = row.work_days === row.attendance ? '✅' : '❌';
      console.log(`   ${row.youth_id}: ${row.attendance} → ${row.work_days} ${status}`);
    });
    
    console.log('\n🎯 Targeted sync complete!');
    
  } catch (error) {
    console.error('💥 Error in targeted sync:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  syncRemainingYouth();
}
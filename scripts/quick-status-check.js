/**
 * Quick Status Check: Verify 25 youth work history restoration
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const youthIds = [
  'KAY465DO', 'KAY1604FA', 'KAY237FM', 'KAY269JW', 'KAY461VO',
  'KAY2070EM', 'KAY1042KM', 'KAY2490AM', 'KAY1143IM', 'KAY1640JM',
  'KAY2301SA', 'KAY2802NM', 'KAY1681JM', 'KAY2239NW', 'KAY574GK',
  'KAY1726RN', 'KAY2587RM', 'KAY2031KM', 'KAY2085SB', 'KAY924LO',
  'KAY868JN', 'KAY1223AK', 'KAY1731EM', 'KAY498AW', 'KAY264EM'
];

async function main() {
  try {
    console.log('🎯 MOBILE MAPPING WORK HISTORY - FINAL STATUS CHECK');
    console.log('=====================================================');
    
    const result = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        
        -- Attendance through Feb 6
        (SELECT COUNT(*) FROM attendance_records 
         WHERE youth_id = yp.youth_id AND attendance_date <= '2026-02-06') as attendance,
        
        -- Work days
        COUNT(ywd.work_day_id) as work_days,
        
        -- Date range
        MIN(ywd.work_date) as first_work,
        MAX(ywd.work_date) as last_work
        
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
      WHERE yp.youth_id = ANY($1)
      GROUP BY yp.youth_id, yp.full_name
      ORDER BY yp.youth_id
    `, [youthIds]);

    let perfect = 0, partial = 0, missing = 0;
    let totalAttend = 0, totalWork = 0;

    result.rows.forEach(youth => {
      totalAttend += youth.attendance;
      totalWork += youth.work_days;
      
      if (youth.work_days === youth.attendance) perfect++;
      else if (youth.work_days > 0) partial++;
      else missing++;
      
      const status = youth.work_days === youth.attendance ? '✅' : youth.work_days > 0 ? '🔄' : '❌';
      console.log(`${youth.youth_id} | ${(youth.full_name || 'NO NAME').padEnd(20)} | ${String(youth.attendance).padStart(2)} → ${String(youth.work_days).padStart(2)} ${status}`);
    });

    console.log('\n📊 SUMMARY:');
    console.log(`   Youth processed: ${result.rows.length}/25`);
    console.log(`   Total attendance (through Feb 6): ${totalAttend} days`);
    console.log(`   Total work days created: ${totalWork} days`);
    console.log(`   Perfect sync (✅): ${perfect} youth`);
    console.log(`   Partial sync (🔄): ${partial} youth`);
    console.log(`   No work days (❌): ${missing} youth`);
    
    if (perfect === 25) {
      console.log('\n🎉 SUCCESS! All 25 youth now have complete work history!');
      console.log('   Work dashboard should be fully functional for all youth.');
    } else {
      console.log('\n⚠️  Some youth still need attention.');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
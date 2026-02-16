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

pool.query(`
  SELECT 
    yp.youth_id, yp.full_name,
    (SELECT COUNT(*) FROM attendance_records 
     WHERE youth_id = yp.youth_id AND attendance_date <= '2026-02-06') as attendance,
    COUNT(ywd.work_day_id) as work_days
  FROM youth_participants yp
  LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
  WHERE yp.youth_id = ANY($1)
  GROUP BY yp.youth_id, yp.full_name
  ORDER BY yp.youth_id
`, [youthIds]).then(result => {
  console.log('🎯 FINAL STATUS:');
  let perfect = 0, partial = 0, missing = 0;
  
  result.rows.forEach(youth => {
    const status = youth.work_days === youth.attendance ? '✅' : youth.work_days > 0 ? '🔄' : '❌';
    console.log(`${youth.youth_id} | ${youth.attendance} → ${youth.work_days} ${status}`);
    
    if (youth.work_days === youth.attendance) perfect++;
    else if (youth.work_days > 0) partial++;
    else missing++;
  });
  
  console.log(`\nRESULT: ${perfect}/25 youth have complete work history!`);
  if (perfect === 25) {
    console.log('🎉 MISSION ACCOMPLISHED! All work history restored!');
  }
  
  pool.end();
});
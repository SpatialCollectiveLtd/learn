/**
 * Check Individual Youth Work Day Limits
 * The validation function checks yp.total_work_days which might override settlement config
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
    console.log('🔍 CHECKING INDIVIDUAL YOUTH WORK DAY LIMITS');
    console.log('===========================================');
    
    // Check if there's a total_work_days column on youth_participants
    console.log('\n1. Checking Youth Participants Schema:');
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants' 
        AND column_name LIKE '%work%' OR column_name LIKE '%day%'
      ORDER BY column_name
    `);
    
    console.log('Work/day related columns in youth_participants:');
    schemaCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Check individual limits for our 25 youth
    console.log('\n2. Individual Work Day Limits:');
    const limits = await pool.query(`
      SELECT 
        yp.youth_id,
        yp.full_name,
        yp.total_work_days as individual_limit,
        swc.total_work_days as settlement_limit,
        COALESCE(yp.total_work_days, swc.total_work_days, 20) as effective_limit,
        
        -- Count approved work days
        (SELECT COUNT(*) FROM youth_work_days 
         WHERE youth_id = yp.youth_id AND status = 'approved') as approved_days,
        
        -- Count all work days
        (SELECT COUNT(*) FROM youth_work_days 
         WHERE youth_id = yp.youth_id) as total_days
        
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
                                           AND yp.program_type = swc.program_type
      WHERE yp.youth_id = ANY($1)
      ORDER BY yp.youth_id
    `, [youthIds]);
    
    console.log('Individual vs Settlement Limits:');
    console.log('-'.repeat(100));
    console.log('Youth ID     | Name                 | Individual | Settlement | Effective | Approved | Total');
    console.log('-'.repeat(100));
    
    let individualsWithLimits = 0;
    let restrictiveLimits = 0;
    
    limits.rows.forEach(row => {
      const individual = row.individual_limit || 'null';
      const settlement = row.settlement_limit || 'null';
      const effective = row.effective_limit;
      const approved = row.approved_days;
      const total = row.total_days;
      
      console.log(`${row.youth_id.padEnd(12)} | ${(row.full_name || 'NO NAME').padEnd(20)} | ${String(individual).padEnd(10)} | ${String(settlement).padEnd(10)} | ${String(effective).padEnd(9)} | ${String(approved).padEnd(8)} | ${total}`);
      
      if (row.individual_limit !== null) {
        individualsWithLimits++;
      }
      if (effective < 20) {
        restrictiveLimits++;
      }
    });
    
    console.log('\n📊 Summary:');
    console.log(`   Youth with individual limits: ${individualsWithLimits}`);
    console.log(`   Youth with restrictive limits (< 20): ${restrictiveLimits}`);
    
    if (restrictiveLimits > 0) {
      console.log('\n🚨 FOUND THE ISSUE! Some youth have individual work day limits!');
      
      // Fix individual limits
      console.log('\n3. Fixing Individual Limits:');
      const updateResult = await pool.query(`
        UPDATE youth_participants 
        SET total_work_days = NULL
        WHERE youth_id = ANY($1) AND total_work_days IS NOT NULL
        RETURNING youth_id, total_work_days
      `, [youthIds]);
      
      if (updateResult.rows.length > 0) {
        console.log(`   ✅ Cleared individual limits for ${updateResult.rows.length} youth`);
        updateResult.rows.forEach(row => {
          console.log(`   - ${row.youth_id}: limit cleared`);
        });
      } else {
        console.log('   ℹ️  No individual limits to clear');
      }
      
      // Verify fix
      console.log('\n4. Verification:');
      const verifyResult = await pool.query(`
        SELECT 
          yp.youth_id,
          COALESCE(yp.total_work_days, swc.total_work_days, 20) as effective_limit
        FROM youth_participants yp
        LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
                                             AND yp.program_type = swc.program_type
        WHERE yp.youth_id = ANY($1)
          AND COALESCE(yp.total_work_days, swc.total_work_days, 20) != 20
      `, [youthIds]);
      
      if (verifyResult.rows.length === 0) {
        console.log('   ✅ All 25 youth now have 20-day work limits!');
      } else {
        console.log('   ❌ Still have restrictive limits:');
        verifyResult.rows.forEach(row => {
          console.log(`   - ${row.youth_id}: ${row.effective_limit} days`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking limits:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
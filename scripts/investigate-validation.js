/**
 * Investigate Work Day Validation Function
 * Find out what's causing the work day limit validation to fail
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🔍 INVESTIGATING WORK DAY VALIDATION');
    console.log('====================================');
    
    // Get the validation function definition
    console.log('\n1. Work Day Validation Function:');
    const funcDef = await pool.query(`
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      WHERE p.proname = 'validate_work_day'
    `);
    
    if (funcDef.rows.length > 0) {
      console.log('Function found:');
      console.log(funcDef.rows[0].definition);
    } else {
      console.log('❌ validate_work_day function not found');
    }
    
    // Check what the function is actually validating by testing with one youth
    console.log('\n2. Testing Current Validation Logic:');
    
    // Try a sample insert to see what error we get
    try {
      await pool.query('BEGIN');
      
      const testResult = await pool.query(`
        INSERT INTO youth_work_days (
          youth_id, work_date, buildings_count, daily_target, status, notes
        ) VALUES (
          'KAY1042KM', '2026-01-15', 0, 10, 'pending', 'Test insert'
        )
      `);
      
      console.log('✅ Test insert succeeded - no validation issues');
      
      // Clean up
      await pool.query('ROLLBACK');
      
    } catch (testError) {
      await pool.query('ROLLBACK');
      console.log('❌ Test insert failed:');
      console.log(`   Error: ${testError.message}`);
      
      // Check current work days for this youth
      const currentWorkDays = await pool.query(`
        SELECT COUNT(*) as count, MIN(work_date) as first_date, MAX(work_date) as last_date
        FROM youth_work_days 
        WHERE youth_id = 'KAY1042KM'
      `);
      
      console.log(`   Current work days for KAY1042KM: ${currentWorkDays.rows[0].count}`);
      if (currentWorkDays.rows[0].count > 0) {
        console.log(`   Date range: ${currentWorkDays.rows[0].first_date} to ${currentWorkDays.rows[0].last_date}`);
      }
    }
    
    // Check settlement config being used
    console.log('\n3. Settlement Configuration Check:');
    const settleConfig = await pool.query(`
      SELECT yp.youth_id, yp.settlement, yp.program_type, 
             swc.total_work_days, swc.start_date, swc.is_active
      FROM youth_participants yp
      LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement 
                                           AND yp.program_type = swc.program_type
      WHERE yp.youth_id = 'KAY1042KM'
    `);
    
    console.log('Youth configuration:');
    settleConfig.rows.forEach(row => {
      console.log(`   Youth: ${row.youth_id}`);
      console.log(`   Settlement: ${row.settlement}`);
      console.log(`   Program: ${row.program_type}`);
      console.log(`   Config Total Work Days: ${row.total_work_days}`);
      console.log(`   Config Start Date: ${row.start_date}`);
      console.log(`   Config Active: ${row.is_active}`);
    });
    
    // Try to understand the exact validation logic by testing different scenarios
    console.log('\n4. Testing Different Validation Scenarios:');
    
    // Scenario 1: Check if there's a hard-coded limit somewhere
    const existingWorkDays = await pool.query(`
      SELECT youth_id, COUNT(*) as work_day_count
      FROM youth_work_days 
      WHERE youth_id = ANY($1)
      GROUP BY youth_id
      ORDER BY work_day_count DESC
      LIMIT 5
    `, [['KAY1042KM', 'KAY1143IM', 'KAY1223AK', 'KAY1604FA', 'KAY269JW']]);
    
    console.log('Current work day counts for test youth:');
    existingWorkDays.rows.forEach(row => {
      console.log(`   ${row.youth_id}: ${row.work_day_count} work days`);
    });
    
  } catch (error) {
    console.error('💥 Investigation error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
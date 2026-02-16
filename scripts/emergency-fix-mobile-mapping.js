/**
 * Fix Mobile Mapping Settlement Configuration - Emergency
 * The work day limits are still too restrictive, causing sync failures
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🚨 EMERGENCY FIX: Mobile Mapping Work Day Limits');
    console.log('=================================================');
    
    // Check current configuration
    console.log('\n1. Current Settlement Configuration:');
    const currentConfig = await pool.query(`
      SELECT * FROM settlement_work_config 
      WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
    `);
    
    if (currentConfig.rows.length > 0) {
      const config = currentConfig.rows[0];
      console.log(`   Settlement: ${config.settlement}`);
      console.log(`   Program: ${config.program_type}`);
      console.log(`   Start Date: ${config.start_date}`);
      console.log(`   Total Work Days: ${config.total_work_days} ⚠️`);
      console.log(`   Daily Target: ${config.daily_target}`);
      console.log(`   Project Hashtag: ${config.project_hashtag || 'none'}`);
      console.log(`   Active: ${config.is_active}`);
      
      // Update to allow full 20 work days
      console.log('\n2. Updating Configuration:');
      await pool.query(`
        UPDATE settlement_work_config 
        SET 
          total_work_days = 20,
          daily_target = 10,
          is_active = true
        WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
      `);
      console.log('   ✅ Updated total_work_days to 20');
      console.log('   ✅ Updated daily_target to 10');
      console.log('   ✅ Ensured is_active = true');
      
    } else {
      // Create configuration if missing
      console.log('   ❌ Configuration missing - creating...');
      await pool.query(`
        INSERT INTO settlement_work_config (
          settlement, program_type, start_date, total_work_days, 
          daily_target, project_hashtag, is_active
        ) VALUES (
          'Kayole Soweto', 'mobile_mapping', '2026-01-13', 20,
          10, '#kayole_mobile_mapping', true
        )
      `);
      console.log('   ✅ Created new mobile_mapping configuration');
    }
    
    // Verify the fix
    console.log('\n3. Verification:');
    const updatedConfig = await pool.query(`
      SELECT * FROM settlement_work_config 
      WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
    `);
    
    const config = updatedConfig.rows[0];
    console.log(`   Total Work Days: ${config.total_work_days} ${config.total_work_days === 20 ? '✅' : '❌'}`);
    console.log(`   Daily Target: ${config.daily_target} ${config.daily_target === 10 ? '✅' : '❌'}`);
    console.log(`   Active: ${config.is_active} ${config.is_active ? '✅' : '❌'}`);
    
    // Check if there are any database triggers or constraints causing issues
    console.log('\n4. Checking Database Constraints:');
    const constraintCheck = await pool.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'youth_work_days'::regclass
      ORDER BY conname
    `);
    
    console.log('   Youth Work Days Constraints:');
    constraintCheck.rows.forEach(row => {
      console.log(`   - ${row.constraint_name} (${row.constraint_type}): ${row.definition}`);
    });
    
    // Check triggers
    const triggerCheck = await pool.query(`
      SELECT 
        tgname as trigger_name,
        proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgrelid = 'youth_work_days'::regclass
    `);
    
    console.log('\n   Youth Work Days Triggers:');
    triggerCheck.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} → ${row.function_name}()`);
    });
    
    console.log('\n🎯 Configuration updated! Now ready for clean sync.');
    
  } catch (error) {
    console.error('💥 Error fixing configuration:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
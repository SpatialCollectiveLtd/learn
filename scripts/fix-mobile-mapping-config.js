/**
 * Fix Mobile Mapping Configuration
 * Purpose: Update mobile mapping work period from 2 days to 20 days
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🔧 FIXING MOBILE MAPPING CONFIGURATION');
    console.log('====================================');
    
    // Check current mobile mapping config
    const current = await pool.query(`
      SELECT * FROM settlement_work_config
      WHERE settlement = 'Kayole Soweto' AND program_type = 'mobile_mapping'
    `);

    if (current.rows.length === 0) {
      console.log('❌ No mobile mapping config found');
      return;
    }

    const config = current.rows[0];
    console.log('📍 Current Configuration:');
    console.log(`   Settlement: ${config.settlement}`);
    console.log(`   Program: ${config.program_type}`);
    console.log(`   Total Work Days: ${config.total_work_days} ← PROBLEM!`);
    console.log(`   Daily Target: ${config.daily_target}`);
    console.log(`   Start Date: ${config.start_date.toISOString().split('T')[0]}`);
    
    console.log('\n🔄 Updating to 20-day work period...');
    
    // Update the configuration 
    const result = await pool.query(`
      UPDATE settlement_work_config
      SET 
        total_work_days = 20,
        daily_target = 10,  -- More reasonable for mobile mapping
        updated_at = CURRENT_TIMESTAMP
      WHERE settlement = 'Kayole Soweto' 
      AND program_type = 'mobile_mapping'
      RETURNING *
    `);

    const updated = result.rows[0];
    console.log('✅ Configuration Updated:');
    console.log(`   Settlement: ${updated.settlement}`);
    console.log(`   Program: ${updated.program_type}`);
    console.log(`   Total Work Days: ${updated.total_work_days} ← FIXED!`);
    console.log(`   Daily Target: ${updated.daily_target}`);
    console.log(`   Start Date: ${updated.start_date.toISOString().split('T')[0]}`);
    console.log(`   Updated: ${updated.updated_at}`);
    
    console.log('\n💡 Now you can re-run the sync script:');
    console.log('   node scripts/sync-mobile-mapping-attendance-to-work-days.js');
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
/**
 * Migration: Add mobile_mapping to youth_training_progress module_type constraint
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🔄 Updating module types constraint...');
  
  try {
    await pool.query(`
      ALTER TABLE youth_training_progress 
      DROP CONSTRAINT IF EXISTS youth_training_progress_module_type_check
    `);
    
    await pool.query(`
      ALTER TABLE youth_training_progress 
      ADD CONSTRAINT youth_training_progress_module_type_check 
      CHECK (module_type IN ('mapper', 'validator', 'mobile_mapping', 'household_survey', 'microtasking'))
    `);
    
    console.log('✅ Module types constraint updated successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  // Get all tables
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  console.log('Database Tables:');
  tables.rows.forEach(r => console.log(' -', r.table_name));
  
  // Check signed_contracts columns
  console.log('\nsigned_contracts columns:');
  const signedContracts = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'signed_contracts'
  `);
  signedContracts.rows.forEach(r => console.log(' -', r.column_name));
  
  // Check youth_training_progress columns
  console.log('\nyouth_training_progress columns:');
  const training = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'youth_training_progress'
  `);
  training.rows.forEach(r => console.log(' -', r.column_name));
  
  // Check if there's work_stats_daily or youth_work_days
  console.log('\nChecking for work tables...');
  const workTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%work%'
  `);
  workTables.rows.forEach(r => console.log(' -', r.table_name));
  
  pool.end();
}

checkTables().catch(console.error);

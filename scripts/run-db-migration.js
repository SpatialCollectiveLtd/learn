/**
 * Run Database Migration Script
 * Run: node scripts/run-db-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔗 Testing database connection...');
    const test = await pool.query('SELECT NOW()');
    console.log('✅ Connected:', test.rows[0].now);
    
    console.log('\n📄 Running migration...');
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'database-optimization-2026-01-13.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
    
    // Verify new tables
    console.log('\n📊 Verifying changes...');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    
    const indexes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    console.log('Total indexes:', indexes.rows[0].count);
    
    const matviews = await pool.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
    `);
    console.log('Materialized views:', matviews.rows.map(r => r.matviewname).join(', ') || 'none');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });

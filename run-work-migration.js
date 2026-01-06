// Script to run work dashboard database migration
// This script executes the add-work-tracking-tables.sql migration file

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting work dashboard migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-work-tracking-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing SQL statements...\n');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables created
    console.log('🔍 Verifying tables...\n');
    
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('youth_osm_stats', 'youth_work_days', 'settlement_work_config')
      ORDER BY table_name
    `);
    
    console.log('Tables created:');
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Verify settlement seed data
    const settlementCheck = await client.query(`
      SELECT settlement, program_type, start_date, daily_target, total_work_days
      FROM settlement_work_config
      WHERE is_active = TRUE
      ORDER BY settlement
    `);
    
    console.log('\n📍 Settlement configurations:');
    settlementCheck.rows.forEach(row => {
      console.log(`  • ${row.settlement} (${row.program_type})`);
      console.log(`    Start Date: ${row.start_date.toISOString().split('T')[0]}`);
      console.log(`    Daily Target: ${row.daily_target} buildings`);
      console.log(`    Total Days: ${row.total_work_days}`);
    });
    
    // Verify view created
    const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'youth_work_summary'
    `);
    
    if (viewCheck.rows.length > 0) {
      console.log('\n✅ View created: youth_work_summary');
    }
    
    // Verify triggers
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table IN ('youth_osm_stats', 'youth_work_days', 'settlement_work_config')
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('\n🔧 Triggers created:');
      triggerCheck.rows.forEach(row => {
        console.log(`  ✓ ${row.trigger_name} on ${row.event_object_table}`);
      });
    }
    
    console.log('\n🎉 Migration verification complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Add REDIS_URL to .env.local (optional but recommended)');
    console.log('  2. Build the application: npm run build');
    console.log('  3. Test locally: npm run dev');
    console.log('  4. Deploy to Vercel: vercel --prod');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

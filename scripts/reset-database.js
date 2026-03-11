// Database Reset — Apply Schema v2
// WARNING: This drops ALL existing tables and applies the new minimal schema.
// Run the full-db-export.js script FIRST to archive all data.
//
// Usage: node scripts/reset-database.js
// Requires: .env.local with DATABASE_URL

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function confirm(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function resetDatabase() {
  console.log('🔴 DATABASE RESET — Learn Platform Schema v2');
  console.log('=============================================\n');

  const dbUrl = process.env.learn_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ No DATABASE_URL found in .env.local');
    process.exit(1);
  }

  const maskedUrl = dbUrl.replace(/\/\/[^@]+@/, '//***:***@');
  console.log(`Database: ${maskedUrl}\n`);

  // Safety checks
  const archiveDir = fs.readdirSync('backups').filter(d => d.startsWith('pre-reset-archive-'));
  if (archiveDir.length === 0) {
    console.error('❌ No pre-reset archive found in backups/');
    console.error('   Run "node scripts/full-db-export.js" first to create an archive.');
    process.exit(1);
  }
  console.log(`✅ Archive found: backups/${archiveDir[archiveDir.length - 1]}`);

  // Confirm
  console.log('\n⚠️  This will:');
  console.log('   1. DROP ALL existing tables, views, functions, triggers, and types');
  console.log('   2. Apply schema-v2.sql (4 tables: training_progress, notifications, notification_recipients, qgis_submissions)');
  console.log('   3. This is IRREVERSIBLE without restoring from backup\n');

  const answer = await confirm('Type "RESET" to proceed: ');
  if (answer !== 'reset') {
    console.log('❌ Aborted.');
    process.exit(0);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Step 1: Drop everything
    console.log('\n🗑️  Dropping all existing objects...\n');

    await pool.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all views
        FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
          EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.table_name) || ' CASCADE';
          RAISE NOTICE 'Dropped view: %', r.table_name;
        END LOOP;

        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          RAISE NOTICE 'Dropped table: %', r.tablename;
        END LOOP;

        -- Drop all custom types
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          RAISE NOTICE 'Dropped type: %', r.typname;
        END LOOP;

        -- Drop all functions
        FOR r IN (
          SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
        ) LOOP
          EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
          RAISE NOTICE 'Dropped function: %', r.proname;
        END LOOP;
      END $$;
    `);

    console.log('   ✅ All existing objects dropped.\n');

    // Step 2: Apply schema-v2
    console.log('📦 Applying schema-v2.sql...\n');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema-v2.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);

    console.log('   ✅ Schema v2 applied.\n');

    // Step 3: Verify
    console.log('🔍 Verifying...\n');

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('   Tables in database:');
    for (const row of tables.rows) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`   - ${row.table_name} (${count.rows[0].count} rows)`);
    }

    const expectedTables = ['training_progress', 'notifications', 'notification_recipients', 'qgis_submissions'];
    const actualTables = tables.rows.map(r => r.table_name);
    const missing = expectedTables.filter(t => !actualTables.includes(t));
    const extra = actualTables.filter(t => !expectedTables.includes(t));

    if (missing.length > 0) {
      console.log(`\n   ⚠️  Missing expected tables: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`\n   ⚠️  Unexpected extra tables: ${extra.join(', ')}`);
    }
    if (missing.length === 0 && extra.length === 0) {
      console.log('\n   ✅ All 4 expected tables present. No extras.');
    }

    console.log('\n=============================================');
    console.log('✅ Database reset complete. Schema v2 is live.');
    console.log('   Learn now owns: training_progress, notifications, notification_recipients, qgis_submissions');
    console.log('   DPW App owns: users, attendance, work, payments');
    console.log('=============================================\n');

  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    console.error('\n   The database may be in a partial state.');
    console.error('   Check the current state with: node scripts/check-tables.js');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();

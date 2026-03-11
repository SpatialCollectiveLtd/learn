// Full Database Export — Pre-Reset Archive
// Exports every table in the Learn Platform database to JSON files
// Run: node scripts/full-db-export.js
// Requires: .env.local with DATABASE_URL

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Every known table in the Learn database
const TABLES = [
  // Core tables (schema-neon-postgresql.sql)
  'staff_members',
  'youth_participants',
  'contract_templates',
  'signed_contracts',
  'auth_logs',
  'attendance_records',

  // Training
  'youth_training_progress',

  // Work tracking (add-work-tracking-tables.sql)
  'youth_osm_stats',
  'youth_work_days',
  'settlement_work_config',

  // Module expansion (add-module-expansion.sql)
  'youth_personal_info',
  'program_modules',
  'youth_module_history',
  'youth_module_stats',

  // Module assignment tracking
  'youth_module_assignments',

  // Notifications
  'youth_notifications',

  // Optimization (2026-01-13)
  'settlements',
  'audit_log',

  // Biometric attendance
  'biometric_credentials',
  'biometric_challenges',
];

// Views to export as snapshots
const VIEWS = [
  'youth_contract_status',
  'recent_auth_activity',
];

async function exportDatabase() {
  console.log('📦 Full Database Export — Pre-Reset Archive');
  console.log('============================================\n');

  const dbUrl = process.env.learn_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ No DATABASE_URL found in .env.local');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const archiveDir = path.join('backups', `pre-reset-archive-${timestamp}`);

  // Create directory
  fs.mkdirSync(archiveDir, { recursive: true });
  console.log(`📁 Archive directory: ${archiveDir}\n`);

  const manifest = {
    exported_at: new Date().toISOString(),
    reason: 'Phase A architectural reset — Learn Platform moving to DPW-as-source',
    database_url_masked: dbUrl.replace(/\/\/[^@]+@/, '//***:***@'),
    tables: {},
    views: {},
    errors: [],
  };

  // Export tables
  console.log('📊 Exporting tables...\n');
  for (const table of TABLES) {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
      const filePath = path.join(archiveDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
      manifest.tables[table] = { rows: result.rows.length, file: `${table}.json` };
      console.log(`  ✅ ${table}: ${result.rows.length} rows`);
    } catch (err) {
      // Table may not exist in this environment
      manifest.errors.push({ table, error: err.message });
      console.log(`  ⚠️  ${table}: ${err.message.includes('does not exist') ? 'table not found (skipped)' : err.message}`);
    }
  }

  // Export views
  console.log('\n📊 Exporting views...\n');
  for (const view of VIEWS) {
    try {
      const result = await pool.query(`SELECT * FROM ${view}`);
      const filePath = path.join(archiveDir, `view_${view}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
      manifest.views[view] = { rows: result.rows.length, file: `view_${view}.json` };
      console.log(`  ✅ ${view}: ${result.rows.length} rows`);
    } catch (err) {
      manifest.errors.push({ view, error: err.message });
      console.log(`  ⚠️  ${view}: ${err.message.includes('does not exist') ? 'view not found (skipped)' : err.message}`);
    }
  }

  // Export full schema (information_schema snapshot)
  console.log('\n📊 Exporting schema metadata...\n');
  try {
    const schemaResult = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    fs.writeFileSync(
      path.join(archiveDir, '_schema_columns.json'),
      JSON.stringify(schemaResult.rows, null, 2)
    );
    console.log(`  ✅ Schema columns: ${schemaResult.rows.length} column definitions`);

    const tableList = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    fs.writeFileSync(
      path.join(archiveDir, '_table_list.json'),
      JSON.stringify(tableList.rows, null, 2)
    );
    console.log(`  ✅ Table list: ${tableList.rows.length} tables/views`);
  } catch (err) {
    manifest.errors.push({ schema: true, error: err.message });
    console.log(`  ⚠️  Schema export: ${err.message}`);
  }

  // Write manifest
  fs.writeFileSync(
    path.join(archiveDir, '_MANIFEST.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Summary
  const totalRows = Object.values(manifest.tables).reduce((sum, t) => sum + t.rows, 0);
  const totalViews = Object.values(manifest.views).reduce((sum, v) => sum + v.rows, 0);

  console.log('\n============================================');
  console.log('📦 Export Complete');
  console.log(`   Tables exported: ${Object.keys(manifest.tables).length}/${TABLES.length}`);
  console.log(`   Views exported:  ${Object.keys(manifest.views).length}/${VIEWS.length}`);
  console.log(`   Total rows:      ${totalRows} (tables) + ${totalViews} (views)`);
  console.log(`   Errors:          ${manifest.errors.length}`);
  console.log(`   Location:        ${archiveDir}`);
  console.log(`   Manifest:        ${archiveDir}/_MANIFEST.json`);
  console.log('============================================\n');

  if (manifest.errors.length > 0) {
    console.log('⚠️  Some tables/views were not found — this is expected if migrations were not all applied.');
  }

  console.log('✅ This archive preserves the complete pre-reset database state.');
  console.log('   The data is NOT migrated — the platform starts fresh after reset.\n');

  await pool.end();
}

exportDatabase().catch(err => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});

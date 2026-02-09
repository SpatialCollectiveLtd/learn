/**
 * COMPREHENSIVE DATABASE BACKUP SCRIPT
 * 
 * This script creates a complete backup of the entire production database
 * to prepare for migration/integration with DPW Manager (app.spatialcollective.com)
 * 
 * Outputs:
 * 1. Individual JSON files for each table
 * 2. Complete database dump in SQL format
 * 3. Metadata file with schema information
 * 4. Relationship analysis document
 * 
 * Usage: node scripts/backup-full-database.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'full-database-backup');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_PATH = path.join(BACKUP_DIR, `backup-${TIMESTAMP}`);

// All tables in dependency order (respects foreign keys)
const TABLES = [
  // Independent tables (no foreign keys)
  'staff_members',
  'contract_templates',
  'settlement_work_config',
  
  // Dependent on staff_members and/or contract_templates
  'youth_participants',
  
  // Dependent on youth_participants
  'youth_training_progress',
  'youth_work_days',
  'youth_osm_stats',
  'youth_work_summary',
  'signed_contracts',
  'attendance_records',
  'auth_logs',
  
  // Any additional tables
  'messages',
  'odk_submissions'
];

// Database connection
const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Main backup function
 */
async function backupDatabase() {
  console.log('🗄️  FULL DATABASE BACKUP');
  console.log('=' + '='.repeat(70));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📁 Backup Path: ${BACKUP_PATH}\n`);

  try {
    // Create backup directory structure
    createBackupDirectories();

    // 1. Get database metadata
    console.log('📊 Step 1: Gathering database metadata...');
    const metadata = await gatherMetadata();
    saveJSON('metadata.json', metadata);
    console.log(`✅ Saved metadata (${metadata.totalTables} tables, ${metadata.totalRecords} total records)\n`);

    // 2. Backup each table
    console.log('💾 Step 2: Backing up tables...');
    const tableBackups = {};
    for (const tableName of TABLES) {
      const data = await backupTable(tableName);
      if (data) {
        tableBackups[tableName] = data;
        console.log(`   ✅ ${tableName}: ${data.rowCount} rows`);
      }
    }
    console.log('');

    // 3. Generate SQL dump
    console.log('📝 Step 3: Generating SQL dump...');
    await generateSQLDump(tableBackups);
    console.log('✅ SQL dump complete\n');

    // 4. Analyze relationships
    console.log('🔗 Step 4: Analyzing table relationships...');
    const relationships = await analyzeRelationships();
    saveJSON('relationships.json', relationships);
    console.log('✅ Relationship analysis complete\n');

    // 5. Generate migration report
    console.log('📋 Step 5: Generating migration report...');
    await generateMigrationReport(metadata, tableBackups, relationships);
    console.log('✅ Migration report generated\n');

    // 6. Summary
    printSummary(metadata, tableBackups);

  } catch (error) {
    console.error('❌ BACKUP FAILED:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Create backup directory structure
 */
function createBackupDirectories() {
  const dirs = [
    BACKUP_PATH,
    path.join(BACKUP_PATH, 'json'),
    path.join(BACKUP_PATH, 'sql'),
    path.join(BACKUP_PATH, 'reports')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Gather database metadata
 */
async function gatherMetadata() {
  const metadata = {
    backupTimestamp: new Date().toISOString(),
    database: 'learn_platform',
    tables: [],
    totalTables: 0,
    totalRecords: 0
  };

  // Get list of all tables
  const tablesQuery = `
    SELECT 
      tablename,
      schemaname
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  
  const { rows: tables } = await pool.query(tablesQuery);

  for (const table of tables) {
    const tableName = table.tablename;
    
    // Get row count
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const rowCount = parseInt(countResult.rows[0].count);

    // Get columns
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;
    const { rows: columns } = await pool.query(columnsQuery, [tableName]);

    metadata.tables.push({
      name: tableName,
      rowCount,
      columns: columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        maxLength: col.character_maximum_length,
        nullable: col.is_nullable === 'YES'
      }))
    });

    metadata.totalRecords += rowCount;
  }

  metadata.totalTables = metadata.tables.length;
  return metadata;
}

/**
 * Backup a single table
 */
async function backupTable(tableName) {
  try {
    // Check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    const { rows } = await pool.query(checkQuery, [tableName]);
    
    if (!rows[0].exists) {
      console.log(`   ⚠️  ${tableName}: Table does not exist, skipping`);
      return null;
    }

    // Get all data
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY 1`);
    
    // Save as JSON
    const data = {
      table: tableName,
      rowCount: result.rows.length,
      timestamp: new Date().toISOString(),
      data: result.rows
    };

    saveJSON(`json/${tableName}.json`, data);
    return data;

  } catch (error) {
    console.log(`   ❌ ${tableName}: Error - ${error.message}`);
    return null;
  }
}

/**
 * Generate SQL dump for all tables
 */
async function generateSQLDump(tableBackups) {
  let sqlContent = `-- Full Database Backup
-- Generated: ${new Date().toISOString()}
-- Database: learn_platform
-- Total Tables: ${Object.keys(tableBackups).length}

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

BEGIN;

`;

  // Generate INSERT statements for each table
  for (const [tableName, backup] of Object.entries(tableBackups)) {
    if (!backup || backup.rowCount === 0) continue;

    sqlContent += `\n-- ============================================\n`;
    sqlContent += `-- Table: ${tableName} (${backup.rowCount} rows)\n`;
    sqlContent += `-- ============================================\n\n`;

    // Get column names from first row
    const columns = Object.keys(backup.data[0]);
    
    for (const row of backup.data) {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return val;
      }).join(', ');

      sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
    }

    sqlContent += '\n';
  }

  sqlContent += '\nCOMMIT;\n';

  // Save SQL file
  fs.writeFileSync(
    path.join(BACKUP_PATH, 'sql', 'full-backup.sql'),
    sqlContent,
    'utf8'
  );
}

/**
 * Analyze table relationships
 */
async function analyzeRelationships() {
  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `;

  const { rows } = await pool.query(query);

  const relationships = {
    total: rows.length,
    foreignKeys: rows.map(row => ({
      table: row.table_name,
      column: row.column_name,
      referencesTable: row.foreign_table_name,
      referencesColumn: row.foreign_column_name,
      onDelete: row.delete_rule,
      onUpdate: row.update_rule
    }))
  };

  return relationships;
}

/**
 * Generate migration report
 */
async function generateMigrationReport(metadata, tableBackups, relationships) {
  const report = `# Database Migration Report
Generated: ${new Date().toISOString()}

## Executive Summary

This report provides a comprehensive overview of the current Learn Platform database
to facilitate migration/integration with DPW Manager (app.spatialcollective.com).

### Database Statistics

- **Total Tables**: ${metadata.totalTables}
- **Total Records**: ${metadata.totalRecords.toLocaleString()}
- **Foreign Key Relationships**: ${relationships.total}
- **Backup Location**: ${BACKUP_PATH}

## Table Overview

${metadata.tables.map(table => `
### ${table.name}
- **Row Count**: ${table.rowCount.toLocaleString()}
- **Columns**: ${table.columns.length}
${table.columns.map(col => `  - ${col.name} (${col.type}${col.maxLength ? `(${col.maxLength})` : ''}) ${col.nullable ? 'NULL' : 'NOT NULL'}`).join('\n')}
`).join('\n')}

## Foreign Key Relationships

${relationships.foreignKeys.map(fk => 
  `- \`${fk.table}.${fk.column}\` → \`${fk.referencesTable}.${fk.referencesColumn}\` (ON DELETE: ${fk.onDelete}, ON UPDATE: ${fk.onUpdate})`
).join('\n')}

## Critical Tables for Migration

### 1. User Authentication
- **staff_members**: ${tableBackups.staff_members?.rowCount || 0} staff accounts
- **youth_participants**: ${tableBackups.youth_participants?.rowCount || 0} youth accounts
- **auth_logs**: ${tableBackups.auth_logs?.rowCount || 0} authentication events

### 2. Training & Progress
- **youth_training_progress**: ${tableBackups.youth_training_progress?.rowCount || 0} progress records
- **contract_templates**: ${tableBackups.contract_templates?.rowCount || 0} templates
- **signed_contracts**: ${tableBackups.signed_contracts?.rowCount || 0} signed contracts

### 3. Work Tracking
- **youth_work_days**: ${tableBackups.youth_work_days?.rowCount || 0} work day records
- **youth_osm_stats**: ${tableBackups.youth_osm_stats?.rowCount || 0} OSM statistics
- **youth_work_summary**: ${tableBackups.youth_work_summary?.rowCount || 0} work summaries
- **settlement_work_config**: ${tableBackups.settlement_work_config?.rowCount || 0} configurations

### 4. Attendance
- **attendance_records**: ${tableBackups.attendance_records?.rowCount || 0} attendance records

## Integration Considerations

### Shared User Base
Both platforms share the same group of users. Key considerations:
1. **User ID Format**: Learn uses \`KAY123\`, \`KAR456\`, etc.
2. **Authentication**: Currently separate JWT systems
3. **User Profile Data**: Needs to be synchronized

### Data Synchronization
Current sync mechanism:
- DPW Sync API (\`/api/external/dpw-sync\`) provides read-only access
- API Key authentication
- Query by youth_id or module

### Recommended Migration Path
1. **Phase 1**: Centralize authentication
2. **Phase 2**: Merge user databases
3. **Phase 3**: Sync work tracking data
4. **Phase 4**: Unified contract management
5. **Phase 5**: Real-time data synchronization

## Next Steps

1. Review this backup with DPW Manager team
2. Identify schema conflicts/overlaps
3. Design unified authentication flow
4. Create data migration scripts
5. Test in staging environment

---

**Backup Files:**
- Metadata: \`metadata.json\`
- Table Data: \`json/*.json\`
- SQL Dump: \`sql/full-backup.sql\`
- Relationships: \`relationships.json\`
`;

  fs.writeFileSync(
    path.join(BACKUP_PATH, 'reports', 'MIGRATION_REPORT.md'),
    report,
    'utf8'
  );
}

/**
 * Save JSON file
 */
function saveJSON(filename, data) {
  const filepath = path.join(BACKUP_PATH, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Print summary
 */
function printSummary(metadata, tableBackups) {
  console.log('=' + '='.repeat(70));
  console.log('✅ BACKUP COMPLETE');
  console.log('=' + '='.repeat(70));
  console.log('\n📊 Summary:');
  console.log(`   Tables Backed Up: ${Object.keys(tableBackups).length}`);
  console.log(`   Total Records: ${metadata.totalRecords.toLocaleString()}`);
  console.log(`\n📁 Backup Location:`);
  console.log(`   ${BACKUP_PATH}`);
  console.log('\n📄 Files Generated:');
  console.log(`   ✓ metadata.json - Database schema info`);
  console.log(`   ✓ relationships.json - Foreign key relationships`);
  console.log(`   ✓ json/*.json - Individual table backups`);
  console.log(`   ✓ sql/full-backup.sql - Complete SQL dump`);
  console.log(`   ✓ reports/MIGRATION_REPORT.md - Migration analysis`);
  console.log('\n🎯 Next Steps:');
  console.log(`   1. Review the migration report`);
  console.log(`   2. Share with DPW Manager team`);
  console.log(`   3. Identify schema overlaps`);
  console.log(`   4. Plan phased migration`);
  console.log('\n');
}

// Run backup
backupDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

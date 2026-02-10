require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupDir = path.join(__dirname, '..', 'backups', 'database-backups');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🗄️  DATABASE BACKUP STARTING');
    console.log('='.repeat(80));
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`📁 Backup Location: ${backupPath}`);
    console.log('');

    // Core tables to backup
    const tables = [
      'youth_participants',
      'attendance_records',
      'youth_work_days',
      'youth_work_summary',
      'youth_osm_stats',
      'youth_training_progress',
      'signed_contracts',
      'contract_templates',
      'staff_members',
      'settlement_work_config'
    ];

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      tables: {}
    };

    for (const table of tables) {
      try {
        console.log(`📦 Backing up ${table}...`);
        const result = await pool.query(`SELECT * FROM ${table}`);
        backupData.tables[table] = {
          rowCount: result.rows.length,
          data: result.rows
        };
        console.log(`   ✅ ${result.rows.length} rows backed up`);
      } catch (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
        backupData.tables[table] = {
          error: error.message,
          rowCount: 0,
          data: []
        };
      }
    }

    // Write JSON backup
    const jsonPath = `${backupPath}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));
    console.log(`\n✅ JSON backup saved: ${jsonPath}`);

    // Generate SQL backup
    let sqlContent = `-- Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Tables: ${tables.length}\n\n`;
    
    for (const table of tables) {
      if (backupData.tables[table].data.length > 0) {
        sqlContent += `\n-- Table: ${table} (${backupData.tables[table].rowCount} rows)\n`;
        sqlContent += `DELETE FROM ${table};\n`;
        
        const rows = backupData.tables[table].data;
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          
          sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }
    }

    const sqlPath = `${backupPath}.sql`;
    fs.writeFileSync(sqlPath, sqlContent);
    console.log(`✅ SQL backup saved: ${sqlPath}`);

    // Summary
    const totalRows = Object.values(backupData.tables).reduce((sum, t) => sum + t.rowCount, 0);
    console.log('\n' + '='.repeat(80));
    console.log('✅ BACKUP COMPLETE');
    console.log('='.repeat(80));
    console.log(`📊 Tables Backed Up: ${tables.length}`);
    console.log(`📈 Total Rows: ${totalRows}`);
    console.log(`📁 Location: ${backupPath}.{json,sql}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ BACKUP FAILED:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupDatabase();

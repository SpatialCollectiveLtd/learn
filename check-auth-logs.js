require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkAuthLogsStructure() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔍 Checking auth_logs table structure...\n');
    
    // Get table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'auth_logs' 
      ORDER BY ordinal_position
    `);

    console.log('📋 auth_logs table columns (in order):');
    console.log('┌─────────────────────┬─────────────────┬──────────┬─────────────────┐');
    console.log('│ Column Name         │ Data Type       │ Nullable │ Default         │');
    console.log('├─────────────────────┼─────────────────┼──────────┼─────────────────┤');
    
    columnsResult.rows.forEach(col => {
      const name = col.column_name.padEnd(19);
      const type = col.data_type.padEnd(15);
      const nullable = col.is_nullable.padEnd(8);
      const defaultVal = (col.column_default || '').substring(0, 15).padEnd(15);
      console.log(`│ ${name} │ ${type} │ ${nullable} │ ${defaultVal} │`);
    });
    
    console.log('└─────────────────────┴─────────────────┴──────────┴─────────────────┘');

    // Check a few sample rows to understand the data structure
    console.log('\n📊 Sample auth_logs data (last 3 rows):');
    const sampleData = await client.query('SELECT * FROM auth_logs ORDER BY created_at DESC LIMIT 3');
    
    if (sampleData.rows.length > 0) {
      sampleData.rows.forEach((row, idx) => {
        console.log(`\nRow ${idx + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`   ${key}: ${row[key]}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error checking auth_logs structure:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAuthLogsStructure().catch(console.error);
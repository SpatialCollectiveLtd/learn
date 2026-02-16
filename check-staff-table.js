require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkStaffTable() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔍 Checking staff_members table structure...\n');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'staff_members'
      ) as table_exists
    `);

    if (!tableCheck.rows[0].table_exists) {
      console.log('❌ staff_members table does not exist');
      return;
    }

    // Get table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'staff_members' 
      ORDER BY column_name
    `);

    console.log('📋 staff_members table columns:');
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

    // Check for existing mobile-related columns
    const mobileColumns = columnsResult.rows.filter(col => 
      col.column_name.includes('mobile') || 
      col.column_name.includes('pin') ||
      col.column_name.includes('attend')
    );

    console.log('\n📱 Mobile-related columns found:');
    if (mobileColumns.length > 0) {
      mobileColumns.forEach(col => {
        console.log(`   ✓ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('   ❌ No mobile-related columns found - schema needs to be updated');
    }

    // Sample data check
    const sampleData = await client.query('SELECT * FROM staff_members LIMIT 3');
    console.log(`\n📊 Sample data (${sampleData.rows.length} rows):`);
    if (sampleData.rows.length > 0) {
      const firstRow = sampleData.rows[0];
      Object.keys(firstRow).forEach(key => {
        console.log(`   ${key}: ${firstRow[key]}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking staff table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStaffTable().catch(console.error);
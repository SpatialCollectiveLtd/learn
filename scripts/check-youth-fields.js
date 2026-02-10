require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkYouthFields() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔍 CHECKING YOUTH PARTICIPANTS TABLE STRUCTURE');
    console.log('='.repeat(80));

    // Get all columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'youth_participants'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 AVAILABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '- nullable' : ''}`);
    });

    // Check for sample data
    const sample = await pool.query(`
      SELECT youth_id, full_name, phone_number, id_number
      FROM youth_participants
      LIMIT 5
    `);

    console.log('\n📊 SAMPLE DATA:');
    sample.rows.forEach(row => {
      console.log(`\n   ${row.youth_id}:`);
      console.log(`      Name: ${row.full_name}`);
      console.log(`      Phone: ${row.phone_number || 'N/A'}`);
      console.log(`      ID Number: ${row.id_number || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

checkYouthFields();

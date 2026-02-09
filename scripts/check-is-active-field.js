require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkIsActiveField() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔍 CHECKING is_active FIELD');
    console.log('='.repeat(80));

    // Check is_active distribution
    const activeQuery = await pool.query(`
      SELECT 
        is_active,
        program_type,
        COUNT(*) as count
      FROM youth_participants
      GROUP BY is_active, program_type
      ORDER BY is_active, program_type
    `);

    console.log('\n📊 IS_ACTIVE DISTRIBUTION:');
    activeQuery.rows.forEach(row => {
      console.log(`   is_active=${row.is_active}, program_type=${row.program_type}: ${row.count} participants`);
    });

    // Check total participants
    const totalQuery = await pool.query(`
      SELECT COUNT(*) as total FROM youth_participants
    `);
    console.log(`\n   TOTAL PARTICIPANTS: ${totalQuery.rows[0].total}`);

    // Check if is_active field exists and what values it has
    const fieldQuery = await pool.query(`
      SELECT is_active, COUNT(*) as count
      FROM youth_participants
      GROUP BY is_active
      ORDER BY is_active
    `);

    console.log('\n📋 IS_ACTIVE VALUES:');
    fieldQuery.rows.forEach(row => {
      console.log(`   ${row.is_active === null ? 'NULL' : row.is_active}: ${row.count}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ CHECK COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkIsActiveField();

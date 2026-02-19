require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 CHECKING YOUTH_PARTICIPANTS TABLE STRUCTURE\n');

    // Get table column structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants' 
      ORDER BY ordinal_position
    `);

    console.log('📋 AVAILABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Try to find HUR438PW using basic query
    console.log('\n🔍 SEARCHING FOR HUR438PW:');
    const searchResults = await pool.query(`
      SELECT * FROM youth_participants 
      WHERE youth_id = 'HUR438PW'
      LIMIT 1
    `);

    if (searchResults.rows.length > 0) {
      console.log('✅ Found HUR438PW:');
      const paul = searchResults.rows[0];
      Object.keys(paul).forEach(key => {
        console.log(`   ${key}: ${paul[key]}`);
      });
    } else {
      console.log('❌ HUR438PW not found');
      
      // Search for similar IDs
      const similarSearch = await pool.query(`
        SELECT youth_id FROM youth_participants 
        WHERE youth_id LIKE 'HUR%' 
        ORDER BY youth_id
        LIMIT 10
      `);
      
      console.log('\n📋 Similar HUR IDs found:');
      similarSearch.rows.forEach(row => {
        console.log(`   ${row.youth_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Table check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
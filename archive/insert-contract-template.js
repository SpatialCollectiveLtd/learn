const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function insertContractTemplate() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Neon PostgreSQL database...\n');
    
    // Read the SQL file
    const sql = fs.readFileSync('./database/insert-contract-templates.sql', 'utf8');
    
    console.log('Inserting comprehensive contract template...');
    await client.query(sql);
    
    console.log('✅ Contract template inserted successfully!\n');
    
    // Verify insertion
    const result = await client.query(`
      SELECT template_id, program_type, version, title, 
             LENGTH(content) as content_length,
             created_at
      FROM contract_templates 
      WHERE program_type = 'digitization'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification successful:');
      console.log(result.rows[0]);
      console.log(`\nContract template contains ${result.rows[0].content_length} characters`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

insertContractTemplate()
  .then(() => {
    console.log('\n🎉 Contract template setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup error:', error);
    process.exit(1);
  });

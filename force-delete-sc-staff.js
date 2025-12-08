const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteOldStaff() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Checking for SC### staff in database...\n');
    
    const check = await client.query(`
      SELECT staff_id, full_name, role 
      FROM staff_members 
      WHERE staff_id LIKE 'SC%'
    `);
    
    if (check.rows.length > 0) {
      console.log('Found SC### entries:');
      console.table(check.rows);
      
      await client.query(`DELETE FROM staff_members WHERE staff_id LIKE 'SC%'`);
      console.log('\n✅ Deleted all SC### entries');
    } else {
      console.log('✅ No SC### entries found in database - already clean!');
    }
    
    // Clear auth_logs for SC### to prevent confusion
    const logCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM auth_logs 
      WHERE user_id LIKE 'SC%' AND user_type = 'staff'
    `);
    
    console.log(`\n📋 Found ${logCheck.rows[0].count} SC### login logs`);
    
    await client.query(`
      DELETE FROM auth_logs 
      WHERE user_id LIKE 'SC%' AND user_type = 'staff'
    `);
    
    console.log('✅ Cleared SC### login logs\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteOldStaff();

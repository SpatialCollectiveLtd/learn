const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeMobileMappers() {
  try {
    console.log('📊 MOBILE MAPPING USERS ANALYSIS\n');
    
    // Get youth_participants columns first
    console.log('=== YOUTH_PARTICIPANTS COLUMNS ===');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants' 
      ORDER BY ordinal_position
    `);
    columns.rows.forEach(c => console.log(`${c.column_name} - ${c.data_type}`));
    
    // Get breakdown by settlement
    console.log('\n=== BY SETTLEMENT ===');
    const bySettlement = await pool.query(`
      SELECT 
        settlement,
        COUNT(*) as total,
        COUNT(CASE WHEN odk_actor_id IS NOT NULL THEN 1 END) as with_odk
      FROM youth_participants
      WHERE program_type = 'mobile_mapping'
      GROUP BY settlement
      ORDER BY total DESC
    `);
    
    bySettlement.rows.forEach(row => {
      console.log(`${row.settlement}:`);
      console.log(`  Total: ${row.total}`);
      console.log(`  With ODK: ${row.with_odk}`);
      console.log('');
    });
    
    // Get users table schema
    console.log('=== USERS TABLE SCHEMA ===');
    const usersSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    usersSchema.rows.forEach(c => console.log(`${c.column_name} - ${c.data_type}`));
    
    // Check how many mobile mappers have login accounts
    console.log('\n=== USER ACCOUNTS ===');
    const userAccounts = await pool.query(`
      SELECT 
        COUNT(DISTINCT yp.youth_id) as total_mobile_mappers,
        COUNT(DISTINCT u.user_id) as with_user_accounts,
        COUNT(DISTINCT CASE WHEN u.role = 'youth' THEN u.user_id END) as youth_role_accounts
      FROM youth_participants yp
      LEFT JOIN users u ON yp.youth_id = u.youth_id
      WHERE yp.program_type = 'mobile_mapping'
    `);
    console.log(`Total mobile mappers: ${userAccounts.rows[0].total_mobile_mappers}`);
    console.log(`With user accounts: ${userAccounts.rows[0].with_user_accounts}`);
    console.log(`With 'youth' role: ${userAccounts.rows[0].youth_role_accounts}`);
    
    // Get sample user accounts
    console.log('\n=== SAMPLE USER ACCOUNTS (5) ===');
    const sampleUsers = await pool.query(`
      SELECT u.user_id, u.username, u.role, yp.full_name, yp.settlement
      FROM users u
      JOIN youth_participants yp ON u.youth_id = yp.youth_id
      WHERE yp.program_type = 'mobile_mapping'
      LIMIT 5
    `);
    sampleUsers.rows.forEach(u => {
      console.log(`${u.username} (${u.role}) - ${u.full_name} - ${u.settlement}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

analyzeMobileMappers();

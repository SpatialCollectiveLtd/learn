const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function removeTestUsers() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('🗑️  Removing old test users (YT001, YT002, YT003)...');
    
    const deleteResult = await client.query(`
      DELETE FROM youth_participants 
      WHERE youth_id IN ('YT001', 'YT002', 'YT003')
      RETURNING youth_id, full_name;
    `);
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ Deleted users:');
      deleteResult.rows.forEach(user => {
        console.log(`   - ${user.youth_id}: ${user.full_name}`);
      });
    } else {
      console.log('ℹ️  No users found to delete');
    }
    console.log();

    // Verify remaining users
    console.log('📊 Verifying remaining youth participants...');
    const remaining = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN youth_id LIKE 'YT%' THEN 1 END) as yt_users,
        COUNT(CASE WHEN youth_id LIKE 'KAY%' THEN 1 END) as kay_users
      FROM youth_participants;
    `);
    console.log('Statistics:', remaining.rows[0]);
    console.log();

    // List all users
    console.log('👥 All Youth Participants:');
    const allUsers = await client.query(`
      SELECT youth_id, full_name, program_type, is_active 
      FROM youth_participants 
      ORDER BY created_at DESC
      LIMIT 10;
    `);
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.youth_id}: ${user.full_name} (${user.program_type}) ${user.is_active ? '✓' : '✗'}`);
    });
    
    const totalCount = await client.query('SELECT COUNT(*) as count FROM youth_participants');
    console.log(`\n📈 Total: ${totalCount.rows[0].count} participants`);

    console.log('\n✅ ✅ ✅ Old test users removed successfully! ✅ ✅ ✅');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

removeTestUsers();

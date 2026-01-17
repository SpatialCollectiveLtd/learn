const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupOldStaff() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Cleaning up old staff entries with SC### format...\n');

    // Check what we're about to delete
    const checkResult = await client.query(`
      SELECT staff_id, full_name, role 
      FROM staff_members 
      WHERE staff_id LIKE 'SC%'
      ORDER BY staff_id
    `);

    if (checkResult.rows.length === 0) {
      console.log('✅ No old SC### entries found. Database is clean!\n');
      return;
    }

    console.log('📋 Found old entries to remove:');
    console.table(checkResult.rows);

    // Delete old SC### entries
    const deleteResult = await client.query(`
      DELETE FROM staff_members 
      WHERE staff_id LIKE 'SC%'
      RETURNING staff_id, full_name
    `);

    console.log(`\n✅ Removed ${deleteResult.rows.length} old staff entries\n`);

    // Show current staff
    console.log('📊 Current staff members:\n');
    const currentStaff = await client.query(`
      SELECT 
        staff_id,
        full_name,
        email,
        role,
        created_by,
        is_active
      FROM staff_members
      ORDER BY 
        CASE role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'trainer' THEN 3 
          ELSE 4 
        END,
        staff_id
    `);

    console.table(currentStaff.rows);
    console.log(`\n✨ Database cleanup complete! ${currentStaff.rows.length} staff members remaining.\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupOldStaff().catch(console.error);

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkAndFixStaff() {
  const client = await pool.connect();
  
  try {
    console.log('Checking current staff members...\n');
    
    const result = await client.query('SELECT * FROM staff_members ORDER BY staff_id');
    console.log('Current staff:', result.rows);
    
    console.log('\n\nUpdating schema...\n');
    
    // Drop old constraint FIRST
    await client.query("ALTER TABLE staff_members DROP CONSTRAINT IF EXISTS staff_members_role_check");
    console.log('✅ Dropped old constraint');
    
    // Now update roles
    await client.query("UPDATE staff_members SET role = 'trainer' WHERE role = 'validator'");
    await client.query("UPDATE staff_members SET role = 'superadmin' WHERE role = 'admin' AND staff_id = 'SC001'");
    console.log('✅ Updated existing roles');
    
    // Add new constraint
    await client.query("ALTER TABLE staff_members ADD CONSTRAINT staff_members_role_check CHECK (role IN ('trainer', 'admin', 'superadmin'))");
    console.log('✅ Added new constraint');
    
    // Add new columns
    await client.query("ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)");
    await client.query("ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)");
    console.log('✅ Added new columns');
    
    // Add index
    await client.query("CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role)");
    console.log('✅ Added role index');
    
    console.log('\n✅ Manual migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndFixStaff()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

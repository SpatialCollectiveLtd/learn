const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupStaffAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up staff hierarchy...\n');
    
    // Update SC001 to superadmin
    await client.query(`
      UPDATE staff_members 
      SET role = 'superadmin',
          full_name = 'Spatial Collective Admin',
          email = 'admin@spatialcollective.co.ke',
          phone_number = '+254700000000'
      WHERE staff_id = 'SC001'
    `);
    console.log('✅ SC001 - Spatial Collective Admin (SUPERADMIN)');
    
    // Update SC002 and SC003 to trainers
    await client.query(`
      UPDATE staff_members 
      SET role = 'trainer',
          created_by = 'SC001'
      WHERE staff_id IN ('SC002', 'SC003')
    `);
    console.log('✅ SC002 - Validator One → Trainer (created by SC001)');
    console.log('✅ SC003 - Validator Two → Trainer (created by SC001)');
    
    // Add foreign key constraint now that created_by is populated
    await client.query(`
      ALTER TABLE staff_members
      DROP CONSTRAINT IF EXISTS fk_staff_created_by
    `);
    
    await client.query(`
      ALTER TABLE staff_members
      ADD CONSTRAINT fk_staff_created_by 
      FOREIGN KEY (created_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
    `);
    console.log('✅ Added created_by foreign key constraint');
    
    // Display final hierarchy
    const result = await client.query(`
      SELECT 
        s.staff_id,
        s.full_name,
        s.email,
        s.phone_number,
        s.role,
        c.full_name as created_by_name,
        s.is_active
      FROM staff_members s
      LEFT JOIN staff_members c ON s.created_by = c.staff_id
      ORDER BY 
        CASE s.role 
          WHEN 'superadmin' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'trainer' THEN 3 
        END,
        s.staff_id
    `);
    
    console.log('\n' + '='.repeat(90));
    console.log('STAFF HIERARCHY');
    console.log('='.repeat(90));
    
    result.rows.forEach(row => {
      const createdBy = row.created_by_name ? ` (created by ${row.created_by_name})` : ' (ROOT)';
      const status = row.is_active ? '🟢' : '🔴';
      console.log(`${status} ${row.staff_id} - ${row.full_name}`);
      console.log(`   Role: ${row.role.toUpperCase()}${createdBy}`);
      console.log(`   Contact: ${row.email || 'N/A'} | ${row.phone_number || 'N/A'}`);
      console.log();
    });
    
    console.log('='.repeat(90));
    console.log('\nPermissions Summary:');
    console.log('  SUPERADMIN: Full system access, can create/manage admins');
    console.log('  ADMIN: Can create/manage trainers, view youth contracts, print agreements');
    console.log('  TRAINER: Can access training materials only (no dashboard)');
    console.log('='.repeat(90));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupStaffAccounts()
  .then(() => {
    console.log('\n🎉 Staff hierarchy setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

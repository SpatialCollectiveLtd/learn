const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateStaffHierarchy() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Neon PostgreSQL database...\n');
    console.log('Running staff hierarchy migration...\n');
    
    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync('./database/migrations/add-staff-hierarchy.sql', 'utf8');
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Insert initial superadmin and admin accounts
    console.log('Creating initial staff accounts...\n');
    
    // Create superadmin first
    await client.query(`
      INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, is_active)
      VALUES ('SA001', 'Super Admin', 'admin@spatialcollective.co.ke', '+254700000000', 'superadmin', true)
      ON CONFLICT (staff_id) DO UPDATE 
      SET role = 'superadmin', 
          email = EXCLUDED.email,
          phone_number = EXCLUDED.phone_number
    `);
    console.log('✅ SA001 - Super Admin (superadmin)');
    
    // Create sample admin created by superadmin
    await client.query(`
      INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active)
      VALUES ('AD001', 'John Doe', 'john.doe@spatialcollective.co.ke', '+254711111111', 'admin', 'SA001', true)
      ON CONFLICT (staff_id) DO UPDATE 
      SET role = 'admin',
          created_by = 'SA001',
          email = EXCLUDED.email,
          phone_number = EXCLUDED.phone_number
    `);
    console.log('✅ AD001 - John Doe (admin, created by SA001)');
    
    // Create sample trainer created by admin
    await client.query(`
      INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active)
      VALUES ('TR001', 'Mary Smith', 'mary.smith@spatialcollective.co.ke', '+254722222222', 'trainer', 'AD001', true)
      ON CONFLICT (staff_id) DO UPDATE 
      SET role = 'trainer',
          created_by = 'AD001',
          email = EXCLUDED.email,
          phone_number = EXCLUDED.phone_number
    `);
    console.log('✅ TR001 - Mary Smith (trainer, created by AD001)');
    
    // Verify staff hierarchy
    const result = await client.query(`
      SELECT 
        s.staff_id,
        s.full_name,
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
    
    console.log('\n' + '='.repeat(80));
    console.log('Staff Hierarchy:');
    console.log('='.repeat(80));
    
    result.rows.forEach(row => {
      const createdBy = row.created_by_name ? ` (created by ${row.created_by_name})` : ' (root account)';
      const status = row.is_active ? '🟢' : '🔴';
      console.log(`${status} ${row.staff_id} - ${row.full_name} [${row.role.toUpperCase()}]${createdBy}`);
    });
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStaffHierarchy()
  .then(() => {
    console.log('\n🎉 Staff hierarchy migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });

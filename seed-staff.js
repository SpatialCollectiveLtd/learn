const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedStaff() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Starting staff seeding with new ID format...\n');

    // Insert Super Admin
    await client.query(`
      INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
        ('STEA8103SA', 'Technical Team', 'tech@spatialcollective.com', NULL, 'superadmin', NULL, TRUE)
      ON CONFLICT (staff_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ STEA8103SA - Technical Team (Super Admin)');

    // Insert Admin
    await client.query(`
      INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
        ('SMEA4441A', 'Alex Okumu', 'alex.okumu@spatialcollective.com', NULL, 'admin', 'STEA8103SA', TRUE)
      ON CONFLICT (staff_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        created_by = EXCLUDED.created_by,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ SMEA4441A - Alex Okumu (Admin)');

    // Insert Trainers
    const trainers = [
      { id: 'SFEA0119T', name: 'Juma Charles', email: 'juma.charles@spatialcollective.com' },
      { id: 'SFEA4333T', name: 'Francis Wambua', email: 'francis.wambua@spatialcollective.com' },
      { id: 'SFEA4808T', name: 'Purent Oduor', email: 'purent.oduor@spatialcollective.com' }
    ];

    for (const trainer of trainers) {
      await client.query(`
        INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
          ($1, $2, $3, NULL, 'trainer', 'STEA8103SA', TRUE)
        ON CONFLICT (staff_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          created_by = EXCLUDED.created_by,
          updated_at = CURRENT_TIMESTAMP
      `, [trainer.id, trainer.name, trainer.email]);
      console.log(`✅ ${trainer.id} - ${trainer.name} (Trainer)`);
    }

    console.log('\n📊 Current staff members:\n');
    
    // Verify the data
    const result = await client.query(`
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

    console.table(result.rows);
    console.log(`\n✨ Successfully seeded ${result.rows.length} staff members!\n`);

  } catch (error) {
    console.error('❌ Error seeding staff:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedStaff().catch(console.error);

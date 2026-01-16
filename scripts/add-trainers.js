const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addTrainers() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Adding new trainers...\n');

    const trainers = [
      { id: 'SFEA1601T', name: 'Fred' },
      { id: 'SFEA1602T', name: 'KFLY' },
      { id: 'SFEA1603T', name: 'Eddie' },
      { id: 'SFEA1604T', name: 'Alex' }
    ];

    for (const trainer of trainers) {
      await client.query(`
        INSERT INTO staff_members (staff_id, full_name, role, created_by, is_active) VALUES
          ($1, $2, 'trainer', 'STEA8103SA', TRUE)
        ON CONFLICT (staff_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          role = 'trainer',
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP
      `, [trainer.id, trainer.name]);
      console.log(`✅ Added: ${trainer.id} - ${trainer.name} (Trainer)`);
    }

    console.log('\n📊 All trainers in system:\n');
    const result = await client.query(`
      SELECT staff_id, full_name, role, is_active 
      FROM staff_members 
      WHERE role = 'trainer'
      ORDER BY created_at DESC
    `);
    console.table(result.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

addTrainers();

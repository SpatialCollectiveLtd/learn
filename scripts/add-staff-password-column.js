/**
 * Add password_hash column to staff_members table.
 * Run: node scripts/add-staff-password-column.js
 */
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Adding password_hash column to staff_members...');
  try {
    await pool.query(`
      ALTER TABLE staff_members
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
    console.log('✓ Column added (or already existed).');

    const { rows } = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'staff_members' AND column_name = 'password_hash'
    `);
    if (rows.length > 0) {
      console.log('✓ Confirmed: password_hash column exists.');
    } else {
      console.error('✗ Column not found after migration.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

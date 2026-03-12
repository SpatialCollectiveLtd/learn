/**
 * Set a bcrypt password hash for a staff member by email.
 * Run: node scripts/set-trainer-password.js <email> <password>
 *
 * Example:
 *   node scripts/set-trainer-password.js trainer@example.com secretpass123
 */
require('dotenv').config({ path: '.env.local' });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/set-trainer-password.js <email> <password>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    // Verify the staff member exists and is active
    const { rows } = await pool.query(
      `SELECT staff_id, full_name, role FROM staff_members WHERE email = $1 AND is_active = true`,
      [email]
    );

    if (rows.length === 0) {
      console.error(`✗ No active staff member found with email: ${email}`);
      process.exit(1);
    }

    const staff = rows[0];
    console.log(`Found: ${staff.full_name} (${staff.role}) — ${email}`);

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE staff_members SET password_hash = $1 WHERE email = $2`,
      [hash, email]
    );

    console.log(`✓ Password set successfully for ${staff.full_name}.`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

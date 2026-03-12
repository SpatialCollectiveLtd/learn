/**
 * Create the payment_disputes table in Learn's PostgreSQL database.
 * Run: node scripts/create-disputes-table.js
 */
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Creating payment_disputes table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_disputes (
        id              SERIAL PRIMARY KEY,
        youth_id        VARCHAR(20) NOT NULL,
        dispute_date    DATE NOT NULL,
        module          VARCHAR(50),
        issue_type      VARCHAR(50) NOT NULL,
        description     TEXT,
        expected_amount_kes  NUMERIC(10, 2),
        reported_amount_kes  NUMERIC(10, 2),
        status          VARCHAR(20) NOT NULL DEFAULT 'open',
        resolver_staff_id    VARCHAR(30),
        resolution_note TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at     TIMESTAMPTZ,

        CONSTRAINT payment_disputes_youth_id_fk
          FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
        CONSTRAINT payment_disputes_status_check
          CHECK (status IN ('open', 'resolved', 'rejected'))
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS payment_disputes_youth_id_idx
        ON payment_disputes(youth_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS payment_disputes_status_idx
        ON payment_disputes(status)
    `);

    console.log('✓ payment_disputes table created (or already existed).');

    const { rows } = await pool.query(`
      SELECT COUNT(*) as col_count
      FROM information_schema.columns
      WHERE table_name = 'payment_disputes'
    `);
    console.log(`✓ Confirmed: ${rows[0].col_count} columns in payment_disputes.`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

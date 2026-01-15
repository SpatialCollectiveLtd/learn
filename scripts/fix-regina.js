/**
 * Fix Regina - move to digitization program
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    // Show before
    console.log('BEFORE:');
    const before = await pool.query(`
      SELECT youth_id, full_name, program_type, odk_token IS NOT NULL as has_odk
      FROM youth_participants WHERE youth_id = 'KAY348RN'
    `);
    console.log(before.rows[0]);

    // Update Regina to digitization and clear ODK tokens
    await pool.query(`
      UPDATE youth_participants 
      SET program_type = 'digitization', 
          odk_token = NULL, 
          odk_actor_id = NULL, 
          odk_configured_at = NULL
      WHERE youth_id = 'KAY348RN'
    `);

    // Show after
    console.log('\nAFTER:');
    const after = await pool.query(`
      SELECT youth_id, full_name, program_type, odk_token IS NOT NULL as has_odk
      FROM youth_participants WHERE youth_id = 'KAY348RN'
    `);
    console.log(after.rows[0]);

    console.log('\n✓ Regina moved to digitization program');

  } finally {
    pool.end();
  }
}

main();

/**
 * Check status of mobile mappers
 */
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    // Check Regina
    console.log('=== REGINA STATUS ===');
    const regina = await pool.query(`
      SELECT youth_id, full_name, program_type, odk_token IS NOT NULL as has_odk, odk_actor_id
      FROM youth_participants 
      WHERE youth_id = 'KAY348RN'
    `);
    console.log(regina.rows[0] || 'Not found');

    // Count mobile mappers
    console.log('\n=== MOBILE MAPPERS COUNT ===');
    const count = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN odk_token IS NOT NULL THEN 1 ELSE 0 END) as with_odk
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);
    console.log(count.rows[0]);

    // List all mobile mappers
    console.log('\n=== ALL MOBILE MAPPERS ===');
    const all = await pool.query(`
      SELECT youth_id, full_name, odk_token IS NOT NULL as has_odk
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
      ORDER BY youth_id
    `);
    all.rows.forEach((r, i) => {
      console.log(`${i+1}. ${r.youth_id} - ${r.full_name} ${r.has_odk ? '✓ ODK' : ''}`);
    });

  } finally {
    pool.end();
  }
}

main();

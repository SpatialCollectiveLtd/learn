const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  console.log('='.repeat(60));
  console.log('MOBILE MAPPING ODK REGISTRATION - FINAL SUMMARY');
  console.log('='.repeat(60));

  // Total count
  const count = await pool.query(`
    SELECT COUNT(*) as total FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = TRUE AND odk_token IS NOT NULL
  `);
  console.log(`\n✓ Total registered with ODK: ${count.rows[0].total}`);

  // List first 10
  const list = await pool.query(`
    SELECT youth_id, full_name, odk_actor_id 
    FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = TRUE AND odk_token IS NOT NULL
    ORDER BY youth_id LIMIT 10
  `);
  console.log('\nFirst 10 mappers:');
  list.rows.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.youth_id} - ${r.full_name} (Actor: ${r.odk_actor_id})`);
  });

  // Check deactivated
  const deactivated = await pool.query(`
    SELECT youth_id, full_name FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = FALSE
  `);
  if (deactivated.rows.length > 0) {
    console.log('\nDeactivated (removed from program):');
    deactivated.rows.forEach(r => console.log(`  - ${r.youth_id} - ${r.full_name}`));
  }

  // Check Regina
  const regina = await pool.query(`
    SELECT youth_id, full_name, program_type FROM youth_participants WHERE youth_id = 'KAY348RN'
  `);
  console.log('\nRegina status:');
  console.log(`  ${regina.rows[0].youth_id} - ${regina.rows[0].full_name} → ${regina.rows[0].program_type}`);

  pool.end();
}
main();

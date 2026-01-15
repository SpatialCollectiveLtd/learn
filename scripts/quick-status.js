const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  const registered = await pool.query(`
    SELECT COUNT(*) as count FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = TRUE AND odk_token IS NOT NULL
  `);
  console.log('Registered with ODK:', registered.rows[0].count);

  const pending = await pool.query(`
    SELECT COUNT(*) as count FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = TRUE AND odk_token IS NULL
  `);
  console.log('Pending registration:', pending.rows[0].count);

  // Show pending list
  if (parseInt(pending.rows[0].count) > 0) {
    console.log('\nPending mappers:');
    const list = await pool.query(`
      SELECT youth_id, full_name FROM youth_participants 
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE AND odk_token IS NULL
      ORDER BY youth_id
    `);
    list.rows.forEach((r, i) => console.log(`  ${i+1}. ${r.youth_id} - ${r.full_name}`));
  }

  pool.end();
}
main();

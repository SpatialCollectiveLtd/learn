const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  // People to remove from program
  const toRemove = ['KAY269JW', 'KAY1990MM', 'KAY2188EG', 'KAY1975NM'];

  console.log('Deactivating removed mappers...\n');
  
  for (const id of toRemove) {
    const result = await pool.query(
      'UPDATE youth_participants SET is_active = FALSE WHERE youth_id = $1 RETURNING youth_id, full_name',
      [id]
    );
    if (result.rows[0]) {
      console.log(`✓ Deactivated: ${result.rows[0].youth_id} - ${result.rows[0].full_name}`);
    } else {
      console.log(`- Not found: ${id}`);
    }
  }

  console.log('\nDone!');
  pool.end();
}
main();

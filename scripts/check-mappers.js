const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Check specific mapper
  const result = await pool.query(`
    SELECT youth_id, full_name, program_type, is_active 
    FROM youth_participants 
    WHERE youth_id = 'KAY1799DM'
  `);
  console.log('KAY1799DM:', result.rows);
  
  // Check program type breakdown
  const count = await pool.query(`
    SELECT program_type, is_active, COUNT(*) as count
    FROM youth_participants 
    GROUP BY program_type, is_active
    ORDER BY program_type
  `);
  console.log('\nProgram type breakdown:');
  console.table(count.rows);

  // Check mobile_mapping specifically
  const mobile = await pool.query(`
    SELECT COUNT(*) as count
    FROM youth_participants 
    WHERE program_type = 'mobile_mapping' AND is_active = TRUE
  `);
  console.log('\nActive mobile mappers:', mobile.rows[0].count);
  
  pool.end();
}
check();

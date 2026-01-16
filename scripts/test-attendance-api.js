const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSearch() {
  // Create a test token
  const token = jwt.sign(
    { staffId: 'SFEA1601T', role: 'trainer', fullName: 'Fred' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('Test token:', token.substring(0, 50) + '...');
  
  // Test the database query directly
  const query = 'KAY1799';
  const result = await pool.query(`
    SELECT 
      youth_id,
      full_name,
      id_number,
      phone_number,
      program_type
    FROM youth_participants
    WHERE youth_id ILIKE $1
      AND program_type = 'mobile_mapping'
      AND is_active = TRUE
    LIMIT 10
  `, [`%${query}%`]);
  
  console.log('\nDirect DB query for "KAY1799":');
  console.log(result.rows);
  
  // Now test via HTTP
  console.log('\nTesting API...');
  const response = await fetch(`http://localhost:3000/api/staff/attendance/search?q=${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log('API response:', JSON.stringify(data, null, 2));
  
  pool.end();
}

testSearch().catch(console.error);

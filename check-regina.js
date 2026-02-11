require('dotenv').config({ path: '.env.local' });
const { Database } = require('./src/app/api/_lib/database.js');

async function checkRegina() {
  try {
    const result = await Database.query(
      'SELECT youth_id, full_name, program_type, module_assignment, settlement FROM youth_participants WHERE youth_id = $1',
      ['KAY348RN']
    );
    
    if (result.rows.length > 0) {
      console.log('Regina Database Record:', JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('No record found for KAY348RN');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRegina();
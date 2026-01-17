// Check settlement config for KAY2333OO
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  try {
    // Check settlement work config
    const config = await sql`
      SELECT * FROM settlement_work_config 
      WHERE settlement = 'Kayole' AND program_type = 'digitization'
    `;
    console.log('Settlement Config:', JSON.stringify(config.rows, null, 2));
    
    // Check work days count for this user
    const count = await sql`
      SELECT COUNT(*) as total_days FROM youth_work_days 
      WHERE youth_id = 'KAY2333OO'
    `;
    console.log('\nWork days count:', count.rows[0].total_days);
    
    // Check if they've exceeded total_work_days
    if (config.rows.length > 0) {
      const totalWorkDays = config.rows[0].total_work_days || 20;
      const userDays = parseInt(count.rows[0].total_days);
      console.log(`Configured work days: ${totalWorkDays}`);
      console.log(`User has: ${userDays} days`);
      if (userDays >= totalWorkDays) {
        console.log('⚠️ User has completed their full work period!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

check();

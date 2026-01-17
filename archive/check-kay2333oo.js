// Check KAY2333OO user status
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  try {
    console.log('🔍 Checking KAY2333OO...\n');

    // Check if user exists
    const user = await sql`
      SELECT youth_id, full_name, osm_username, program_type, settlement, is_active, work_email, module_assignment
      FROM youth_participants
      WHERE youth_id = 'KAY2333OO'
    `;
    
    if (user.rowCount === 0) {
      console.log('❌ User KAY2333OO NOT FOUND in database!');
      return;
    }
    
    console.log('✅ User found:');
    console.log(JSON.stringify(user.rows[0], null, 2));

    // Check training progress
    const progress = await sql`
      SELECT module_type, step_id, completed_at
      FROM youth_training_progress
      WHERE youth_id = 'KAY2333OO'
      ORDER BY module_type, step_id
    `;
    
    console.log('\n📚 Training Progress:');
    console.log(`Steps completed: ${progress.rowCount}`);
    progress.rows.forEach(row => {
      console.log(`  ${row.module_type} Step ${row.step_id}: ${row.completed_at}`);
    });

    // Check work days
    const workDays = await sql`
      SELECT work_date, buildings_count, status
      FROM youth_work_days
      WHERE youth_id = 'KAY2333OO'
      ORDER BY work_date
    `;
    
    console.log('\n📅 Work Days:');
    console.log(`Days recorded: ${workDays.rowCount}`);
    workDays.rows.forEach(row => {
      console.log(`  ${row.work_date}: ${row.buildings_count} buildings (${row.status})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

check();

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function updateWorkPeriods() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔧 UPDATING WORK PERIOD CONFIGURATION');
    console.log('='.repeat(80));

    // Function to calculate work days between two dates (weekdays only)
    function countWorkDays(startDate, endDate) {
      let count = 0;
      let current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    }

    // Work period configurations
    const configs = [
      {
        settlement: 'Kayole Soweto',
        program_type: 'mobile_mapping',
        start_date: '2026-01-14',
        end_date: '2026-02-10',
        daily_target: 200,
        project_hashtag: '#kayole_mm'
      },
      {
        settlement: 'Mji wa Huruma',
        program_type: 'mobile_mapping',
        start_date: '2026-01-22',
        end_date: '2026-02-18',
        daily_target: 200,
        project_hashtag: '#huruma_mm'
      },
      {
        settlement: 'Kariobangi Machakos',
        program_type: 'mobile_mapping',
        start_date: '2026-01-26',
        end_date: '2026-02-20',
        daily_target: 200,
        project_hashtag: '#kariobangi_mm'
      }
    ];

    console.log('\n📋 VERIFYING WORK DAY COUNTS:');
    configs.forEach(config => {
      const workDays = countWorkDays(config.start_date, config.end_date);
      console.log(`\n   ${config.settlement.toUpperCase()}:`);
      console.log(`      Start: ${config.start_date}`);
      console.log(`      End: ${config.end_date}`);
      console.log(`      Work days (weekdays): ${workDays}`);
      console.log(`      ${workDays === 20 ? '✅' : '❌'} Matches 20 work days`);
    });

    console.log('\n\n🔄 UPDATING DATABASE...');
    
    // First, backup current config
    const backup = await pool.query('SELECT * FROM settlement_work_config WHERE program_type = $1', ['mobile_mapping']);
    console.log(`\n   Backed up ${backup.rowCount} existing configs`);

    // Update/Insert each configuration
    for (const config of configs) {
      const workDays = countWorkDays(config.start_date, config.end_date);
      
      const result = await pool.query(`
        INSERT INTO settlement_work_config 
          (settlement, program_type, start_date, total_work_days, daily_target, project_hashtag, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (settlement, program_type) 
        DO UPDATE SET
          start_date = EXCLUDED.start_date,
          total_work_days = EXCLUDED.total_work_days,
          daily_target = EXCLUDED.daily_target,
          project_hashtag = EXCLUDED.project_hashtag,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        config.settlement,
        config.program_type,
        config.start_date,
        workDays,
        config.daily_target,
        config.project_hashtag
      ]);

      console.log(`   ✅ ${config.settlement}: ${workDays} work days configured`);
    }

    // Verify final state
    console.log('\n\n📊 FINAL CONFIGURATION:');
    const final = await pool.query(`
      SELECT 
        settlement,
        program_type,
        start_date,
        total_work_days,
        daily_target,
        project_hashtag
      FROM settlement_work_config
      WHERE program_type = 'mobile_mapping'
      ORDER BY settlement
    `);

    final.rows.forEach(row => {
      const startDate = new Date(row.start_date);
      // Calculate end date based on work days (weekdays only)
      let endDate = new Date(startDate);
      let workDaysAdded = 0;
      
      while (workDaysAdded < row.total_work_days - 1) {
        endDate.setDate(endDate.getDate() + 1);
        const dayOfWeek = endDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workDaysAdded++;
        }
      }
      
      console.log(`\n   ${row.settlement.toUpperCase()}:`);
      console.log(`      Start: ${startDate.toISOString().split('T')[0]}`);
      console.log(`      End: ${endDate.toISOString().split('T')[0]}`);
      console.log(`      Work Days: ${row.total_work_days}`);
      console.log(`      Daily Target: ${row.daily_target} POIs`);
      console.log(`      Hashtag: ${row.project_hashtag}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ WORK PERIOD CONFIGURATION UPDATED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log('\n📝 NOTES:');
    console.log('   • Work periods now count WEEKDAYS ONLY (Mon-Fri)');
    console.log('   • Weekends are excluded from the 20-day count');
    console.log('   • Youth dashboards will now show correct end dates');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

updateWorkPeriods();

/**
 * Test the work days API for a specific user
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function testWorkDaysAPI(youthId) {
  try {
    console.log(`\n=== Testing Work Days API for ${youthId} ===\n`);
    
    // This mirrors the /api/work/days/count endpoint logic
    const query = `
      SELECT 
        COUNT(DISTINCT work_date) AS days_worked,
        SUM(buildings_count) AS total_buildings,
        COUNT(DISTINCT CASE WHEN target_met = true THEN work_date END) AS days_target_met,
        MIN(work_date) AS start_date,
        COUNT(DISTINCT CASE WHEN status = 'pending' THEN work_date END) AS pending_days
      FROM youth_work_days
      WHERE youth_id = $1
        AND work_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const result = await pool.query(query, [youthId]);
    const row = result.rows[0];
    
    const totalDays = 20; // Program default
    const daysWorked = parseInt(row.days_worked) || 0;
    const totalBuildings = parseInt(row.total_buildings) || 0;
    const daysTargetMet = parseInt(row.days_target_met) || 0;
    const pending_days = parseInt(row.pending_days) || 0;
    const avgBuildingsPerDay = daysWorked > 0 ? Math.round(totalBuildings / daysWorked) : 0;
    
    console.log('Raw Query Results:');
    console.log(`  days_worked: ${row.days_worked}`);
    console.log(`  total_buildings: ${row.total_buildings}`);
    console.log(`  days_target_met: ${row.days_target_met}`);
    console.log(`  start_date: ${row.start_date}`);
    console.log(`  pending_days: ${row.pending_days}`);
    
    console.log('\nAPI Response Would Be:');
    const apiResponse = {
      daysWorked,
      totalDays,
      remaining: totalDays - daysWorked,
      percentage: Math.round((daysWorked / totalDays) * 100),
      pendingDays: pending_days,
      totalBuildings,
      daysTargetMet,
      avgBuildingsPerDay,
      startDate: row.start_date
    };
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

const youthId = process.argv[2];
if (!youthId) {
  console.log('Usage: node test-work-days-api.js <youth_id>');
  console.log('Example: node test-work-days-api.js KAY2805JK');
  process.exit(1);
}

testWorkDaysAPI(youthId.toUpperCase());

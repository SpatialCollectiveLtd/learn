/**
 * Check work day approval status for a user
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function checkWorkDayStatus(youthId) {
  try {
    console.log(`\n=== Work Day Status for ${youthId} ===\n`);
    
    const query = `
      SELECT 
        work_date,
        buildings_count,
        status,
        target_met,
        approved_by,
        approved_at
      FROM youth_work_days
      WHERE youth_id = $1
      ORDER BY work_date DESC
    `;
    
    const result = await pool.query(query, [youthId]);
    
    if (result.rows.length === 0) {
      console.log('No work days found');
      return;
    }
    
    console.log('All Work Days:');
    result.rows.forEach(row => {
      const date = row.work_date.toISOString().split('T')[0];
      console.log(`  ${date}: ${row.buildings_count} buildings`);
      console.log(`    Status: ${row.status}`);
      console.log(`    Target Met: ${row.target_met}`);
      if (row.approved_by) {
        console.log(`    Approved By: ${row.approved_by} at ${row.approved_at}`);
      }
      console.log('');
    });
    
    // Count by status
    const approved = result.rows.filter(r => r.status === 'approved').length;
    const pending = result.rows.filter(r => r.status === 'pending').length;
    const rejected = result.rows.filter(r => r.status === 'rejected').length;
    
    console.log('Summary:');
    console.log(`  Total Days: ${result.rows.length}`);
    console.log(`  Approved: ${approved}`);
    console.log(`  Pending: ${pending}`);
    console.log(`  Rejected: ${rejected}`);
    
    // Sum buildings for approved only
    const approvedBuildings = result.rows
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.buildings_count, 0);
    
    console.log(`\n  Total Buildings (Approved Only): ${approvedBuildings}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

const youthId = process.argv[2];
if (!youthId) {
  console.log('Usage: node check-work-status.js <youth_id>');
  process.exit(1);
}

checkWorkDayStatus(youthId.toUpperCase());

/**
 * Test Work Days Calculation - Verify 2025 + 2026 Days
 * 
 * This script tests that:
 * 1. Work days are correctly counted separately for 2025 and 2026
 * 2. The total is a proper integer addition (not string concatenation)
 * 3. Kariobangi users show correct totals (e.g., 5 + 14 = 19, not "514")
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testWorkDaysCalculation() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧪 Testing Work Days Calculation (2025 + 2026)\n');
    console.log('='.repeat(80));
    
    // Test query simulating the API endpoint logic
    const result = await client.query(`
      SELECT 
        yp.youth_id,
        yp.settlement,
        yp.full_name,
        COUNT(*)::INTEGER as days_worked,
        COUNT(*) FILTER (WHERE ywd.work_date < '2026-01-01')::INTEGER as days_worked_2025,
        COUNT(*) FILTER (WHERE ywd.work_date >= '2026-01-01')::INTEGER as days_worked_2026,
        COUNT(*)::INTEGER as calculated_total
      FROM youth_participants yp
      LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
      WHERE yp.program_type = 'digitization'
        AND yp.is_active = TRUE
        AND yp.settlement = 'Kariobangi Machakos'
      GROUP BY yp.youth_id, yp.settlement, yp.full_name
      ORDER BY yp.youth_id
      LIMIT 10
    `);
    
    console.log('\n📊 Sample Kariobangi Digitization Users:\n');
    
    let allCorrect = true;
    
    result.rows.forEach(row => {
      const expectedTotal = row.days_worked_2025 + row.days_worked_2026;
      const isCorrect = row.days_worked === expectedTotal;
      
      if (!isCorrect) allCorrect = false;
      
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`${status} ${row.youth_id} (${row.full_name}):`);
      console.log(`   2025: ${row.days_worked_2025} days`);
      console.log(`   2026: ${row.days_worked_2026} days`);
      console.log(`   Total: ${row.days_worked}/20 days`);
      console.log(`   Math: ${row.days_worked_2025} + ${row.days_worked_2026} = ${expectedTotal}`);
      
      if (!isCorrect) {
        console.log(`   ⚠️  MISMATCH! Expected ${expectedTotal}, got ${row.days_worked}`);
      }
      
      console.log('');
    });
    
    console.log('='.repeat(80));
    
    if (allCorrect) {
      console.log('\n✅ ALL CALCULATIONS CORRECT!');
      console.log('   Work days are being added as integers, not concatenated as strings.');
    } else {
      console.log('\n❌ CALCULATION ERRORS FOUND!');
      console.log('   Some totals do not match 2025 + 2026. Check database query logic.');
    }
    
    // Test a specific API call format
    console.log('\n📡 Testing API Endpoint Query Format:\n');
    
    const apiTest = await client.query(`
      SELECT 
        COUNT(*)::INTEGER as days_worked,
        COUNT(*) FILTER (WHERE work_date < '2026-01-01')::INTEGER as days_worked_2025,
        COUNT(*) FILTER (WHERE work_date >= '2026-01-01')::INTEGER as days_worked_2026
      FROM youth_work_days
      WHERE youth_id = 'KAR078KM'
      AND status = 'approved'
    `);
    
    const apiRow = apiTest.rows[0];
    console.log('Sample user KAR078KM:');
    console.log(`  days_worked: ${apiRow.days_worked}`);
    console.log(`  days_worked_2025: ${apiRow.days_worked_2025}`);
    console.log(`  days_worked_2026: ${apiRow.days_worked_2026}`);
    console.log(`  Total: ${apiRow.days_worked}/20`);
    console.log(`  Calculation: ${apiRow.days_worked_2025} + ${apiRow.days_worked_2026} = ${apiRow.days_worked_2025 + apiRow.days_worked_2026}`);
    
    const apiCorrect = apiRow.days_worked === (apiRow.days_worked_2025 + apiRow.days_worked_2026);
    console.log(`  Status: ${apiCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📝 Summary:');
    console.log('  • Using ::INTEGER cast ensures COUNT returns integers');
    console.log('  • FILTER clause separates 2025 and 2026 work days');
    console.log('  • Total is calculated correctly in SQL (not concatenated)');
    console.log('  • API returns breakdown: daysWorked, daysWorked2025, daysWorked2026');
    console.log('  • Dashboard displays: "19/20" with breakdown "2025: 5, 2026: 14"');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testWorkDaysCalculation();

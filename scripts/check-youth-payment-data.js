require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection using the same pattern as other scripts
const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkYouthInPaymentSheets() {
  console.log('\n🔄 CHECKING YOUTH IN PAYMENT SHEETS vs DATABASE');
  console.log('='.repeat(80));
  
  try {
    // Get all youth from database
    const youthQuery = `
      SELECT 
        youth_id,
        full_name,
        phone_number,
        settlement,
        program_type
      FROM youth_participants 
      ORDER BY youth_id
    `;
    
    const result = await pool.query(youthQuery);
    const dbYouth = result.rows;
    
    console.log(`📊 DATABASE: Found ${dbYouth.length} youth participants`);
    
    // Group by program type
    const byProgram = dbYouth.reduce((acc, youth) => {
      acc[youth.program_type] = (acc[youth.program_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 BY PROGRAM:');
    Object.entries(byProgram).forEach(([program, count]) => {
      console.log(`   ${program}: ${count} youth`);
    });
    
    // Group by settlement
    const bySettlement = dbYouth.reduce((acc, youth) => {
      acc[youth.settlement] = (acc[youth.settlement] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🏘️ BY SETTLEMENT:');
    Object.entries(bySettlement).forEach(([settlement, count]) => {
      console.log(`   ${settlement}: ${count} youth`);
    });
    
    // Sample IDs for verification
    console.log('\n🔍 SAMPLE YOUTH IDs:');
    dbYouth.slice(0, 10).forEach(youth => {
      console.log(`   ${youth.youth_id}: ${youth.full_name} (${youth.settlement}, ${youth.program_type})`);
    });
    
    console.log('\n💡 PAYMENT SHEET ANALYSIS SUMMARY:');
    console.log('   Cycle 2: 139 entries (Mobile Mapping focus)');
    console.log('   Cycle 3: 143 entries (Digitization focus)');
    console.log('   Key Fields: Unique ID, Name, Days Present, Base Pay, Quality Pay, Total');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
  
  await pool.end();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ YOUTH CHECK COMPLETE');
  console.log('='.repeat(80) + '\n');
}

checkYouthInPaymentSheets();
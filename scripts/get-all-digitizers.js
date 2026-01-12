/**
 * Get all active digitizers with their OSM usernames
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

async function getAllDigitizers() {
  try {
    const query = `
      SELECT 
        youth_id, 
        full_name, 
        osm_username, 
        settlement,
        program_type,
        is_active
      FROM youth_participants 
      WHERE is_active = TRUE 
      ORDER BY settlement NULLS LAST, full_name
    `;
    
    const result = await pool.query(query);
    
    console.log('\n=== DPW2025 ACTIVE DIGITIZERS ===\n');
    
    let currentSettlement = null;
    result.rows.forEach((row, index) => {
      // Print settlement header when it changes
      if (row.settlement !== currentSettlement) {
        currentSettlement = row.settlement;
        console.log(`\n--- ${currentSettlement || 'No Settlement'} ---\n`);
      }
      
      console.log(`${index + 1}. ${row.full_name} (${row.youth_id})`);
      if (row.osm_username) {
        console.log(`   OSM Username: ${row.osm_username}`);
      } else {
        console.log(`   OSM Username: [Not Set]`);
      }
    });
    
    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Total Active Digitizers: ${result.rows.length}`);
    
    // Count by settlement
    const settlements = {};
    result.rows.forEach(row => {
      const settlement = row.settlement || 'No Settlement';
      settlements[settlement] = (settlements[settlement] || 0) + 1;
    });
    
    console.log('\nBy Settlement:');
    Object.entries(settlements).forEach(([settlement, count]) => {
      console.log(`  ${settlement}: ${count}`);
    });
    
    // Count with/without OSM usernames
    const withOSM = result.rows.filter(r => r.osm_username).length;
    const withoutOSM = result.rows.filter(r => !r.osm_username).length;
    
    console.log('\nOSM Username Status:');
    console.log(`  With OSM Username: ${withOSM}`);
    console.log(`  Without OSM Username: ${withoutOSM}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getAllDigitizers();

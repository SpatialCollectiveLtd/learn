const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getYouthList() {
  try {
    console.log('Fetching youth participants...\n');
    
    const result = await pool.query(`
      SELECT 
        youth_id,
        full_name,
        osm_username,
        settlement,
        module_assignment,
        is_active
      FROM youth_participants
      WHERE program_type = 'digitization' AND is_active = TRUE
      ORDER BY settlement, full_name;
    `);
    
    console.log(`Total Digitization Youth: ${result.rows.length}\n`);
    console.log('='.repeat(100));
    console.log('YOUTH ID\t\tFULL NAME\t\t\tOSM USERNAME\t\tSETTLEMENT\t\tROLE');
    console.log('='.repeat(100));
    
    result.rows.forEach((youth, index) => {
      const osmUsername = youth.osm_username || 'NOT SET';
      const settlement = youth.settlement || 'N/A';
      const role = youth.module_assignment || 'N/A';
      
      console.log(
        `${youth.youth_id.padEnd(16)}\t${youth.full_name.padEnd(24)}\t${osmUsername.padEnd(20)}\t${settlement.padEnd(20)}\t${role}`
      );
    });
    
    console.log('='.repeat(100));
    
    // Count by settlement
    const settlementCounts = result.rows.reduce((acc, youth) => {
      const settlement = youth.settlement || 'Unknown';
      acc[settlement] = (acc[settlement] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nBreakdown by Settlement:');
    Object.entries(settlementCounts).forEach(([settlement, count]) => {
      console.log(`  ${settlement}: ${count} youths`);
    });
    
    // Count OSM usernames set
    const withOsmUsername = result.rows.filter(y => y.osm_username).length;
    const withoutOsmUsername = result.rows.length - withOsmUsername;
    
    console.log('\nOSM Username Status:');
    console.log(`  With OSM Username: ${withOsmUsername}`);
    console.log(`  Without OSM Username: ${withoutOsmUsername}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error fetching youth list:', err.message);
    console.error(err);
    process.exit(1);
  }
}

getYouthList();

const { sql } = require('@vercel/postgres');

async function getDigitizersPerSettlement() {
  try {
    console.log('\n=== Digitizers per Settlement ===\n');
    
    // Get count by settlement for digitization program
    const result = await sql`
      SELECT 
        settlement,
        COUNT(*) as total_youth,
        COUNT(CASE WHEN osm_username IS NOT NULL THEN 1 END) as with_osm_username,
        COUNT(CASE WHEN osm_username IS NULL THEN 1 END) as without_osm_username
      FROM youth_participants 
      WHERE program_type = 'digitization'
      GROUP BY settlement
      ORDER BY settlement
    `;
    
    console.log('Settlement Breakdown:\n');
    
    let totalYouth = 0;
    let totalWithOsm = 0;
    let totalWithoutOsm = 0;
    
    result.rows.forEach(row => {
      console.log(`${row.settlement || 'Unknown'}:`);
      console.log(`  Total Youth: ${row.total_youth}`);
      console.log(`  With OSM Username: ${row.with_osm_username}`);
      console.log(`  Without OSM Username: ${row.without_osm_username}`);
      console.log('');
      
      totalYouth += parseInt(row.total_youth);
      totalWithOsm += parseInt(row.with_osm_username);
      totalWithoutOsm += parseInt(row.without_osm_username);
    });
    
    console.log('=== Overall Summary ===\n');
    console.log(`Total Digitizers: ${totalYouth}`);
    console.log(`With OSM Username: ${totalWithOsm} (${Math.round(totalWithOsm/totalYouth*100)}%)`);
    console.log(`Without OSM Username: ${totalWithoutOsm} (${Math.round(totalWithoutOsm/totalYouth*100)}%)\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getDigitizersPerSettlement();

/**
 * Get Full Status of Youth Participants and ODK Configuration
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getFullStatus() {
  try {
    console.log('='.repeat(70));
    console.log('SPATIAL COLLECTIVE YOUTH PARTICIPANTS STATUS');
    console.log('='.repeat(70));
    
    // Get overall stats
    const overallStats = await pool.query(`
      SELECT 
        program_type,
        settlement,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE odk_token IS NOT NULL) as odk_configured
      FROM youth_participants
      WHERE is_active = TRUE
      GROUP BY program_type, settlement
      ORDER BY settlement, program_type
    `);
    
    console.log('\n📊 YOUTH BY SETTLEMENT AND PROGRAM:\n');
    overallStats.rows.forEach(row => {
      const odkInfo = row.odk_configured > 0 ? ` (ODK: ${row.odk_configured})` : '';
      console.log(`  ${row.settlement || '(no settlement)'} | ${row.program_type}: ${row.total}${odkInfo}`);
    });
    
    // Get mobile mappers ODK status
    const mobileMappers = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE odk_token IS NOT NULL) as configured,
        COUNT(*) FILTER (WHERE odk_token IS NULL) as pending
      FROM youth_participants
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `);
    
    console.log('\n📱 MOBILE MAPPER ODK STATUS:');
    console.log(`  Total Mobile Mappers: ${mobileMappers.rows[0].total}`);
    console.log(`  ✓ ODK Configured: ${mobileMappers.rows[0].configured}`);
    console.log(`  ⏳ Pending: ${mobileMappers.rows[0].pending}`);
    
    // List pending mobile mappers
    const pendingMappers = await pool.query(`
      SELECT youth_id, full_name, settlement
      FROM youth_participants
      WHERE program_type = 'mobile_mapping' 
        AND is_active = TRUE 
        AND odk_token IS NULL
      ORDER BY settlement, full_name
    `);
    
    if (pendingMappers.rows.length > 0) {
      console.log('\n⏳ PENDING ODK REGISTRATION:\n');
      pendingMappers.rows.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.youth_id} - ${r.full_name} (${r.settlement})`);
      });
    }
    
    // List Mji wa Huruma specifically
    console.log('\n' + '='.repeat(70));
    console.log('MJI WA HURUMA YOUTH DETAILS');
    console.log('='.repeat(70));
    
    const hurumaYouth = await pool.query(`
      SELECT youth_id, full_name, program_type, osm_username, odk_token
      FROM youth_participants
      WHERE settlement LIKE '%Huruma%'
      ORDER BY full_name
    `);
    
    console.log(`\nTotal: ${hurumaYouth.rows.length} youth\n`);
    hurumaYouth.rows.forEach((r, i) => {
      const osm = r.osm_username ? ` [OSM: ${r.osm_username}]` : ' [No OSM]';
      const odk = r.odk_token ? ' ✓ODK' : '';
      console.log(`  ${i + 1}. ${r.youth_id} - ${r.full_name} (${r.program_type})${osm}${odk}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

getFullStatus();

/**
 * Check Mji wa Huruma Youth in Database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkHurumaYouth() {
  try {
    console.log('='.repeat(60));
    console.log('MJI WA HURUMA YOUTH STATUS');
    console.log('='.repeat(60));
    
    const result = await pool.query(`
      SELECT youth_id, full_name, program_type, settlement, osm_username, is_active, created_at 
      FROM youth_participants 
      WHERE settlement LIKE '%Huruma%' OR settlement LIKE '%huruma%'
      ORDER BY full_name
    `);
    
    console.log('\nYouth in database:\n');
    if (result.rows.length === 0) {
      console.log('❌ No Mji wa Huruma youth found in database!');
    } else {
      result.rows.forEach((row, i) => {
        const status = row.is_active ? '✓' : '✗';
        const osm = row.osm_username ? ` [OSM: ${row.osm_username}]` : '';
        console.log(`${i + 1}. ${status} ${row.youth_id} - ${row.full_name} (${row.program_type})${osm}`);
      });
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total Mji wa Huruma youth: ${result.rows.length}`);
    
    // Get settlements breakdown
    const settlements = await pool.query(`
      SELECT settlement, COUNT(*) as count 
      FROM youth_participants 
      WHERE is_active = true 
      GROUP BY settlement 
      ORDER BY count DESC
    `);
    
    console.log('\n' + '='.repeat(60));
    console.log('ALL SETTLEMENTS BREAKDOWN');
    console.log('='.repeat(60));
    settlements.rows.forEach(row => {
      console.log(`  ${row.settlement || '(no settlement)'}: ${row.count} youth`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkHurumaYouth();

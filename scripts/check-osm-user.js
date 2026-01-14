/**
 * Check user OSM activity
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const pool = new Pool({ 
  connectionString: process.env.NEON_DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function checkUser() {
  console.log('Checking database for KAY2333OO...\n');
  
  const result = await pool.query(
    'SELECT youth_id, full_name, osm_username, settlement, program_type FROM youth_participants WHERE youth_id = $1',
    ['KAY2333OO']
  );
  
  if (result.rows.length === 0) {
    console.log('User not found');
    await pool.end();
    return;
  }
  
  const user = result.rows[0];
  console.log('User found:');
  console.log('  Youth ID:', user.youth_id);
  console.log('  Name:', user.full_name);
  console.log('  OSM Username:', user.osm_username);
  console.log('  Settlement:', user.settlement);
  console.log('  Module:', user.program_type);
  
  // Check their work stats
  console.log('\n\nChecking OSM stats in database...');
  const stats = await pool.query(
    'SELECT date, buildings_mapped FROM youth_osm_stats WHERE youth_id = $1 ORDER BY date DESC LIMIT 10',
    ['KAY2333OO']
  );
  
  console.log('\nRecent OSM Stats (from DB):');
  for (const row of stats.rows) {
    console.log('  ', row.date.toISOString().split('T')[0], ':', row.buildings_mapped, 'buildings');
  }
  
  // Check work days
  console.log('\n\nChecking work days...');
  const days = await pool.query(
    'SELECT work_date, buildings_count, status FROM youth_work_days WHERE youth_id = $1 ORDER BY work_date DESC LIMIT 10',
    ['KAY2333OO']
  );
  
  console.log('\nRecent Work Days:');
  for (const row of days.rows) {
    console.log('  ', row.work_date.toISOString().split('T')[0], ':', row.buildings_count, 'buildings (', row.status, ')');
  }
  
  // Check public OSM API for this user
  console.log('\n\n==========================================');
  console.log('Checking Public OSM API for:', user.osm_username);
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  try {
    const response = await axios.get('https://api.openstreetmap.org/api/0.6/changesets', { 
      params: {
        display_name: user.osm_username,
        time: thirtyDaysAgo.toISOString() + ',' + now.toISOString(),
        closed: 'true'
      },
      timeout: 30000,
      headers: { 'User-Agent': 'SC-Training-Test/1.0' }
    });
    
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed = parser.parse(response.data);
    
    const changesetsData = parsed.osm?.changeset;
    if (!changesetsData) {
      console.log('\n❌ No changesets found on PUBLIC OSM in last 30 days');
      console.log('\n⚠️  This suggests the user is uploading to your PRIVATE OSM server');
      console.log('   (osm.spatialcollective.co.ke) instead of public OSM.');
    } else {
      const changesets = Array.isArray(changesetsData) ? changesetsData : [changesetsData];
      console.log('\n✅ Found', changesets.length, 'changesets on public OSM');
      
      if (changesets.length > 0) {
        console.log('Most recent:', changesets[0].created_at);
      }
    }
  } catch (error) {
    console.log('Error checking OSM:', error.message);
  }
  
  await pool.end();
}

checkUser();

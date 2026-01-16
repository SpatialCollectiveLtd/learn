// Test OSM stats fetching for KAY2333OO
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';
const username = 'Oketch ochieng';

async function test() {
  try {
    console.log('🔍 Testing OSM API for:', username);
    
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0 - 3, 0, 0, 0); // UTC-3 for EAT midnight
    
    const startTimeISO = startOfDay.toISOString();
    const endTimeISO = now.toISOString();
    
    console.log(`\n📅 Date range: ${startTimeISO} to ${endTimeISO}`);
    
    // Fetch changesets
    const url = `${OSM_API_BASE}/changesets`;
    const params = {
      display_name: username,
      time: `${startTimeISO},${endTimeISO}`,
      closed: 'true',
    };
    
    console.log('\n🌐 Fetching changesets...');
    console.log('URL:', url);
    console.log('Params:', params);
    
    const response = await axios.get(url, {
      params,
      timeout: 30000,
      headers: { 
        'User-Agent': 'SC-Training-Platform/1.0',
        'Accept': 'text/xml',
      },
    });
    
    console.log('\n✅ Response status:', response.status);
    console.log('Response data (first 500 chars):', response.data.substring(0, 500));
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const parsed = parser.parse(response.data);
    const changesetsData = parsed.osm?.changeset;
    
    if (!changesetsData) {
      console.log('\n📊 No changesets found for today');
      return;
    }
    
    const changesets = Array.isArray(changesetsData) ? changesetsData : [changesetsData];
    console.log(`\n📊 Found ${changesets.length} changesets`);
    
    // Show changeset details
    changesets.forEach((cs, i) => {
      console.log(`  ${i + 1}. ID: ${cs.id}, Changes: ${cs.changes_count}, Comment: ${cs.tag?.find?.(t => t.k === 'comment')?.v || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

test();

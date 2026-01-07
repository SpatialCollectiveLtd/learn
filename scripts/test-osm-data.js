const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';
const USER_AGENT = 'SC-Training-Platform/1.0 (contact@spatialcollective.co.ke)';
const osmUsername = 'jeremiah_james';
const projectHashtag = '#DPW2025';

async function testOSMData() {
  console.log(`\n🔍 Testing OSM data for user: ${osmUsername}`);
  console.log('='.repeat(80));
  
  try {
    // Calculate today's date range (EAT timezone UTC+3)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0 - 3, 0, 0, 0); // UTC+3 timezone
    const startTimeISO = startOfDay.toISOString();
    const endTimeISO = now.toISOString();
    
    console.log(`\n📅 Date Range:`);
    console.log(`Start: ${startTimeISO}`);
    console.log(`End: ${endTimeISO}`);
    
    // Fetch changesets
    const url = `${OSM_API_BASE}/changesets`;
    const params = {
      display_name: osmUsername,
      time: `${startTimeISO},${endTimeISO}`,
      closed: 'true',
    };
    
    console.log(`\n📡 Fetching changesets from OSM API...`);
    console.log(`URL: ${url}`);
    console.log(`Params:`, params);
    
    const response = await axios.get(url, {
      params,
      timeout: 30000,
      headers: { 'User-Agent': USER_AGENT },
    });
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const parsed = parser.parse(response.data);
    const changesetsData = parsed.osm?.changeset;
    
    if (!changesetsData) {
      console.log('\n❌ No changesets found for today');
      return;
    }
    
    const changesets = Array.isArray(changesetsData) ? changesetsData : [changesetsData];
    
    console.log(`\n✅ Found ${changesets.length} total changesets\n`);
    
    // Display changeset details
    for (const cs of changesets) {
      const tags = parseChangesetTags(cs.tag);
      const comment = tags.comment || 'No comment';
      const hasHashtag = comment.toLowerCase().includes(projectHashtag.toLowerCase());
      
      console.log(`Changeset #${cs.id}`);
      console.log(`  Created: ${cs.created_at}`);
      console.log(`  Closed: ${cs.closed_at}`);
      console.log(`  Changes: ${cs.changes_count}`);
      console.log(`  Comment: ${comment}`);
      console.log(`  Has ${projectHashtag}: ${hasHashtag ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      if (hasHashtag) {
        // Try to count buildings in this changeset
        try {
          console.log(`  📊 Downloading changeset data to count buildings...`);
          const changeUrl = `${OSM_API_BASE}/changeset/${cs.id}/download`;
          const changeResponse = await axios.get(changeUrl, {
            timeout: 30000,
            headers: { 'User-Agent': USER_AGENT },
          });
          
          const changeParsed = parser.parse(changeResponse.data);
          
          const createWays = changeParsed.osmChange?.create?.way || [];
          const modifyWays = changeParsed.osmChange?.modify?.way || [];
          
          const allWays = [
            ...(Array.isArray(createWays) ? createWays : createWays ? [createWays] : []),
            ...(Array.isArray(modifyWays) ? modifyWays : modifyWays ? [modifyWays] : [])
          ];
          
          let buildingCount = 0;
          for (const way of allWays) {
            if (hasBuildingTag(way.tag)) {
              buildingCount++;
            }
          }
          
          console.log(`  🏢 Buildings found: ${buildingCount}\n`);
        } catch (err) {
          console.log(`  ❌ Error counting buildings: ${err.message}\n`);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

function parseChangesetTags(tagData) {
  if (!tagData) return {};
  
  const tags = {};
  const tagArray = Array.isArray(tagData) ? tagData : [tagData];
  
  for (const tag of tagArray) {
    if (tag.k && tag.v !== undefined) {
      tags[tag.k] = tag.v;
    }
  }
  
  return tags;
}

function hasBuildingTag(tagData) {
  if (!tagData) return false;
  
  const tags = parseChangesetTags(tagData);
  
  return tags.building !== undefined && tags.building !== 'no';
}

testOSMData();

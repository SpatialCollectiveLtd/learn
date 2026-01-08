// Test building counting for Oketch's changeset
// Changeset: 176978356 - Should have many buildings based on web UI

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

async function testChangesetCounting() {
  const changesetId = 176978356;
  const url = `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;
  
  console.log(`\n=== Testing Changeset #${changesetId} ===\n`);
  console.log(`Fetching from: ${url}\n`);
  
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'SC-Training-Platform/1.0' },
    });
    
    console.log('✅ Successfully fetched changeset data\n');
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        return ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name);
      },
    });
    
    const parsed = parser.parse(response.data);
    const osmChange = parsed?.osmChange || {};
    
    console.log('Parsed structure:');
    console.log('- Has osmChange:', !!osmChange);
    console.log('- Has create:', !!osmChange.create);
    console.log('- Has modify:', !!osmChange.modify);
    console.log('- create is array:', Array.isArray(osmChange.create));
    console.log('- modify is array:', Array.isArray(osmChange.modify));
    if (Array.isArray(osmChange.create)) {
      console.log('- create sections:', osmChange.create.length);
    }
    if (Array.isArray(osmChange.modify)) {
      console.log('- modify sections:', osmChange.modify.length);
    }
    console.log('');
    
    // Count buildings using the FIXED logic
    let buildingCount = 0;
    let totalWays = 0;
    let totalNodes = 0;
    let waysWithBuilding = 0;
    
    // OSM API returns each element in its own <create> or <modify> tag
    const sections = [];
    if (osmChange.create) {
      sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
    }
    if (osmChange.modify) {
      sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
    }
    
    console.log(`Total sections to process: ${sections.length}\n`);
    
    for (const section of sections) {
      if (!section) continue;
      
      // Check ways
      const ways = section.way || [];
      totalWays += ways.length;
      
      for (const way of ways) {
        if (hasBuildingTag(way.tag)) {
          buildingCount++;
          waysWithBuilding++;
        }
      }
      
      // Check nodes
      const nodes = section.node || [];
      totalNodes += nodes.length;
      
      for (const node of nodes) {
        if (hasBuildingTag(node.tag)) {
          buildingCount++;
        }
      }
    }
    
    console.log('\n=== RESULTS ===');
    console.log(`Total ways: ${totalWays}`);
    console.log(`Total nodes: ${totalNodes}`);
    console.log(`Ways with building tag: ${waysWithBuilding}`);
    console.log(`TOTAL BUILDINGS COUNTED: ${buildingCount}`);
    console.log('');
    
    // Sample some building ways to verify
    if (osmChange.create?.way) {
      console.log('\n=== Sample Building Ways ===');
      let sampled = 0;
      for (const way of osmChange.create.way) {
        if (hasBuildingTag(way.tag) && sampled < 5) {
          console.log(`Way ${way.id}: ${JSON.stringify(way.tag.find(t => t.k === 'building'))}`);
          sampled++;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.substring(0, 500));
    }
  }
}

function hasBuildingTag(tagData) {
  if (!tagData) return false;
  
  const tags = Array.isArray(tagData) ? tagData : [tagData];
  
  return tags.some((tag) => {
    const key = tag.k?.toLowerCase() || '';
    if (key === 'building') return true;
    
    const typos = [
      'biulding', 'buiding', 'buidling', 'buliding', 
      'builidng', 'buildnig', 'buidlign', 'buliding',
    ];
    
    return typos.includes(key);
  });
}

testChangesetCounting().catch(console.error);

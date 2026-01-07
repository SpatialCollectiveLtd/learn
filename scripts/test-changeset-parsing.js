const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

const changesetId = 176931170;

async function testChangesetParsing() {
  console.log(`\n🔍 Testing Changeset Building Count`);
  console.log(`Changeset ID: ${changesetId}\n`);
  console.log('='.repeat(80));
  
  try {
    const url = `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;
    console.log(`Fetching: ${url}\n`);
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'SC-Training-Platform/1.0' },
    });
    
    console.log(`✅ Got response, parsing XML...\n`);
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        return ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name);
      },
    });
    
    const parsed = parser.parse(response.data);
    
    console.log('📦 Parsed structure:');
    console.log(JSON.stringify(Object.keys(parsed), null, 2));
    
    if (parsed.osmChange) {
      console.log('\nosmChange keys:');
      console.log(JSON.stringify(Object.keys(parsed.osmChange), null, 2));
      
      console.log('\n🔍 Inspecting create section:');
      if (parsed.osmChange.create) {
        console.log('  create keys:', JSON.stringify(Object.keys(parsed.osmChange.create), null, 2));
        console.log('  Has way?:', !!parsed.osmChange.create.way);
        console.log('  Has node?:', !!parsed.osmChange.create.node);
      }
      
      console.log('\n🔍 Inspecting modify section:');
      if (parsed.osmChange.modify) {
        console.log('  modify keys:', JSON.stringify(Object.keys(parsed.osmChange.modify), null, 2));
        console.log('  Has way?:', !!parsed.osmChange.modify.way);
        console.log('  Has node?:', !!parsed.osmChange.modify.node);
      }
    }
    
    const createSection = parsed.osmChange?.create;
    const createWays = [];
    if (createSection) {
      Object.keys(createSection).forEach(key => {
        const item = createSection[key];
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if (item.id && item.nd) {
            createWays.push(item);
          }
        }
      });
    }
    
    const modifySection = parsed.osmChange?.modify;
    const modifyWays = [];
    if (modifySection) {
      Object.keys(modifySection).forEach(key => {
        const item = modifySection[key];
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if (item.id && item.nd) {
            modifyWays.push(item);
          }
        }
      });
    }
    
    const allWays = [...createWays, ...modifyWays];
    
    console.log(`  Total ways: ${allWays.length}\n`);
    
    let buildingCount = 0;
    let firstBuilding = null;
    
    for (const way of allWays) {
      if (hasBuildingTag(way.tag)) {
        buildingCount++;
        if (!firstBuilding) {
          firstBuilding = way;
        }
      }
    }
    
    console.log(`🏢 Buildings counted: ${buildingCount}\n`);
    
    if (firstBuilding) {
      console.log('Sample building way:');
      console.log(`  ID: ${firstBuilding.id}`);
      console.log(`  Tags:`, JSON.stringify(firstBuilding.tag, null, 2));
    }
    
    if (buildingCount === 0 && allWays.length > 0) {
      console.log('\n⚠️  WARNING: Found ways but no buildings!');
      console.log('\nFirst way sample:');
      const firstWay = allWays[0];
      console.log(`  ID: ${firstWay.id}`);
      console.log(`  Has tag property: ${!!firstWay.tag}`);
      console.log(`  Tag type: ${typeof firstWay.tag}`);
      console.log(`  Tags:`, JSON.stringify(firstWay.tag, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

function hasBuildingTag(tagData) {
  if (!tagData) {
    return false;
  }
  
  const tags = Array.isArray(tagData) ? tagData : [tagData];
  
  const hasBuilding = tags.some((tag) => tag.k === 'building');
  
  return hasBuilding;
}

testChangesetParsing();

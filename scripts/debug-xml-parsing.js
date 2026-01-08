// Debug XML parsing for Oketch's changeset
// Check raw XML structure

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

async function debugXMLParsing() {
  const changesetId = 176978356;
  const url = `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;
  
  console.log(`\n=== Debugging XML Parsing for Changeset #${changesetId} ===\n`);
  
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 'User-Agent': 'SC-Training-Platform/1.0' },
    });
    
    // Save raw XML to file for inspection
    fs.writeFileSync('changeset-176978356-raw.xml', response.data);
    console.log('✅ Saved raw XML to changeset-176978356-raw.xml\n');
    
    // Try different parser configurations
    console.log('=== Test 1: Current parser config (with isArray) ===');
    const parser1 = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name, jpath) => {
        return ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name);
      },
    });
    
    const parsed1 = parser1.parse(response.data);
    console.log('create.way count:', parsed1?.osmChange?.create?.way?.length || 0);
    console.log('modify.way count:', parsed1?.osmChange?.modify?.way?.length || 0);
    console.log('');
    
    console.log('=== Test 2: Default parser (no isArray) ===');
    const parser2 = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    
    const parsed2 = parser2.parse(response.data);
    console.log('create.way type:', typeof parsed2?.osmChange?.create?.way);
    console.log('create.way is array:', Array.isArray(parsed2?.osmChange?.create?.way));
    if (parsed2?.osmChange?.create?.way) {
      console.log('create.way keys:', Object.keys(parsed2.osmChange.create.way).slice(0, 10));
    }
    console.log('');
    
    console.log('=== Test 3: Preserve order parser ===');
    const parser3 = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      preserveOrder: false,
      alwaysCreateTextNode: false,
    });
    
    const parsed3 = parser3.parse(response.data);
    console.log('osmChange type:', typeof parsed3?.osmChange);
    console.log('osmChange keys:', Object.keys(parsed3?.osmChange || {}));
    console.log('');
    
    // Check first few lines of XML
    console.log('=== First 1000 chars of XML ===');
    console.log(response.data.substring(0, 1000));
    console.log('...\n');
    
    // Count actual occurrences of <way in XML
    const wayMatches = response.data.match(/<way /g);
    console.log(`Raw XML contains ${wayMatches?.length || 0} <way> tags`);
    
    const buildingMatches = response.data.match(/k="building"/g);
    console.log(`Raw XML contains ${buildingMatches?.length || 0} building tags`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugXMLParsing().catch(console.error);

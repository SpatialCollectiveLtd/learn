// Test the fixed building counting logic
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';

async function testCountingLogic() {
  try {
    const changesetId = 176975712; // Brian's changeset
    const url = `${OSM_API_BASE}/changeset/${changesetId}/download`;

    console.log('🔍 Testing fixed counting logic on changeset #176975712...\n');

    const response = await axios.get(url, {
      timeout: 30000,
      headers: { 
        'User-Agent': 'SC-Training-Platform/1.0',
        'Accept': 'text/xml'
      },
    });

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name) => ['node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name),
    });

    const parsed = parser.parse(response.data);
    const osmChange = parsed?.osmChange || {};

    console.log('osmChange structure:', Object.keys(osmChange));

    let totalBuildings = 0;
    const typos = ['biulding', 'buiding', 'buidling', 'buliding', 'builidng', 'buildnig'];

    function hasBuildingTag(tagData) {
      if (!tagData) return false;
      const tags = Array.isArray(tagData) ? tagData : [tagData];
      return tags.some(tag => {
        const key = tag.k?.toLowerCase() || '';
        return key === 'building' || typos.includes(key);
      });
    }

    // Check all modification types
    for (const modType of ['create', 'modify', 'delete']) {
      const section = osmChange[modType];
      if (!section) {
        console.log(`  ${modType}: not present`);
        continue;
      }

      console.log(`\n📦 ${modType} section:`);
      
      // Check ways
      const ways = section.way || [];
      let buildingsInWays = 0;
      for (const way of ways) {
        if (hasBuildingTag(way.tag)) {
          buildingsInWays++;
        }
      }
      console.log(`  Ways with building tag: ${buildingsInWays} / ${ways.length} total ways`);
      totalBuildings += buildingsInWays;

      // Check nodes
      const nodes = section.node || [];
      let buildingsInNodes = 0;
      for (const node of nodes) {
        if (hasBuildingTag(node.tag)) {
          buildingsInNodes++;
        }
      }
      if (buildingsInNodes > 0) {
        console.log(`  Nodes with building tag: ${buildingsInNodes}`);
      }
      totalBuildings += buildingsInNodes;

      // Check relations
      const relations = section.relation || [];
      let buildingsInRelations = 0;
      for (const relation of relations) {
        if (hasBuildingTag(relation.tag)) {
          buildingsInRelations++;
        }
      }
      if (buildingsInRelations > 0) {
        console.log(`  Relations with building tag: ${buildingsInRelations}`);
      }
      totalBuildings += buildingsInRelations;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 COUNTING RESULT');
    console.log('='.repeat(80));
    console.log(`Total buildings counted: ${totalBuildings}`);
    console.log(`Expected (user counted): 136`);
    console.log(`Match: ${totalBuildings === 136 ? '✅ YES' : '❌ NO (difference: ' + (totalBuildings - 136) + ')'}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCountingLogic();

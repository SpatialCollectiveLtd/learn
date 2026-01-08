// Test OSM API fetch for Brian Karani
import dotenv from 'dotenv';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

dotenv.config({ path: '.env.local' });

const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';

async function testBrianKaraniOSM() {
  try {
    // Get today's date range
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0 - 3, 0, 0, 0); // EAT is UTC+3
    
    const startTimeISO = startOfDay.toISOString();
    const endTimeISO = now.toISOString();

    console.log('🔍 Fetching changesets for BrianKarani');
    console.log(`Time range: ${startTimeISO} to ${endTimeISO}\n`);

    // Fetch changesets
    const url = `${OSM_API_BASE}/changesets`;
    const params = {
      display_name: 'BrianKarani',
      time: `${startTimeISO},${endTimeISO}`,
      closed: 'true',
    };

    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0',
        'Accept': 'text/xml',
      },
      timeout: 30000,
    });

    console.log(`✅ Response status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}\n`);

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '_text',
      parseAttributeValue: true,
      isArray: (name) => ['changeset', 'node', 'way', 'relation', 'tag'].includes(name),
    });

    const parsed = parser.parse(response.data);
    const changesets = parsed?.osm?.changeset || [];

    console.log(`📊 Found ${changesets.length} changesets\n`);

    // Filter by #DPW2025 hashtag
    const projectChangesets = changesets.filter(cs => {
      const comment = cs.tag?.find(t => t.k === 'comment')?.v || '';
      return comment.toLowerCase().includes('#dpw2025');
    });

    console.log(`✅ ${projectChangesets.length} changesets match #DPW2025 hashtag\n`);

    if (projectChangesets.length > 0) {
      console.log('Recent changesets:');
      for (const cs of projectChangesets.slice(0, 5)) {
        const comment = cs.tag?.find(t => t.k === 'comment')?.v || 'No comment';
        const created = cs.tag?.find(t => t.k === 'created_by')?.v || 'Unknown';
        console.log(`  Changeset #${cs.id}: ${cs.changes_count} changes`);
        console.log(`    Comment: ${comment}`);
        console.log(`    Created by: ${created}`);
        console.log(`    Time: ${cs.created_at}`);
        console.log('');
      }

      // Now fetch detailed changeset data to count buildings
      console.log('🔍 Analyzing changesets for building tags...\n');
      
      let totalBuildings = 0;
      const typos = ['biulding', 'buiding', 'buidling', 'buliding', 'buidilng'];

      for (const cs of projectChangesets) {
        const csUrl = `${OSM_API_BASE}/changeset/${cs.id}/download`;
        
        try {
          const csResponse = await axios.get(csUrl, {
            headers: {
              'User-Agent': 'SC-Training-Platform/1.0',
              'Accept': 'text/xml',
            },
            timeout: 30000,
          });

          const csParsed = parser.parse(csResponse.data);
          const osmChange = csParsed?.osmChange || {};
          
          let buildingCount = 0;

          // Check all modification types
          for (const modType of ['create', 'modify', 'delete']) {
            const elements = osmChange[modType];
            if (!elements) continue;

            // Check nodes, ways, relations
            for (const elementType of ['node', 'way', 'relation']) {
              const items = Array.isArray(elements[elementType]) ? elements[elementType] : 
                            elements[elementType] ? [elements[elementType]] : [];
              
              for (const item of items) {
                if (!item.tag) continue;
                
                const tags = Array.isArray(item.tag) ? item.tag : [item.tag];
                
                // Check for building tag or typos
                const hasBuilding = tags.some(tag => 
                  tag.k === 'building' || typos.includes(tag.k)
                );
                
                if (hasBuilding) {
                  buildingCount++;
                }
              }
            }
          }

          totalBuildings += buildingCount;
          console.log(`  Changeset #${cs.id}: ${buildingCount} buildings`);

        } catch (err) {
          console.error(`  ❌ Error fetching changeset #${cs.id}:`, err.message);
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`\n📊 Total buildings counted: ${totalBuildings}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.substring(0, 500));
    }
  }
}

testBrianKaraniOSM();

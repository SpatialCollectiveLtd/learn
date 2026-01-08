// Debug script to understand how buildings are counted
// Compare working youth vs Brian's changeset
import dotenv from 'dotenv';
import { Client } from 'pg';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';

async function debugBuildingCount() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get a youth with correct building counts (e.g., Doreen with 1328 buildings)
    console.log('🔍 Checking working example - Doreen Vutiti (1328 buildings)...\n');
    
    const doreenResult = await client.query(`
      SELECT youth_id, osm_username, full_name
      FROM youth_participants
      WHERE full_name ILIKE '%Doreen%Vutiti%'
      LIMIT 1
    `);

    if (doreenResult.rows.length > 0) {
      const doreen = doreenResult.rows[0];
      console.log(`Found: ${doreen.full_name} (${doreen.osm_username})`);
      
      // Get one of her recent changesets
      const statsResult = await client.query(`
        SELECT last_changeset_id, buildings_mapped, date
        FROM youth_osm_stats
        WHERE youth_id = $1 AND buildings_mapped > 0
        ORDER BY date DESC
        LIMIT 1
      `, [doreen.youth_id]);

      if (statsResult.rows.length > 0) {
        const stat = statsResult.rows[0];
        console.log(`Recent work: ${stat.date}, ${stat.buildings_mapped} buildings, changeset #${stat.last_changeset_id}\n`);
      }
    }

    // Now analyze Brian's changeset #176975712
    console.log('🔍 Analyzing Brian\'s changeset #176975712...\n');
    
    const changesetId = 176975712;
    const csUrl = `${OSM_API_BASE}/changeset/${changesetId}/download`;
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      textNodeName: '_text',
      parseAttributeValue: true,
      isArray: (name) => ['changeset', 'node', 'way', 'relation', 'tag'].includes(name),
    });

    console.log('Fetching changeset data...');
    const csResponse = await axios.get(csUrl, {
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0',
        'Accept': 'text/xml',
      },
      timeout: 30000,
    });

    const csParsed = parser.parse(csResponse.data);
    const osmChange = csParsed?.osmChange || {};
    
    console.log('Parsed changeset structure:', Object.keys(osmChange));
    
    let totalWays = 0;
    let buildingCount = 0;
    const typos = ['biulding', 'buiding', 'buidling', 'buliding', 'buidilng'];
    const buildingSamples = [];

    // Check all modification types
    for (const modType of ['create', 'modify', 'delete']) {
      const elements = osmChange[modType];
      if (!elements) {
        console.log(`  ${modType}: not present`);
        continue;
      }

      console.log(`\n📦 Checking ${modType} section...`);
      
      // Count ways
      const ways = Array.isArray(elements.way) ? elements.way : 
                   elements.way ? [elements.way] : [];
      totalWays += ways.length;
      console.log(`  Total ways in ${modType}: ${ways.length}`);
      
      // Check nodes, ways, relations
      for (const elementType of ['node', 'way', 'relation']) {
        const items = Array.isArray(elements[elementType]) ? elements[elementType] : 
                      elements[elementType] ? [elements[elementType]] : [];
        
        let buildingsInType = 0;
        
        for (const item of items) {
          if (!item.tag) continue;
          
          const tags = Array.isArray(item.tag) ? item.tag : [item.tag];
          
          // Check for building tag or typos
          const buildingTag = tags.find(tag => 
            tag.k === 'building' || typos.includes(tag.k)
          );
          
          if (buildingTag) {
            buildingsInType++;
            buildingCount++;
            
            // Save first 5 samples
            if (buildingSamples.length < 5) {
              buildingSamples.push({
                type: elementType,
                id: item.id,
                tagValue: buildingTag.v,
                allTags: tags.map(t => `${t.k}=${t.v}`).join(', ')
              });
            }
          }
        }
        
        if (buildingsInType > 0) {
          console.log(`    ${elementType}s with building tag: ${buildingsInType}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(80));
    console.log(`Total ways in changeset: ${totalWays}`);
    console.log(`Buildings counted: ${buildingCount}`);
    console.log('='.repeat(80));

    if (buildingSamples.length > 0) {
      console.log('\n🏗️  Sample buildings found:');
      for (const sample of buildingSamples) {
        console.log(`  ${sample.type} #${sample.id}: building=${sample.tagValue}`);
        console.log(`    Tags: ${sample.allTags.substring(0, 100)}...`);
      }
    }

    console.log('\n📝 Counting logic used:');
    console.log('  1. Parse osmChange XML');
    console.log('  2. Check create/modify/delete sections');
    console.log('  3. For each node/way/relation:');
    console.log('     - Look for tag with k="building" or typo variants');
    console.log('     - Count if found');
    console.log('  4. Return total count');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
  } finally {
    await client.end();
  }
}

debugBuildingCount();

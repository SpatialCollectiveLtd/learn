/**
 * Analyze changeset content - what types of elements and tags
 */

const https = require('https');
const { XMLParser } = require('fast-xml-parser');

async function analyzeChangeset(changesetId) {
  console.log(`\n=== Analyzing Changeset #${changesetId} ===\n`);
  
  try {
    // Download the changeset
    const xmlText = await new Promise((resolve, reject) => {
      https.get(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });

    // Parse it
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name) => ['create', 'modify', 'delete', 'node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name)
    });
    const data = parser.parse(xmlText);
    const osmChange = data.osmChange;

    // Collect all create and modify sections
    const sections = [];
    if (osmChange.create) {
      sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
    }
    if (osmChange.modify) {
      sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
    }

    // Stats collectors
    const stats = {
      totalNodes: 0,
      totalWays: 0,
      totalRelations: 0,
      buildingWays: 0,
      buildingNodes: 0,
      buildingRelations: 0,
      tagBreakdown: {}
    };

    // Analyze each section
    for (const section of sections) {
      // Process ways
      const ways = section.way || [];
      for (const way of ways) {
        stats.totalWays++;
        
        const tags = way.tag || [];
        let isBuilding = false;
        
        for (const tag of tags) {
          const key = tag.k || '';
          const value = tag.v || '';
          
          // Track all building-related tags
          if (key === 'building') {
            isBuilding = true;
            stats.tagBreakdown[`building=${value}`] = (stats.tagBreakdown[`building=${value}`] || 0) + 1;
          }
          
          // Track other common tags
          if (['amenity', 'landuse', 'highway', 'waterway', 'natural'].includes(key)) {
            stats.tagBreakdown[`${key}=${value}`] = (stats.tagBreakdown[`${key}=${value}`] || 0) + 1;
          }
        }
        
        if (isBuilding) stats.buildingWays++;
      }

      // Process nodes
      const nodes = section.node || [];
      for (const node of nodes) {
        stats.totalNodes++;
        
        const tags = node.tag || [];
        let isBuilding = false;
        
        for (const tag of tags) {
          const key = tag.k || '';
          const value = tag.v || '';
          
          if (key === 'building') {
            isBuilding = true;
            stats.tagBreakdown[`node:building=${value}`] = (stats.tagBreakdown[`node:building=${value}`] || 0) + 1;
          }
        }
        
        if (isBuilding) stats.buildingNodes++;
      }

      // Process relations
      const relations = section.relation || [];
      for (const relation of relations) {
        stats.totalRelations++;
        
        const tags = relation.tag || [];
        let isBuilding = false;
        
        for (const tag of tags) {
          const key = tag.k || '';
          const value = tag.v || '';
          
          if (key === 'building') {
            isBuilding = true;
            stats.tagBreakdown[`relation:building=${value}`] = (stats.tagBreakdown[`relation:building=${value}`] || 0) + 1;
          }
        }
        
        if (isBuilding) stats.buildingRelations++;
      }
    }

    // Display results
    console.log('=== Element Counts ===');
    console.log(`Total nodes: ${stats.totalNodes}`);
    console.log(`Total ways: ${stats.totalWays}`);
    console.log(`Total relations: ${stats.totalRelations}`);
    console.log(`\nBuilding elements:`);
    console.log(`  - Building ways: ${stats.buildingWays}`);
    console.log(`  - Building nodes: ${stats.buildingNodes}`);
    console.log(`  - Building relations: ${stats.buildingRelations}`);
    console.log(`\n=== Total Buildings (ways + nodes + relations) ===`);
    console.log(`${stats.buildingWays + stats.buildingNodes + stats.buildingRelations}`);

    console.log('\n=== Tag Breakdown ===');
    const sortedTags = Object.entries(stats.tagBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20
    
    for (const [tag, count] of sortedTags) {
      console.log(`${tag}: ${count}`);
    }

    console.log(`\n=== OSM Standard Interpretation ===`);
    console.log(`In OSM, a "building" is typically:`);
    console.log(`1. A closed way (polygon) with building=* tag`);
    console.log(`2. OR a multipolygon relation with building=* tag`);
    console.log(`3. Nodes with building=* are usually entrance nodes, not buildings`);
    console.log(`\nFor mapping statistics, we should count:`);
    console.log(`  - Ways with building=* tag: ${stats.buildingWays}`);
    console.log(`  - Relations with building=* tag: ${stats.buildingRelations}`);
    console.log(`  - TOTAL BUILDINGS: ${stats.buildingWays + stats.buildingRelations}`);
    console.log(`\n(Building nodes are NOT counted as buildings - they're typically entrance points)`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Analyze Oketch's changeset
analyzeChangeset('176978356');

/**
 * CRITICAL VERIFICATION: Ensure we're only counting buildings created by specific user on specific date
 */

const https = require('https');
const { XMLParser } = require('fast-xml-parser');

async function verifyChangesetOwnership(changesetId, expectedUser, expectedDate) {
  console.log(`\n=== VERIFYING CHANGESET #${changesetId} ===\n`);
  
  try {
    // 1. Get changeset metadata
    const metadataXml = await new Promise((resolve, reject) => {
      https.get(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: ''
    });
    
    const metadata = parser.parse(metadataXml);
    const changeset = metadata.osm.changeset;

    console.log('=== CHANGESET METADATA ===');
    console.log(`Changeset ID: ${changeset.id}`);
    console.log(`User: ${changeset.user}`);
    console.log(`User ID: ${changeset.uid}`);
    console.log(`Created at: ${changeset.created_at}`);
    console.log(`Closed at: ${changeset.closed_at || 'Still open'}`);
    console.log(`Comment: ${changeset.tag?.find(t => t.k === 'comment')?.v || 'No comment'}`);
    
    const changesetDate = new Date(changeset.created_at).toISOString().split('T')[0];
    console.log(`\n✓ Changeset belongs to: ${changeset.user}`);
    console.log(`✓ Changeset date: ${changesetDate}`);

    if (changeset.user !== expectedUser) {
      console.log(`❌ ERROR: Expected user "${expectedUser}" but changeset belongs to "${changeset.user}"`);
      return false;
    }

    if (changesetDate !== expectedDate) {
      console.log(`❌ ERROR: Expected date "${expectedDate}" but changeset is from "${changesetDate}"`);
      return false;
    }

    // 2. Get changeset diff to analyze elements
    const diffXml = await new Promise((resolve, reject) => {
      https.get(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      });
    });

    const diffParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      isArray: (name) => ['create', 'modify', 'delete', 'node', 'way', 'relation', 'tag', 'nd', 'member'].includes(name)
    });
    
    const diff = diffParser.parse(diffXml);
    const osmChange = diff.osmChange;

    console.log('\n=== ELEMENT ANALYSIS ===');

    // Collect all sections
    const sections = [];
    if (osmChange.create) {
      sections.push(...(Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create]));
    }
    if (osmChange.modify) {
      sections.push(...(Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify]));
    }

    const stats = {
      createdBuildings: 0,
      modifiedBuildings: 0,
      deletedBuildings: 0,
      createdByDifferentUser: 0,
      modifiedOldBuildings: 0,
      sampleElements: []
    };

    // Check CREATE sections (new buildings)
    if (osmChange.create) {
      const createSections = Array.isArray(osmChange.create) ? osmChange.create : [osmChange.create];
      for (const section of createSections) {
        const ways = section.way || [];
        for (const way of ways) {
          const tags = way.tag || [];
          const hasBuilding = tags.some(tag => tag.k === 'building');
          
          if (hasBuilding) {
            stats.createdBuildings++;
            
            // Verify user and timestamp on the element
            if (way.user !== changeset.user) {
              stats.createdByDifferentUser++;
              console.log(`⚠️  WARNING: Way ${way.id} created by "${way.user}" not "${changeset.user}"`);
            }

            // Check if version is 1 (brand new)
            if (way.version !== '1') {
              console.log(`⚠️  WARNING: Created way ${way.id} has version ${way.version} (expected 1)`);
            }

            // Sample first few
            if (stats.sampleElements.length < 3) {
              stats.sampleElements.push({
                type: 'CREATE',
                id: way.id,
                user: way.user,
                timestamp: way.timestamp,
                version: way.version,
                buildingType: tags.find(t => t.k === 'building')?.v
              });
            }
          }
        }
      }
    }

    // Check MODIFY sections (edited existing buildings)
    if (osmChange.modify) {
      const modifySections = Array.isArray(osmChange.modify) ? osmChange.modify : [osmChange.modify];
      for (const section of modifySections) {
        const ways = section.way || [];
        for (const way of ways) {
          const tags = way.tag || [];
          const hasBuilding = tags.some(tag => tag.k === 'building');
          
          if (hasBuilding) {
            stats.modifiedBuildings++;
            
            // Check version - if > 1, this is editing an old building
            if (parseInt(way.version) > 1) {
              stats.modifiedOldBuildings++;
            }

            // Sample first few modifications
            if (stats.sampleElements.length < 6) {
              stats.sampleElements.push({
                type: 'MODIFY',
                id: way.id,
                user: way.user,
                timestamp: way.timestamp,
                version: way.version,
                buildingType: tags.find(t => t.k === 'building')?.v
              });
            }
          }
        }
      }
    }

    console.log(`\nNew buildings CREATED: ${stats.createdBuildings}`);
    console.log(`Existing buildings MODIFIED: ${stats.modifiedBuildings}`);
    console.log(`Buildings DELETED: ${stats.deletedBuildings}`);
    
    if (stats.modifiedOldBuildings > 0) {
      console.log(`\n⚠️  WARNING: ${stats.modifiedOldBuildings} buildings were MODIFIED (editing old buildings)`);
      console.log(`These should NOT be counted as new buildings mapped!`);
    }

    console.log('\n=== SAMPLE ELEMENTS ===');
    for (const elem of stats.sampleElements) {
      console.log(`${elem.type} way #${elem.id}:`);
      console.log(`  User: ${elem.user}`);
      console.log(`  Timestamp: ${elem.timestamp}`);
      console.log(`  Version: ${elem.version} ${elem.version === '1' ? '(NEW)' : '(EDITED OLD BUILDING)'}`);
      console.log(`  Building type: ${elem.buildingType}`);
      console.log('');
    }

    console.log('\n=== RECOMMENDATION ===');
    if (stats.modifiedBuildings > 0) {
      console.log(`❌ PROBLEM DETECTED: This changeset contains ${stats.modifiedBuildings} MODIFIED buildings`);
      console.log(`We should only count CREATED buildings (${stats.createdBuildings})`);
      console.log(`Counting modified buildings would credit the user for editing someone else's work!`);
    } else {
      console.log(`✅ GOOD: All ${stats.createdBuildings} buildings were CREATED (new buildings)`);
      console.log(`No modifications to existing buildings - all work is original.`);
    }

    return {
      isValid: changeset.user === expectedUser && changesetDate === expectedDate,
      createdBuildings: stats.createdBuildings,
      modifiedBuildings: stats.modifiedBuildings,
      shouldCount: stats.createdBuildings // Only count created buildings
    };

  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Test both of Oketch's changesets
async function main() {
  console.log('====================================');
  console.log('CRITICAL VERIFICATION FOR PRODUCTION');
  console.log('====================================');
  
  const results = [];
  
  // Changeset 1
  const result1 = await verifyChangesetOwnership('176978356', 'Oketch ochieng', '2026-01-08');
  results.push(result1);
  
  console.log('\n\n');
  
  // Changeset 2
  const result2 = await verifyChangesetOwnership('176970040', 'Oketch ochieng', '2026-01-08');
  results.push(result2);

  console.log('\n\n====================================');
  console.log('FINAL VERIFICATION SUMMARY');
  console.log('====================================');
  
  const totalCreated = results.reduce((sum, r) => sum + (r?.createdBuildings || 0), 0);
  const totalModified = results.reduce((sum, r) => sum + (r?.modifiedBuildings || 0), 0);
  const shouldCount = results.reduce((sum, r) => sum + (r?.shouldCount || 0), 0);

  console.log(`\nTotal CREATED buildings: ${totalCreated}`);
  console.log(`Total MODIFIED buildings: ${totalModified}`);
  console.log(`\nBuildings to COUNT for Oketch on Jan 8: ${shouldCount}`);

  if (totalModified > 0) {
    console.log(`\n❌ CRITICAL: We are currently counting MODIFIED buildings!`);
    console.log(`This means we're crediting users for editing old buildings.`);
    console.log(`CODE NEEDS TO BE FIXED to only count CREATE, not MODIFY.`);
  } else {
    console.log(`\n✅ VERIFIED: All ${shouldCount} buildings are NEW buildings created by Oketch on Jan 8`);
    console.log(`No old buildings being counted. Stats are ACCURATE.`);
  }
}

main();

/**
 * Verify a specific changeset for a user
 */

const https = require('https');

function fetchChangeset(changesetId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.openstreetmap.org/api/0.6/changeset/${changesetId}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

function fetchChangesetContent(changesetId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function analyzeChangeset(changesetId) {
  try {
    console.log(`\n=== Analyzing Changeset #${changesetId} ===\n`);
    
    // Get metadata
    const metadata = await fetchChangeset(changesetId);
    const userMatch = metadata.match(/user="([^"]+)"/);
    const createdMatch = metadata.match(/created_at="([^"]+)"/);
    const commentMatch = metadata.match(/<tag k="comment" v="([^"]+)"/);
    
    console.log('Metadata:');
    console.log(`  User: ${userMatch ? userMatch[1] : 'Unknown'}`);
    console.log(`  Created: ${createdMatch ? createdMatch[1] : 'Unknown'}`);
    console.log(`  Comment: ${commentMatch ? commentMatch[1] : 'No comment'}`);
    
    // Get content
    const content = await fetchChangesetContent(changesetId);
    
    // Count buildings
    const wayMatches = content.match(/<way /g);
    const totalWays = wayMatches ? wayMatches.length : 0;
    
    const buildingMatches = content.match(/<tag k="building"/g);
    const totalBuildings = buildingMatches ? buildingMatches.length : 0;
    
    console.log('\nContent Analysis:');
    console.log(`  Total ways: ${totalWays}`);
    console.log(`  Ways with building tag: ${totalBuildings}`);
    
    // Check for hashtag
    const hashtagMatch = content.match(/<tag k="hashtag" v="([^"]+)"/);
    const hasHashtag = hashtagMatch || (commentMatch && commentMatch[1].includes('#'));
    
    console.log('\nHashtag Check:');
    if (hashtagMatch) {
      console.log(`  ✅ Hashtag found: ${hashtagMatch[1]}`);
    } else if (commentMatch && commentMatch[1].includes('#DPW')) {
      console.log(`  ✅ Hashtag in comment: #DPW2025`);
    } else {
      console.log(`  ⚠️ No hashtag found - this might not be counted!`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const changesetId = process.argv[2];
if (!changesetId) {
  console.log('Usage: node verify-changeset.js <changeset_id>');
  console.log('Example: node verify-changeset.js 177014673');
  process.exit(1);
}

analyzeChangeset(changesetId);

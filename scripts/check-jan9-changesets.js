/**
 * Check OSM API for user's recent changesets
 */

const https = require('https');

function getUserChangesets(username) {
  return new Promise((resolve, reject) => {
    const url = `https://api.openstreetmap.org/api/0.6/changesets?display_name=${encodeURIComponent(username)}&time=2026-01-09T00:00:00Z,2026-01-10T00:00:00Z`;
    
    console.log(`Fetching: ${url}\n`);
    
    https.get(url, {
      headers: {
        'User-Agent': 'SC-Training-Platform/1.0'
      }
    }, (res) => {
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

async function checkChangesets() {
  try {
    console.log('=== Checking gillykarigo\'s changesets for Jan 9, 2026 ===\n');
    
    const xml = await getUserChangesets('gillykarigo');
    
    // Parse changesets
    const changesetMatches = xml.match(/<changeset[^>]*>/g);
    
    if (!changesetMatches || changesetMatches.length === 0) {
      console.log('✅ NO changesets found for January 9, 2026');
      console.log('   User has NOT uploaded anything today.');
      return;
    }
    
    console.log(`Found ${changesetMatches.length} changeset(s) on Jan 9:\n`);
    
    changesetMatches.forEach((cs, i) => {
      const idMatch = cs.match(/id="(\d+)"/);
      const createdMatch = cs.match(/created_at="([^"]+)"/);
      const closedMatch = cs.match(/closed_at="([^"]+)"/);
      const changesMatch = cs.match(/changes_count="(\d+)"/);
      
      console.log(`Changeset #${i + 1}:`);
      console.log(`  ID: ${idMatch ? idMatch[1] : 'unknown'}`);
      console.log(`  Created: ${createdMatch ? createdMatch[1] : 'unknown'}`);
      console.log(`  Closed: ${closedMatch ? closedMatch[1] : 'unknown'}`);
      console.log(`  Changes: ${changesMatch ? changesMatch[1] : 'unknown'}`);
      
      // Check for comment tag
      const commentMatch = xml.match(new RegExp(`<changeset id="${idMatch[1]}"[^>]*>.*?<tag k="comment" v="([^"]*)"`, 's'));
      if (commentMatch) {
        console.log(`  Comment: ${commentMatch[1]}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkChangesets();

require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function checkVersionAndQuery() {
  console.log('\n🔍 CHECKING VERSION AND QUERY DETAILS');
  console.log('='.repeat(80));

  // Check version
  return new Promise((resolve, reject) => {
    https.get('https://learn.spatialcollective.co.ke/api/version', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\n📦 VERSION INFO:');
          console.log(`   Deployed Commit: ${json.commit || 'Unknown'}`);
          console.log(`   Deploy Time: ${json.deployTime || 'Unknown'}`);
          console.log(`   Version: ${json.version || 'Unknown'}`);
          
          // Check local git commit
          const { execSync } = require('child_process');
          try {
            const localCommit = execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
            const localBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
            console.log(`\n📍 LOCAL GIT:` );
            console.log(`   Commit: ${localCommit}`);
            console.log(`   Branch: ${localBranch}`);
            
            if (json.commit && json.commit.startsWith(localCommit)) {
              console.log(`\n   ✅ Production matches local commit`);
            } else {
              console.log(`\n   ⚠️  Production (${json.commit}) DIFFERS from local (${localCommit})`);
            }
          } catch (e) {
            console.log('\n   ⚠️  Could not get local git info');
          }
          
          resolve();
        } catch (error) {
          console.log('Version check error:', error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('Version check failed:', error.message);
      reject(error);
    });
  });
}

checkVersionAndQuery();

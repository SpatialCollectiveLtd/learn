require('dotenv').config({ path: '.env.local' });
const https = require('https');

async function testAPIHealth() {
  const API_KEY = process.env.DPW_MANAGER_API_KEY;
  
  console.log('\n🏥 TESTING API HEALTH & DIAGNOSTICS');
  console.log('='.repeat(80));

  // Test health endpoint
  return new Promise((resolve, reject) => {
    https.get('https://learn.spatialcollective.co.ke/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\n📊 HEALTH CHECK:');
          console.log(JSON.stringify(json, null, 2));
          
          // Now test debug endpoint
          const options = {
            method: 'GET',
            headers: {
              'X-API-Key': API_KEY,
              'Accept': 'application/json'
            }
          };

          https.get('https://learn.spatialcollective.co.ke/api/debug', options, (res2) => {
            let debugData = '';
            
            res2.on('data', (chunk) => {
              debugData += chunk;
            });
            
            res2.on('end', () => {
              try {
                const debugJson = JSON.parse(debugData);
                console.log('\n🔍 DEBUG INFO:');
                console.log(JSON.stringify(debugJson, null, 2));
                resolve();
              } catch (e) {
                console.log('Debug endpoint error:', e.message);
                resolve();
              }
            });
          }).on('error', (err) => {
            console.log('Debug endpoint failed:', err.message);
            resolve();
          });
          
        } catch (error) {
          console.log('Health check error:', error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('Health check request failed:', error.message);
      reject(error);
    });
  });
}

testAPIHealth();

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const API_KEY = process.env.DPW_MANAGER_API_KEY;

console.log('Testing DPW API locally...\n');
console.log('Using API Key:', API_KEY.substring(0, 20) + '...\n');

// Test case 1: Module query
const testModule = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/external/dpw-sync?module=digitization',
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      }
    };

    console.log('Test 1: Query by module (digitization)');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log(`✅ Success! Returned ${json.data.length} participants\n`);
          if (json.data.length > 0) {
            console.log('First participant sample:', JSON.stringify(json.data[0], null, 2));
          }
        } else {
          console.log('❌ Error:', data);
        }
        console.log('\n---\n');
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request failed:', e.message);
      resolve();
    });

    req.end();
  });
};

// Test case 2: Youth ID query
const testYouthId = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/external/dpw-sync?youth_id=SFEA0001D',
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      }
    };

    console.log('Test 2: Query by youth_id (SFEA0001D)');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          console.log(`✅ Success! Returned ${json.data.length} participant(s)\n`);
          if (json.data.length > 0) {
            console.log('Participant data:', JSON.stringify(json.data[0], null, 2));
          }
        } else {
          console.log('❌ Error:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request failed:', e.message);
      resolve();
    });

    req.end();
  });
};

// Run tests sequentially
(async () => {
  await testModule();
  await testYouthId();
  console.log('\nTests complete!');
})();

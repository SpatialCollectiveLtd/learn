/**
 * ODK Central App User Registration - TEST SCRIPT
 * 
 * Tests creating ONE App User on ODK Central
 * Display name format: FirstName (UniqueID) LastName
 * 
 * Usage: node scripts/odk-central-register-test.js
 */

const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://collector.kesmis.go.ke',
  email: 'tech@spatialcollective.com',
  password: 'Spatial@2025!',
  projectId: 41,
  formId: 'streetlight_training',
};

// Test mapper (first one from the list)
const TEST_MAPPER = {
  uniqueId: 'KAY348RN',
  firstName: 'Regina',
  lastName: 'Nzoka',
};

// Helper function to make HTTPS requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject({ status: res.statusCode, data: parsed, message: parsed.message || 'Request failed' });
          }
        } catch (e) {
          reject({ status: res.statusCode, message: 'Failed to parse response', raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('ODK Central App User Registration - TEST');
  console.log('='.repeat(60));
  console.log(`\nServer: ${CONFIG.baseUrl}`);
  console.log(`Project ID: ${CONFIG.projectId}`);
  console.log(`Form: ${CONFIG.formId}`);
  console.log(`Test Mapper: ${TEST_MAPPER.firstName} ${TEST_MAPPER.lastName} (${TEST_MAPPER.uniqueId})`);
  console.log('');

  try {
    // Step 1: Login to get session token
    console.log('Step 1: Authenticating...');
    const loginResponse = await makeRequest('POST', '/v1/sessions', {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    
    const token = loginResponse.data.token;
    console.log(`✓ Authenticated successfully`);
    console.log(`  Session expires: ${loginResponse.data.expiresAt}`);

    // Step 2: Create App User
    console.log('\nStep 2: Creating App User...');
    const displayName = `${TEST_MAPPER.firstName} (${TEST_MAPPER.uniqueId}) ${TEST_MAPPER.lastName}`;
    console.log(`  Display Name: ${displayName}`);
    
    const appUserResponse = await makeRequest('POST', `/v1/projects/${CONFIG.projectId}/app-users`, {
      displayName: displayName,
    }, token);
    
    const appUser = appUserResponse.data;
    console.log(`✓ App User created successfully`);
    console.log(`  Actor ID: ${appUser.id}`);
    console.log(`  Token: ${appUser.token}`);
    console.log(`  Created At: ${appUser.createdAt}`);

    // Step 3: Assign app-user role to the form
    console.log('\nStep 3: Assigning form access...');
    await makeRequest(
      'POST', 
      `/v1/projects/${CONFIG.projectId}/forms/${CONFIG.formId}/assignments/app-user/${appUser.id}`,
      null,
      token
    );
    console.log(`✓ App User assigned to form: ${CONFIG.formId}`);

    // Step 4: Generate QR code URL (for ODK Collect configuration)
    console.log('\nStep 4: Generating configuration...');
    const configUrl = `${CONFIG.baseUrl}/v1/key/${appUser.token}/projects/${CONFIG.projectId}`;
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUCCESS! App User Created');
    console.log('='.repeat(60));
    console.log(`\nMapper: ${displayName}`);
    console.log(`\nODK Collect Configuration URL:`);
    console.log(configUrl);
    console.log(`\nTo configure ODK Collect:`);
    console.log(`1. Open ODK Collect`);
    console.log(`2. Go to Settings > Project Management`);
    console.log(`3. Add Project via URL or QR code`);
    console.log(`4. Use the URL above or scan QR code from Central web UI`);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Display Name: ${displayName}`);
    console.log(`Actor ID: ${appUser.id}`);
    console.log(`Token (partial): ${appUser.token.substring(0, 20)}...`);
    console.log(`Form Access: ${CONFIG.formId}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

main();

/**
 * ODK Central Form Assignment Tool
 * 
 * Assigns a form to all mobile mapping App Users who already have ODK access.
 * 
 * Usage: 
 *   node scripts/odk-assign-form.js <formId>
 * 
 * Examples:
 *   node scripts/odk-assign-form.js streetlight_survey
 *   node scripts/odk-assign-form.js building_assessment
 *   node scripts/odk-assign-form.js --list   (list all forms in project)
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  baseUrl: process.env.ODK_CENTRAL_URL || 'https://collector.kesmis.go.ke',
  email: process.env.ODK_ADMIN_EMAIL || 'tech@spatialcollective.com',
  password: process.env.ODK_ADMIN_PASSWORD || 'Spatial@2025!',
  projectId: parseInt(process.env.ODK_PROJECT_ID || '41'),
};

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function authenticate() {
  console.log('Authenticating with ODK Central...');
  const response = await makeRequest('POST', '/v1/sessions', {
    email: CONFIG.email,
    password: CONFIG.password,
  });
  return response.data.token;
}

async function listForms(token) {
  console.log('\n📋 Forms in Project ' + CONFIG.projectId + ':\n');
  const response = await makeRequest('GET', `/v1/projects/${CONFIG.projectId}/forms`, null, token);
  
  response.data.forEach(form => {
    const status = form.state === 'open' ? '✅' : form.state === 'closing' ? '⚠️' : '❌';
    console.log(`  ${status} ${form.xmlFormId}`);
    console.log(`     Name: ${form.name || 'N/A'}`);
    console.log(`     State: ${form.state}`);
    console.log(`     Version: ${form.version || 'N/A'}`);
    console.log('');
  });
  
  return response.data;
}

async function assignFormToUsers(token, formId) {
  const client = await pool.connect();
  
  try {
    // Get all mobile mapping users with ODK actor IDs
    console.log('\nFetching mobile mappers with ODK access...');
    const result = await client.query(`
      SELECT youth_id, full_name, odk_actor_id
      FROM youth_participants
      WHERE program_type = 'mobile_mapping'
        AND is_active = TRUE
        AND odk_actor_id IS NOT NULL
      ORDER BY youth_id
    `);
    
    const mappers = result.rows;
    console.log(`Found ${mappers.length} mappers with ODK access\n`);
    
    if (mappers.length === 0) {
      console.log('❌ No mappers have ODK access yet. Run odk-central-register-all.js first.');
      return;
    }

    // Check if form exists
    console.log(`Verifying form "${formId}" exists...`);
    try {
      await makeRequest('GET', `/v1/projects/${CONFIG.projectId}/forms/${encodeURIComponent(formId)}`, null, token);
      console.log('✓ Form found\n');
    } catch (err) {
      console.error(`❌ Form "${formId}" not found in project ${CONFIG.projectId}`);
      console.log('\nAvailable forms:');
      await listForms(token);
      return;
    }

    // Get current form assignments to avoid duplicates
    console.log('Checking current form assignments...');
    const assignmentsResponse = await makeRequest(
      'GET', 
      `/v1/projects/${CONFIG.projectId}/forms/${encodeURIComponent(formId)}/assignments`,
      null,
      token
    );
    const existingAssignments = new Set(assignmentsResponse.data.map(a => a.actorId));
    console.log(`Form already has ${existingAssignments.size} assignments\n`);

    // Assign form to each mapper
    console.log(`Assigning form "${formId}" to mappers...\n`);
    
    let assigned = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < mappers.length; i++) {
      const mapper = mappers[i];
      process.stdout.write(`[${i + 1}/${mappers.length}] ${mapper.full_name}... `);

      if (existingAssignments.has(mapper.odk_actor_id)) {
        console.log('already assigned');
        skipped++;
        continue;
      }

      try {
        await makeRequest(
          'POST',
          `/v1/projects/${CONFIG.projectId}/forms/${encodeURIComponent(formId)}/assignments/app-user/${mapper.odk_actor_id}`,
          null,
          token
        );
        console.log('✓');
        assigned++;
        await delay(100); // Small delay to avoid rate limiting
      } catch (err) {
        console.log('✗');
        failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('ASSIGNMENT COMPLETE');
    console.log('='.repeat(50));
    console.log(`Form: ${formId}`);
    console.log(`✓ Newly assigned: ${assigned}`);
    console.log(`⏭️  Already had access: ${skipped}`);
    if (failed > 0) console.log(`✗ Failed: ${failed}`);

  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('ODK Central Form Assignment Tool');
    console.log('================================\n');
    console.log('Usage:');
    console.log('  node scripts/odk-assign-form.js <formId>    Assign form to all mappers');
    console.log('  node scripts/odk-assign-form.js --list      List all forms in project');
    console.log('\nExamples:');
    console.log('  node scripts/odk-assign-form.js streetlight_survey');
    console.log('  node scripts/odk-assign-form.js building_assessment');
    process.exit(0);
  }

  try {
    const token = await authenticate();
    console.log('✓ Authenticated\n');

    if (args[0] === '--list') {
      await listForms(token);
    } else {
      const formId = args[0];
      await assignFormToUsers(token, formId);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  } finally {
    pool.end();
  }
}

main();

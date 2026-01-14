/**
 * ODK Central Bulk App User Registration
 * 
 * Registers all mobile mappers on ODK Central and saves their tokens to the database.
 * Display name format: FirstName (UniqueID) LastName
 * 
 * Usage: node scripts/odk-central-register-all.js
 * 
 * Set DRY_RUN=true to test without making changes
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
  formId: process.env.ODK_FORM_ID || 'streetlight_training',
};

const DRY_RUN = process.env.DRY_RUN === 'true';

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

// Delay helper to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('ODK Central Bulk App User Registration');
  console.log('='.repeat(60));
  console.log(`\nServer: ${CONFIG.baseUrl}`);
  console.log(`Project ID: ${CONFIG.projectId}`);
  console.log(`Form: ${CONFIG.formId}`);
  console.log(`Dry Run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO (will create users)'}`);
  console.log('');

  const client = await pool.connect();
  
  try {
    // Step 1: Get all mobile_mapping youth who don't have ODK tokens yet
    console.log('Step 1: Fetching mobile mapping youth from database...');
    const youthResult = await client.query(`
      SELECT youth_id, full_name
      FROM youth_participants
      WHERE program_type = 'mobile_mapping'
        AND is_active = TRUE
        AND (odk_token IS NULL OR odk_token = '')
      ORDER BY youth_id
    `);

    const mappers = youthResult.rows.map(row => {
      // Parse full_name into first and last name
      const nameParts = row.full_name.split(' ');
      return {
        youth_id: row.youth_id,
        unique_id: row.youth_id, // youth_id IS the unique ID
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: row.full_name,
      };
    });
    console.log(`Found ${mappers.length} mobile mappers without ODK config\n`);

    if (mappers.length === 0) {
      console.log('✓ All mappers already have ODK configuration!');
      return;
    }

    if (DRY_RUN) {
      console.log('DRY RUN - Would register these mappers:');
      mappers.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.first_name} (${m.unique_id}) ${m.last_name}`);
      });
      return;
    }

    // Step 2: Login to ODK Central
    console.log('Step 2: Authenticating with ODK Central...');
    const loginResponse = await makeRequest('POST', '/v1/sessions', {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Authenticated successfully\n');

    // Step 3: Register each mapper
    console.log('Step 3: Registering App Users...\n');
    
    const results = {
      success: [],
      failed: [],
    };

    for (let i = 0; i < mappers.length; i++) {
      const mapper = mappers[i];
      const displayName = `${mapper.first_name} (${mapper.unique_id}) ${mapper.last_name}`;
      
      process.stdout.write(`[${i + 1}/${mappers.length}] ${displayName}... `);

      try {
        // Create App User
        const appUserResponse = await makeRequest('POST', `/v1/projects/${CONFIG.projectId}/app-users`, {
          displayName: displayName,
        }, token);
        
        const appUser = appUserResponse.data;

        // Assign form access
        await makeRequest(
          'POST', 
          `/v1/projects/${CONFIG.projectId}/forms/${CONFIG.formId}/assignments/app-user/${appUser.id}`,
          null,
          token
        );

        // Save to database
        await client.query(`
          UPDATE youth_participants
          SET odk_token = $1, odk_actor_id = $2, odk_configured_at = NOW()
          WHERE youth_id = $3
        `, [appUser.token, appUser.id, mapper.youth_id]);

        console.log('✓');
        results.success.push({
          uniqueId: mapper.unique_id,
          name: displayName,
          actorId: appUser.id,
        });

        // Small delay to avoid rate limiting
        await delay(200);

      } catch (error) {
        console.log('✗');
        results.failed.push({
          uniqueId: mapper.unique_id,
          name: displayName,
          error: error.message || error.data?.message || 'Unknown error',
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('REGISTRATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n✓ Success: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\nFailed registrations:');
      results.failed.forEach(f => {
        console.log(`  - ${f.name}: ${f.error}`);
      });
    }

    console.log('\n✓ Tokens saved to database - mappers can now see their QR codes in the platform!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    if (error.data) {
      console.error('Details:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

main();

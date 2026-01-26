/**
 * Register Mji wa Huruma Mobile Mappers
 * 
 * This script:
 * 1. Adds/updates 19 Huruma youth as mobile_mapping users in the database
 * 2. Registers them on ODK Central as App Users
 * 3. Assigns them to the streetlight_training form
 * 
 * Usage: 
 *   node scripts/register-huruma-mobile-mappers.js --dry-run   (preview changes)
 *   node scripts/register-huruma-mobile-mappers.js             (execute registration)
 * 
 * Date: January 21, 2026
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// ============ CONFIGURATION ============
const CONFIG = {
  baseUrl: process.env.ODK_CENTRAL_URL || 'https://collector.kesmis.go.ke',
  email: process.env.ODK_ADMIN_EMAIL || 'tech@spatialcollective.com',
  password: process.env.ODK_ADMIN_PASSWORD || 'Spatial@2025!',
  projectId: parseInt(process.env.ODK_PROJECT_ID || '41'),
  formId: process.env.ODK_FORM_ID || 'streetlight_training',
};

const DRY_RUN = process.argv.includes('--dry-run');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============ HURUMA MOBILE MAPPERS DATA ============
const hurumaMappers = [
  { youthId: 'HUR610SW', firstName: 'Simon', lastName: 'Wambui' },
  { youthId: 'HUR689DM', firstName: 'Doricah', lastName: 'Motonu' },
  { youthId: 'HUR478JM', firstName: 'John', lastName: 'Mbugua' },
  { youthId: 'HUR438PW', firstName: 'Paul', lastName: 'Njoroge' },
  { youthId: 'HUR558AC', firstName: 'Ann', lastName: 'Chuhi' },
  { youthId: 'HUR703SN', firstName: 'Simon', lastName: 'Njeri' },
  { youthId: 'HUR714AK', firstName: 'Alice', lastName: 'Karanja' },
  { youthId: 'HUR386PM', firstName: 'Peter', lastName: 'Maina' },
  { youthId: 'HUR659SM', firstName: 'Stephen', lastName: 'Muli' },
  { youthId: 'HUR452DM', firstName: 'Dorcas', lastName: 'Wanja' },
  { youthId: 'HUR503EN', firstName: 'Edward', lastName: 'Nyakobi' },
  { youthId: 'HUR600HW', firstName: 'Hannah', lastName: 'Wanjiku' },
  { youthId: 'HUR772BN', firstName: 'Benny', lastName: 'Nguyo' },
  { youthId: 'HUR770AN', firstName: 'Abigael', lastName: 'Nguyo' },
  { youthId: 'HUR773MN', firstName: 'Margaret', lastName: 'Nyambura' },
  { youthId: 'HUR564KM', firstName: 'Lydia', lastName: 'Mwove' },
  { youthId: 'HUR788AW', firstName: 'Anne', lastName: 'Wambugu' },
  { youthId: 'HUR792SW', firstName: 'Susan', lastName: 'Wanja' },
  { youthId: 'HUR343SK', firstName: 'Susan', lastName: 'Kimani' },
];

// ============ HELPERS ============
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: { 'Content-Type': 'application/json' },
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ MAIN FUNCTIONS ============

async function addToDatabase(client) {
  console.log('\n📊 STEP 1: Adding/Updating Youth in Database\n');
  
  let added = 0;
  let updated = 0;
  
  for (const mapper of hurumaMappers) {
    const fullName = `${mapper.firstName} ${mapper.lastName}`;
    
    // Check if youth exists
    const existing = await client.query(
      'SELECT youth_id, program_type FROM youth_participants WHERE youth_id = $1',
      [mapper.youthId]
    );
    
    if (existing.rows.length > 0) {
      const currentProgram = existing.rows[0].program_type;
      if (currentProgram !== 'mobile_mapping') {
        if (!DRY_RUN) {
          await client.query(`
            UPDATE youth_participants 
            SET program_type = 'mobile_mapping', 
                settlement = 'Mji wa Huruma',
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE youth_id = $1
          `, [mapper.youthId]);
        }
        console.log(`  🔄 ${mapper.youthId} - ${fullName} (updated from ${currentProgram} → mobile_mapping)`);
        updated++;
      } else {
        console.log(`  ✓ ${mapper.youthId} - ${fullName} (already mobile_mapping)`);
      }
    } else {
      if (!DRY_RUN) {
        await client.query(`
          INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
          VALUES ($1, $2, 'mobile_mapping', 'Mji wa Huruma', TRUE)
        `, [mapper.youthId, fullName]);
      }
      console.log(`  ➕ ${mapper.youthId} - ${fullName} (new)`);
      added++;
    }
  }
  
  console.log(`\n  Summary: ${added} added, ${updated} updated, ${hurumaMappers.length - added - updated} unchanged`);
  return { added, updated };
}

async function registerOnODK(client, token) {
  console.log('\n📱 STEP 2: Registering on ODK Central\n');
  console.log(`  Server: ${CONFIG.baseUrl}`);
  console.log(`  Project ID: ${CONFIG.projectId}`);
  console.log(`  Form: ${CONFIG.formId}\n`);
  
  const results = { success: [], failed: [], skipped: [] };
  
  for (let i = 0; i < hurumaMappers.length; i++) {
    const mapper = hurumaMappers[i];
    const fullName = `${mapper.firstName} ${mapper.lastName}`;
    // Display name format: FirstName (UniqueID) LastName
    const displayName = `${mapper.firstName} (${mapper.youthId}) ${mapper.lastName}`;
    
    process.stdout.write(`  [${i + 1}/${hurumaMappers.length}] ${displayName}... `);
    
    // Check if already registered
    const existing = await client.query(
      'SELECT odk_token FROM youth_participants WHERE youth_id = $1',
      [mapper.youthId]
    );
    
    if (existing.rows[0]?.odk_token) {
      console.log('⏩ already registered');
      results.skipped.push({ id: mapper.youthId, name: fullName });
      continue;
    }
    
    if (DRY_RUN) {
      console.log('🔍 would register (dry run)');
      results.success.push({ id: mapper.youthId, name: fullName });
      continue;
    }
    
    try {
      // Step 1: Create App User on ODK Central
      // API: POST /v1/projects/{projectId}/app-users
      const appUserResponse = await makeRequest(
        'POST',
        `/v1/projects/${CONFIG.projectId}/app-users`,
        { displayName: displayName },
        token
      );
      
      const appUser = appUserResponse.data;
      
      // Step 2: Assign form access (app-user role)
      // API: POST /v1/projects/{projectId}/forms/{xmlFormId}/assignments/app-user/{actorId}
      await makeRequest(
        'POST',
        `/v1/projects/${CONFIG.projectId}/forms/${CONFIG.formId}/assignments/app-user/${appUser.id}`,
        null,
        token
      );
      
      // Step 3: Save token to database
      await client.query(`
        UPDATE youth_participants
        SET odk_token = $1, odk_actor_id = $2, odk_configured_at = NOW()
        WHERE youth_id = $3
      `, [appUser.token, appUser.id, mapper.youthId]);
      
      console.log('✓');
      results.success.push({ 
        id: mapper.youthId, 
        name: fullName, 
        actorId: appUser.id 
      });
      
      // Delay to avoid rate limiting
      await delay(300);
      
    } catch (error) {
      console.log('✗');
      results.failed.push({
        id: mapper.youthId,
        name: fullName,
        error: error.message || error.data?.message || 'Unknown error'
      });
    }
  }
  
  return results;
}

async function main() {
  console.log('='.repeat(70));
  console.log('MJI WA HURUMA MOBILE MAPPERS REGISTRATION');
  console.log('='.repeat(70));
  console.log(`\nDate: ${new Date().toISOString().split('T')[0]}`);
  console.log(`Total Mappers: ${hurumaMappers.length}`);
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '🚀 LIVE EXECUTION'}`);
  
  const client = await pool.connect();
  
  try {
    // Step 1: Add to database
    await addToDatabase(client);
    
    if (DRY_RUN) {
      console.log('\n📱 STEP 2: ODK Registration (DRY RUN)\n');
      console.log('  Would register all mappers on ODK Central');
      console.log('\n' + '='.repeat(70));
      console.log('DRY RUN COMPLETE - No changes made');
      console.log('='.repeat(70));
      console.log('\nTo execute for real, run:');
      console.log('  node scripts/register-huruma-mobile-mappers.js');
      return;
    }
    
    // Step 2: Login to ODK Central
    console.log('\n🔐 Authenticating with ODK Central...');
    const loginResponse = await makeRequest('POST', '/v1/sessions', {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    const token = loginResponse.data.token;
    console.log('  ✓ Authenticated\n');
    
    // Step 3: Register on ODK
    const results = await registerOnODK(client, token);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('REGISTRATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n✓ Registered: ${results.success.length}`);
    console.log(`⏩ Skipped (already registered): ${results.skipped.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed registrations:');
      results.failed.forEach(f => console.log(`  - ${f.id} (${f.name}): ${f.error}`));
    }
    
    if (results.success.length > 0) {
      console.log('\n✨ Mappers can now see their QR codes in the platform!');
      console.log('   URL: https://learn.spatialcollective.co.ke');
    }
    
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

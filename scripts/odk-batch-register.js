/**
 * ODK Central Batch Registration Script
 * 
 * Registers mobile mappers on ODK Central in batches to avoid errors.
 * 
 * PROCESS:
 * 1. First run: node scripts/odk-batch-register.js --prepare
 *    This shows the list of people to register
 * 
 * 2. Run batches: node scripts/odk-batch-register.js --batch 1
 *                 node scripts/odk-batch-register.js --batch 2
 *                 ... etc
 * 
 * 3. Check status: node scripts/odk-batch-register.js --status
 * 
 * EXCLUSIONS (from Mobile Mappers list):
 * - KAY348RN (Regina Nzoka) - allocated to digitization by mistake
 * - KAY269JW (Josephine Wambua) - removed
 * - KAY1990MM (Monica Mawilu) - removed
 * - KAY2188EG (Ephantus Githinji) - removed
 * - KAY1975NM (Nancy Mutinda) - removed
 */

const https = require('https');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// ============ CONFIGURATION ============
const CONFIG = {
  baseUrl: 'https://collector.kesmis.go.ke',
  email: process.env.ODK_ADMIN_EMAIL || 'tech@spatialcollective.com',
  password: process.env.ODK_ADMIN_PASSWORD || 'Spatial@2025!',
  projectId: 41,
  formId: 'streetlight_training',
  batchSize: 10,
};

// People to EXCLUDE from registration
const EXCLUSIONS = [
  'KAY348RN',  // Regina - already done, may move to digitization
  'KAY269JW',  // Josephine Wambua - removed
  'KAY1990MM', // Monica Mawilu - removed
  'KAY2188EG', // Ephantus Githinji - removed
  'KAY1975NM', // Nancy Mutinda - removed
];

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

async function getEligibleMappers(client) {
  const result = await client.query(`
    SELECT youth_id, full_name
    FROM youth_participants
    WHERE program_type = 'mobile_mapping'
      AND is_active = TRUE
      AND (odk_token IS NULL OR odk_token = '')
      AND youth_id NOT IN (${EXCLUSIONS.map((_, i) => `$${i+1}`).join(', ')})
    ORDER BY youth_id
  `, EXCLUSIONS);

  return result.rows.map(row => {
    const nameParts = row.full_name.split(' ');
    return {
      youth_id: row.youth_id,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      full_name: row.full_name,
    };
  });
}

async function showPrepare() {
  console.log('='.repeat(60));
  console.log('ODK CENTRAL BATCH REGISTRATION - PREPARATION');
  console.log('='.repeat(60));

  const client = await pool.connect();
  try {
    const mappers = await getEligibleMappers(client);
    const batches = Math.ceil(mappers.length / CONFIG.batchSize);

    console.log(`\nTotal eligible mappers: ${mappers.length}`);
    console.log(`Batch size: ${CONFIG.batchSize}`);
    console.log(`Number of batches: ${batches}`);
    
    console.log('\nExcluded IDs:');
    EXCLUSIONS.forEach(id => console.log(`  - ${id}`));

    console.log('\n' + '-'.repeat(60));
    
    for (let batch = 1; batch <= batches; batch++) {
      const start = (batch - 1) * CONFIG.batchSize;
      const end = Math.min(start + CONFIG.batchSize, mappers.length);
      const batchMappers = mappers.slice(start, end);
      
      console.log(`\nBATCH ${batch} (${batchMappers.length} people):`);
      batchMappers.forEach((m, i) => {
        console.log(`  ${start + i + 1}. ${m.youth_id} - ${m.full_name}`);
      });
    }

    console.log('\n' + '-'.repeat(60));
    console.log('\nTo register, run:');
    for (let i = 1; i <= batches; i++) {
      console.log(`  node scripts/odk-batch-register.js --batch ${i}`);
    }

  } finally {
    client.release();
    pool.end();
  }
}

async function showStatus() {
  console.log('='.repeat(60));
  console.log('ODK REGISTRATION STATUS');
  console.log('='.repeat(60));

  const client = await pool.connect();
  try {
    // Get counts
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE odk_token IS NOT NULL) as registered,
        COUNT(*) FILTER (WHERE odk_token IS NULL AND youth_id NOT IN (${EXCLUSIONS.map((_, i) => `$${i+1}`).join(', ')})) as pending,
        COUNT(*) FILTER (WHERE youth_id IN (${EXCLUSIONS.map((_, i) => `$${i+1}`).join(', ')})) as excluded
      FROM youth_participants
      WHERE program_type = 'mobile_mapping' AND is_active = TRUE
    `, [...EXCLUSIONS, ...EXCLUSIONS]);

    console.log(`\nRegistered with ODK: ${stats.rows[0].registered}`);
    console.log(`Pending registration: ${stats.rows[0].pending}`);
    console.log(`Excluded: ${EXCLUSIONS.length}`);

    // List registered
    console.log('\n✓ REGISTERED:');
    const registered = await client.query(`
      SELECT youth_id, full_name, odk_actor_id, odk_configured_at
      FROM youth_participants
      WHERE program_type = 'mobile_mapping' 
        AND is_active = TRUE 
        AND odk_token IS NOT NULL
      ORDER BY odk_configured_at DESC
    `);
    registered.rows.forEach(r => {
      console.log(`  ${r.youth_id} - ${r.full_name} (Actor: ${r.odk_actor_id})`);
    });

    // List pending
    const pending = await getEligibleMappers(client);
    if (pending.length > 0) {
      console.log(`\n⏳ PENDING (${pending.length}):`);
      pending.slice(0, 20).forEach(m => {
        console.log(`  ${m.youth_id} - ${m.full_name}`);
      });
      if (pending.length > 20) {
        console.log(`  ... and ${pending.length - 20} more`);
      }
    }

  } finally {
    client.release();
    pool.end();
  }
}

async function runBatch(batchNumber) {
  console.log('='.repeat(60));
  console.log(`ODK CENTRAL BATCH REGISTRATION - BATCH ${batchNumber}`);
  console.log('='.repeat(60));

  const client = await pool.connect();
  
  try {
    const allMappers = await getEligibleMappers(client);
    const batches = Math.ceil(allMappers.length / CONFIG.batchSize);
    
    if (batchNumber < 1 || batchNumber > batches) {
      console.log(`\n❌ Invalid batch number. Valid range: 1 to ${batches}`);
      return;
    }

    const start = (batchNumber - 1) * CONFIG.batchSize;
    const end = Math.min(start + CONFIG.batchSize, allMappers.length);
    const batchMappers = allMappers.slice(start, end);

    console.log(`\nTotal pending: ${allMappers.length}`);
    console.log(`This batch: ${batchMappers.length} mappers (${start + 1} to ${end})`);
    console.log('');

    // Login to ODK Central
    console.log('Authenticating with ODK Central...');
    const loginResponse = await makeRequest('POST', '/v1/sessions', {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    const token = loginResponse.data.token;
    console.log('✓ Authenticated\n');

    // Process each mapper
    const results = { success: [], failed: [] };

    for (let i = 0; i < batchMappers.length; i++) {
      const mapper = batchMappers[i];
      const displayName = `${mapper.first_name} (${mapper.youth_id}) ${mapper.last_name}`;
      
      process.stdout.write(`[${i + 1}/${batchMappers.length}] ${displayName}... `);

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
        results.success.push({ id: mapper.youth_id, name: displayName, actorId: appUser.id });

        // Delay to avoid rate limiting
        await delay(300);

      } catch (error) {
        console.log('✗');
        results.failed.push({ 
          id: mapper.youth_id, 
          name: displayName, 
          error: error.message || error.data?.message || 'Unknown error' 
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`BATCH ${batchNumber} COMPLETE`);
    console.log('='.repeat(60));
    console.log(`\n✓ Success: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\nFailed registrations:');
      results.failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
    }

    // Next steps
    const remainingBatches = batches - batchNumber;
    if (remainingBatches > 0) {
      console.log(`\nNext: node scripts/odk-batch-register.js --batch ${batchNumber + 1}`);
      console.log(`Remaining batches: ${remainingBatches}`);
    } else {
      console.log('\n🎉 All batches complete!');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message || error);
    if (error.data) console.error('Details:', JSON.stringify(error.data, null, 2));
  } finally {
    client.release();
    pool.end();
  }
}

// ============ CLI ============
const args = process.argv.slice(2);

if (args.includes('--prepare') || args.includes('-p')) {
  showPrepare();
} else if (args.includes('--status') || args.includes('-s')) {
  showStatus();
} else if (args.includes('--batch') || args.includes('-b')) {
  const batchIndex = args.findIndex(a => a === '--batch' || a === '-b');
  const batchNum = parseInt(args[batchIndex + 1]);
  if (isNaN(batchNum)) {
    console.log('Usage: node scripts/odk-batch-register.js --batch <number>');
    process.exit(1);
  }
  runBatch(batchNum);
} else {
  console.log(`
ODK Central Batch Registration Script
=====================================

Usage:
  --prepare, -p     Show list of people to register, organized by batch
  --status, -s      Show current registration status
  --batch N, -b N   Register batch number N

Example workflow:
  1. node scripts/odk-batch-register.js --prepare
  2. node scripts/odk-batch-register.js --batch 1
  3. node scripts/odk-batch-register.js --batch 2
  ... continue for all batches
  4. node scripts/odk-batch-register.js --status

Excluded IDs (${EXCLUSIONS.length}):
${EXCLUSIONS.map(id => '  - ' + id).join('\n')}
  `);
}

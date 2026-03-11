/**
 * Register Household Survey Youth on ODK Central
 *
 * This script:
 * 1. Adds/updates 30 youth as household_survey users in the database
 * 2. Registers them on ODK Central as App Users
 * 3. Assigns them to the household survey form
 *
 * Display name format: {FirstName} ({UniqueID}) {LastName}
 * e.g.  Stacey (KAR181SM) Mutheu
 *
 * Usage:
 *   node scripts/register-household-survey.js --dry-run   (preview, no changes)
 *   node scripts/register-household-survey.js             (execute)
 *
 * Required env vars (in .env.local):
 *   DATABASE_URL or learn_DATABASE_URL
 *   ODK_CENTRAL_URL       (default: https://collector.kesmis.go.ke)
 *   ODK_ADMIN_EMAIL
 *   ODK_ADMIN_PASSWORD
 *   ODK_PROJECT_ID        (default: 41)
 *   ODK_HOUSEHOLD_FORM_ID (the xmlFormId of the household survey form)
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
  formId: process.env.ODK_HOUSEHOLD_FORM_ID || 'household_survey_2026',
};

const DRY_RUN = process.argv.includes('--dry-run');

const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Settlement derived from youth ID prefix
function getSettlement(youthId) {
  if (youthId.startsWith('KAY')) return 'Kayole Soweto';
  if (youthId.startsWith('KAR')) return 'Kariobangi Machakos';
  if (youthId.startsWith('HUR')) return 'Mji wa Huruma';
  return 'Unknown';
}

// ============ HOUSEHOLD SURVEY YOUTH ============
const householdYouth = [
  { youthId: 'KAR181SM', firstName: 'Stacey',    lastName: 'Mutheu'   },
  { youthId: 'KAR019JM', firstName: 'Joseph',    lastName: 'Muta'     },
  { youthId: 'KAY2568AI', firstName: 'Auther',   lastName: 'Irungu'   },
  { youthId: 'KAY1198MN', firstName: 'Miriam',   lastName: 'Nyakundi' },
  { youthId: 'KAY2038SI', firstName: 'Solomon',  lastName: 'Irungu'   },
  { youthId: 'KAY1449OO', firstName: 'Oginga',   lastName: 'Onguko'   },
  { youthId: 'KAY2427LM', firstName: 'Laventry', lastName: 'Munyeti'  },
  { youthId: 'KAY1590MT', firstName: 'Mary',     lastName: 'Theuri'   },
  { youthId: 'KAY2772EB', firstName: 'Evans',    lastName: 'Barasa'   },
  { youthId: 'KAY1045SN', firstName: 'Sicily',   lastName: 'Nyaga'    },
  { youthId: 'KAY886MN',  firstName: 'Mary',     lastName: 'Njoroge'  },
  { youthId: 'KAY1062DM', firstName: 'Dolpine',  lastName: 'Murengu'  },
  { youthId: 'KAY2080DM', firstName: 'Daniel',   lastName: 'Maina'    },
  { youthId: 'KAY2209BA', firstName: 'Bakhita',  lastName: 'Awuor'    },
  { youthId: 'KAY1966MN', firstName: 'Moses',    lastName: 'Ndubi'    },
  { youthId: 'KAY1053IO', firstName: 'Irene',    lastName: 'Obeli'    },
  { youthId: 'KAY1914KM', firstName: 'Kelvin',   lastName: 'Masai'    },
  { youthId: 'KAY1459VO', firstName: 'Vivian',   lastName: 'Otieno'   },
  { youthId: 'KAY1145FW', firstName: 'Francis',  lastName: 'Wanjau'   },
  { youthId: 'KAY1043DB', firstName: 'Dennis',   lastName: 'Bosire'   },
  { youthId: 'KAY352VO',  firstName: 'Veronica', lastName: 'Oluoch'   },
  { youthId: 'HUR761RM',  firstName: 'Ruth',     lastName: 'Muthoni'  },
  { youthId: 'HUR429JN',  firstName: 'John',     lastName: 'Ngure'    },
  { youthId: 'HUR652MN',  firstName: 'Monica',   lastName: "Ng'ang'a" },
  { youthId: 'KAR286EM',  firstName: 'Emily',    lastName: 'Musau'    },
  { youthId: 'KAR306WK',  firstName: 'Wesly',    lastName: 'Kimuyu'   },
  { youthId: 'KAR458SK',  firstName: 'Sydney',   lastName: 'Kiamba'   },
  { youthId: 'KAR432GM',  firstName: 'Grace',    lastName: 'Mutunga'  },
  { youthId: 'HUR781MK',  firstName: 'Margaret', lastName: 'Karita'   },
  { youthId: 'HUR749AG',  firstName: 'Ambrose',  lastName: 'Gitau'    },
];

// ============ HELPERS ============
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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

// ============ STEP 1: DATABASE ============
async function addToDatabase(client) {
  console.log('\n📊 STEP 1: Adding/Updating Youth in Database\n');

  let added = 0, updated = 0, unchanged = 0;

  for (const youth of householdYouth) {
    const fullName = `${youth.firstName} ${youth.lastName}`;
    const settlement = getSettlement(youth.youthId);

    const existing = await client.query(
      'SELECT youth_id, program_type FROM youth_participants WHERE youth_id = $1',
      [youth.youthId]
    );

    if (existing.rows.length > 0) {
      const cur = existing.rows[0].program_type;
      if (cur !== 'household_survey') {
        if (!DRY_RUN) {
          await client.query(`
            UPDATE youth_participants
            SET program_type = 'household_survey',
                settlement   = $2,
                is_active    = TRUE,
                updated_at   = CURRENT_TIMESTAMP
            WHERE youth_id = $1
          `, [youth.youthId, settlement]);
        }
        console.log(`  🔄 ${youth.youthId} - ${fullName} (${settlement}) — updated from ${cur} → household_survey`);
        updated++;
      } else {
        console.log(`  ✓  ${youth.youthId} - ${fullName} (already household_survey)`);
        unchanged++;
      }
    } else {
      if (!DRY_RUN) {
        await client.query(`
          INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
          VALUES ($1, $2, 'household_survey', $3, TRUE)
        `, [youth.youthId, fullName, settlement]);
      }
      console.log(`  ➕ ${youth.youthId} - ${fullName} (${settlement}) — new`);
      added++;
    }
  }

  console.log(`\n  Summary: ${added} added, ${updated} updated, ${unchanged} unchanged`);
}

// ============ STEP 2: ODK CENTRAL ============
async function registerOnODK(client, token) {
  console.log('\n📱 STEP 2: Registering on ODK Central\n');
  console.log(`  Server:     ${CONFIG.baseUrl}`);
  console.log(`  Project ID: ${CONFIG.projectId}`);
  console.log(`  Form:       ${CONFIG.formId}\n`);

  const results = { success: [], failed: [], skipped: [] };

  for (let i = 0; i < householdYouth.length; i++) {
    const youth = householdYouth[i];
    const fullName = `${youth.firstName} ${youth.lastName}`;
    // Display name: FirstName (UniqueID) LastName
    const displayName = `${youth.firstName} (${youth.youthId}) ${youth.lastName}`;

    process.stdout.write(`  [${i + 1}/${householdYouth.length}] ${displayName}... `);

    // Skip if already registered
    const existing = await client.query(
      'SELECT odk_token FROM youth_participants WHERE youth_id = $1',
      [youth.youthId]
    );
    if (existing.rows[0]?.odk_token) {
      console.log('⏩ already registered');
      results.skipped.push({ id: youth.youthId, name: fullName });
      continue;
    }

    if (DRY_RUN) {
      console.log('🔍 would register (dry run)');
      results.success.push({ id: youth.youthId, name: fullName });
      continue;
    }

    try {
      // 1. Create App User on ODK Central
      const appUserRes = await makeRequest(
        'POST',
        `/v1/projects/${CONFIG.projectId}/app-users`,
        { displayName },
        token
      );
      const appUser = appUserRes.data;

      // 2. Assign form access
      await makeRequest(
        'POST',
        `/v1/projects/${CONFIG.projectId}/forms/${encodeURIComponent(CONFIG.formId)}/assignments/app-user/${appUser.id}`,
        null,
        token
      );

      // 3. Save token & actor ID to database
      await client.query(`
        UPDATE youth_participants
        SET odk_token = $1, odk_actor_id = $2, odk_configured_at = NOW()
        WHERE youth_id = $3
      `, [appUser.token, appUser.id, youth.youthId]);

      console.log('✓');
      results.success.push({ id: youth.youthId, name: fullName, actorId: appUser.id });

      await delay(300); // avoid rate limiting
    } catch (err) {
      console.log('✗');
      results.failed.push({
        id: youth.youthId,
        name: fullName,
        error: err.message || err.data?.message || JSON.stringify(err),
      });
    }
  }

  return results;
}

// ============ MAIN ============
async function main() {
  console.log('='.repeat(70));
  console.log('HOUSEHOLD SURVEY YOUTH — ODK CENTRAL REGISTRATION');
  console.log('='.repeat(70));
  console.log(`\nDate:        ${new Date().toISOString().split('T')[0]}`);
  console.log(`Total Youth: ${householdYouth.length}`);
  console.log(`Mode:        ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '🚀 LIVE EXECUTION'}`);

  console.log(`\nODK:  ${CONFIG.baseUrl}  |  Project: ${CONFIG.projectId}  |  Form: ${CONFIG.formId}`);

  const client = await pool.connect();

  try {
    await addToDatabase(client);

    if (DRY_RUN) {
      console.log('\n📱 STEP 2: ODK Registration (DRY RUN)');
      console.log('  Would register all 30 youth on ODK Central');
      console.log('\n' + '='.repeat(70));
      console.log('DRY RUN COMPLETE — no changes made');
      console.log('='.repeat(70));
      console.log('\nTo execute for real, run:');
      console.log('  node scripts/register-household-survey.js');
      return;
    }

    // Authenticate with ODK Central
    console.log('\n🔐 Authenticating with ODK Central...');
    const loginRes = await makeRequest('POST', '/v1/sessions', {
      email: CONFIG.email,
      password: CONFIG.password,
    });
    const token = loginRes.data.token;
    console.log('  ✓ Authenticated\n');

    const results = await registerOnODK(client, token);

    console.log('\n' + '='.repeat(70));
    console.log('REGISTRATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n✓  Registered:             ${results.success.length}`);
    console.log(`⏩ Skipped (already done): ${results.skipped.length}`);
    console.log(`✗  Failed:                 ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log('\nFailed:');
      results.failed.forEach(f => console.log(`  - ${f.id} (${f.name}): ${f.error}`));
    }

    if (results.success.length > 0) {
      console.log('\n✨ Youth can now access their QR codes on the platform.');
      console.log('   URL: https://learn.spatialcollective.co.ke');
    }

  } catch (err) {
    console.error('\n❌ ERROR:', err.message || err);
    if (err.data) console.error('Details:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

main();

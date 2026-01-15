/**
 * Export ODK Central Configuration URLs for Mobile Mappers
 * 
 * For phones that can't scan QR codes, users can manually enter the server URL.
 * 
 * Usage: node scripts/export-odk-config.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const ODK_CONFIG = {
  baseUrl: process.env.ODK_CENTRAL_URL || 'https://collector.kesmis.go.ke',
  projectId: parseInt(process.env.ODK_PROJECT_ID || '41'),
};

async function exportOdkConfig() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('='.repeat(70));
  console.log('ODK Central Configuration URLs for Mobile Mappers');
  console.log('='.repeat(70));
  console.log(`\nServer: ${ODK_CONFIG.baseUrl}`);
  console.log(`Project ID: ${ODK_CONFIG.projectId}`);
  console.log('\n');

  // Get all mobile mappers with ODK config
  const mappers = await sql`
    SELECT 
      youth_id,
      full_name,
      odk_token,
      odk_actor_id,
      odk_configured_at
    FROM youth_participants
    WHERE program_type = 'mobile_mapping'
      AND is_active = TRUE
      AND odk_token IS NOT NULL
    ORDER BY full_name
  `;

  console.log(`Found ${mappers.length} configured mobile mappers\n`);
  console.log('-'.repeat(70));

  // Table header
  console.log('| # | Unique ID | Name | Server URL |');
  console.log('|---|-----------|------|------------|');

  mappers.forEach((mapper, i) => {
    const configUrl = `${ODK_CONFIG.baseUrl}/v1/key/${mapper.odk_token}/projects/${ODK_CONFIG.projectId}`;
    console.log(`| ${i + 1} | ${mapper.youth_id} | ${mapper.full_name} | ${configUrl} |`);
  });

  console.log('\n');
  console.log('='.repeat(70));
  console.log('MANUAL SETUP INSTRUCTIONS (for phones that cannot scan QR codes):');
  console.log('='.repeat(70));
  console.log(`
1. Open ODK Collect on the phone
2. Tap the menu icon (three dots) in the top right
3. Select "Add project"  
4. Tap "Manually enter project details" (instead of scanning QR)
5. Enter the Server URL from the table above for that user
6. Leave username and password BLANK (token authentication)
7. Tap "Add"
`);

  // Also export as CSV
  console.log('\n--- CSV FORMAT (copy below) ---\n');
  console.log('Unique_ID,Name,Server_URL');
  mappers.forEach(mapper => {
    const configUrl = `${ODK_CONFIG.baseUrl}/v1/key/${mapper.odk_token}/projects/${ODK_CONFIG.projectId}`;
    console.log(`${mapper.youth_id},"${mapper.full_name}",${configUrl}`);
  });

  // Users without config
  const unconfigured = await sql`
    SELECT youth_id, full_name
    FROM youth_participants
    WHERE program_type = 'mobile_mapping'
      AND is_active = TRUE
      AND (odk_token IS NULL OR odk_token = '')
    ORDER BY full_name
  `;

  if (unconfigured.length > 0) {
    console.log('\n');
    console.log('='.repeat(70));
    console.log(`⚠️  ${unconfigured.length} MAPPERS NOT YET CONFIGURED ON ODK CENTRAL:`);
    console.log('='.repeat(70));
    unconfigured.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.youth_id} - ${m.full_name}`);
    });
    console.log('\nRun: node scripts/odk-central-register-all.js to register them');
  }
}

exportOdkConfig().catch(console.error);

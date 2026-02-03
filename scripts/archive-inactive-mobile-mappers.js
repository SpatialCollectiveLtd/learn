const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Archive Inactive Mobile Mappers Without ODK Setup
 * 
 * This script archives mobile mapping youth who:
 * 1. Have program_type = 'mobile_mapping'
 * 2. Do NOT have odk_actor_id set (never configured ODK)
 * 3. Are currently marked as active (is_active = true)
 * 
 * These users never participated and should be archived for historical records.
 */

async function archiveInactiveMobileMappers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ARCHIVE INACTIVE MOBILE MAPPERS\n');
    console.log('═'.repeat(60));
    
    // Step 1: Find mobile mappers without ODK setup
    console.log('\n📋 Step 1: Finding inactive mobile mappers...\n');
    
    const inactiveMappers = await client.query(`
      SELECT 
        youth_id,
        full_name,
        settlement,
        email,
        phone_number,
        created_at,
        is_active,
        odk_actor_id,
        odk_configured_at
      FROM youth_participants
      WHERE program_type = 'mobile_mapping'
        AND odk_actor_id IS NULL
        AND is_active = true
      ORDER BY settlement, full_name
    `);
    
    const count = inactiveMappers.rows.length;
    
    if (count === 0) {
      console.log('✅ No inactive mobile mappers found. All users either have ODK setup or are already archived.\n');
      return;
    }
    
    console.log(`Found ${count} mobile mappers without ODK setup:\n`);
    
    // Group by settlement
    const bySettlement = {};
    inactiveMappers.rows.forEach(mapper => {
      if (!bySettlement[mapper.settlement]) {
        bySettlement[mapper.settlement] = [];
      }
      bySettlement[mapper.settlement].push(mapper);
    });
    
    // Display grouped results
    for (const [settlement, mappers] of Object.entries(bySettlement)) {
      console.log(`\n${settlement} (${mappers.length} users):`);
      mappers.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.youth_id} - ${m.full_name}`);
        console.log(`     Created: ${new Date(m.created_at).toLocaleDateString()}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total to archive: ${count} mobile mappers`);
    for (const [settlement, mappers] of Object.entries(bySettlement)) {
      console.log(`   - ${settlement}: ${mappers.length}`);
    }
    
    // Step 2: Confirm before proceeding
    console.log('\n⚠️  WARNING: This will set is_active = false for these users.');
    console.log('   They will no longer be able to log in or appear in active reports.\n');
    
    // In production, you might want to add a confirmation prompt here
    // For now, we'll add a dry-run check
    const isDryRun = process.argv.includes('--dry-run');
    
    if (isDryRun) {
      console.log('🔒 DRY RUN MODE - No changes will be made.\n');
      console.log('To execute archiving, run without --dry-run flag:\n');
      console.log('   node scripts/archive-inactive-mobile-mappers.js\n');
      return;
    }
    
    // Step 3: Create backup
    console.log('\n💾 Step 2: Creating backup...\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupData = {
      timestamp,
      script: 'archive-inactive-mobile-mappers.js',
      reason: 'Archiving mobile mappers without ODK setup (never participated)',
      count,
      users: inactiveMappers.rows
    };
    
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `inactive_mobile_mappers_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${path.basename(backupFile)}\n`);
    
    // Step 4: Archive users (set is_active = false)
    console.log('🗄️  Step 3: Archiving users...\n');
    
    await client.query('BEGIN');
    
    try {
      const result = await client.query(`
        UPDATE youth_participants
        SET 
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE program_type = 'mobile_mapping'
          AND odk_actor_id IS NULL
          AND is_active = true
        RETURNING youth_id, full_name, settlement
      `);
      
      await client.query('COMMIT');
      
      console.log(`✅ Successfully archived ${result.rows.length} mobile mappers:\n`);
      
      // Group archived users by settlement
      const archivedBySettlement = {};
      result.rows.forEach(user => {
        if (!archivedBySettlement[user.settlement]) {
          archivedBySettlement[user.settlement] = [];
        }
        archivedBySettlement[user.settlement].push(user);
      });
      
      for (const [settlement, users] of Object.entries(archivedBySettlement)) {
        console.log(`\n${settlement} (${users.length} archived):`);
        users.forEach((u, idx) => {
          console.log(`  ${idx + 1}. ${u.youth_id} - ${u.full_name}`);
        });
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    // Step 5: Verify results
    console.log('\n' + '═'.repeat(60));
    console.log('\n🔍 Step 4: Verifying results...\n');
    
    const verification = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true AND odk_actor_id IS NOT NULL) as active_with_odk,
        COUNT(*) FILTER (WHERE is_active = true AND odk_actor_id IS NULL) as active_without_odk,
        COUNT(*) FILTER (WHERE is_active = false) as archived,
        COUNT(*) as total
      FROM youth_participants
      WHERE program_type = 'mobile_mapping'
    `);
    
    const stats = verification.rows[0];
    
    console.log('📊 MOBILE MAPPERS STATUS:');
    console.log(`   Active with ODK:     ${stats.active_with_odk} ✅`);
    console.log(`   Active without ODK:  ${stats.active_without_odk} ${stats.active_without_odk === '0' ? '✅' : '⚠️'}`);
    console.log(`   Archived:            ${stats.archived}`);
    console.log(`   Total:               ${stats.total}`);
    
    if (stats.active_without_odk === '0') {
      console.log('\n✅ SUCCESS: All mobile mappers without ODK are now archived!\n');
    } else {
      console.log(`\n⚠️  WARNING: ${stats.active_without_odk} active users still don't have ODK setup.\n`);
    }
    
    // Step 6: Generate restoration script
    console.log('═'.repeat(60));
    console.log('\n📝 Step 5: Generating restoration script...\n');
    
    const restoreScript = `-- Restore Archived Mobile Mappers
-- Generated: ${new Date().toISOString()}
-- Backup file: ${path.basename(backupFile)}

-- WARNING: Only run this if archiving was done in error!

BEGIN;

-- Restore all archived mobile mappers
UPDATE youth_participants
SET 
  is_active = true,
  updated_at = CURRENT_TIMESTAMP
WHERE youth_id IN (
  ${inactiveMappers.rows.map(m => `'${m.youth_id}'`).join(',\n  ')}
);

-- Verify restoration
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as restored,
  COUNT(*) as total
FROM youth_participants
WHERE youth_id IN (
  ${inactiveMappers.rows.map(m => `'${m.youth_id}'`).join(',\n  ')}
);

-- If correct, commit the transaction
COMMIT;

-- If incorrect, rollback
-- ROLLBACK;
`;
    
    const restoreFile = path.join(backupDir, `restore_inactive_mobile_mappers_${timestamp}.sql`);
    fs.writeFileSync(restoreFile, restoreScript);
    
    console.log(`✅ Restoration script created: ${path.basename(restoreFile)}\n`);
    
    console.log('═'.repeat(60));
    console.log('\n✅ ARCHIVING COMPLETE!\n');
    console.log('📁 Backup files created in backups/ directory:');
    console.log(`   - ${path.basename(backupFile)} (JSON data)`);
    console.log(`   - ${path.basename(restoreFile)} (SQL restore script)\n`);
    console.log('💡 To restore archived users (if needed):');
    console.log(`   psql $DATABASE_URL -f backups/${path.basename(restoreFile)}\n`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  console.log('\n' + '═'.repeat(60));
  console.log('  ARCHIVE INACTIVE MOBILE MAPPERS');
  console.log('═'.repeat(60) + '\n');
  
  if (process.argv.includes('--help')) {
    console.log('Usage:');
    console.log('  node scripts/archive-inactive-mobile-mappers.js [options]\n');
    console.log('Options:');
    console.log('  --dry-run    Show what would be archived without making changes');
    console.log('  --help       Show this help message\n');
    console.log('Description:');
    console.log('  Archives mobile mapping youth who never configured ODK.');
    console.log('  Sets is_active = false for users with:');
    console.log('    - program_type = mobile_mapping');
    console.log('    - odk_actor_id IS NULL');
    console.log('    - is_active = true\n');
    console.log('Safety:');
    console.log('  - Creates JSON backup before archiving');
    console.log('  - Generates SQL restoration script');
    console.log('  - Uses database transaction (can rollback on error)\n');
    process.exit(0);
  }
  
  archiveInactiveMobileMappers()
    .then(() => {
      console.log('Script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { archiveInactiveMobileMappers };

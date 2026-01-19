/**
 * Update youth assignments:
 * 1. Move Regina Nzoka (KAY348RN) from Mobile Mapping to Digitization
 * 2. Ensure Josephine Wambua (KAY269JW) is assigned to Mobile Mapping with ODK access
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Generate ODK token
function generateODKToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function updateYouthAssignments() {
  console.log('🔄 Updating Youth Assignments\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Move Regina Nzoka from Mobile Mapping to Digitization
    console.log('1️⃣ Moving Regina Nzoka (KAY348RN) to Digitization...');
    const reginaUpdate = await client.query(`
      UPDATE youth_participants
      SET 
        program_type = 'digitization',
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = 'KAY348RN'
      RETURNING youth_id, full_name, program_type
    `);

    if (reginaUpdate.rows.length > 0) {
      console.log(`   ✅ ${reginaUpdate.rows[0].full_name} (${reginaUpdate.rows[0].youth_id})`);
      console.log(`      Program: ${reginaUpdate.rows[0].program_type}`);
    } else {
      console.log('   ⚠️  Regina Nzoka not found in database');
    }

    // 2. Check if Josephine exists
    console.log('\n2️⃣ Setting up Josephine Wambua (KAY269JW) for Mobile Mapping...');
    const josephineCheck = await client.query(`
      SELECT youth_id, full_name, program_type, odk_token, is_active
      FROM youth_participants
      WHERE youth_id = 'KAY269JW'
    `);

    if (josephineCheck.rows.length === 0) {
      // Insert Josephine
      const odkToken = generateODKToken();
      const josephineInsert = await client.query(`
        INSERT INTO youth_participants (
          youth_id, 
          full_name, 
          program_type, 
          settlement,
          odk_token,
          is_active
        )
        VALUES ('KAY269JW', 'Josephine Wambua', 'mobile_mapping', 'Kayole Soweto', $1, TRUE)
        RETURNING youth_id, full_name, program_type, odk_token
      `, [odkToken]);

      console.log(`   ✅ Created: ${josephineInsert.rows[0].full_name} (${josephineInsert.rows[0].youth_id})`);
      console.log(`      Program: ${josephineInsert.rows[0].program_type}`);
      console.log(`      ODK Token: ${josephineInsert.rows[0].odk_token.substring(0, 16)}...`);
    } else {
      // Update Josephine - ensure mobile_mapping and ODK token
      const existing = josephineCheck.rows[0];
      const odkToken = existing.odk_token || generateODKToken();
      
      const josephineUpdate = await client.query(`
        UPDATE youth_participants
        SET 
          program_type = 'mobile_mapping',
          settlement = 'Kayole Soweto',
          odk_token = $1,
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE youth_id = 'KAY269JW'
        RETURNING youth_id, full_name, program_type, odk_token
      `, [odkToken]);

      console.log(`   ✅ Updated: ${josephineUpdate.rows[0].full_name} (${josephineUpdate.rows[0].youth_id})`);
      console.log(`      Program: ${josephineUpdate.rows[0].program_type}`);
      console.log(`      ODK Token: ${josephineUpdate.rows[0].odk_token.substring(0, 16)}...`);
    }

    await client.query('COMMIT');
    console.log('\n✅ All updates completed successfully!\n');

    // Summary
    console.log('📊 Summary:');
    const summary = await client.query(`
      SELECT 
        youth_id,
        full_name,
        program_type,
        CASE WHEN odk_token IS NOT NULL THEN 'Yes' ELSE 'No' END as has_odk_access,
        is_active
      FROM youth_participants
      WHERE youth_id IN ('KAY348RN', 'KAY269JW')
      ORDER BY youth_id
    `);

    summary.rows.forEach(row => {
      console.log(`   ${row.full_name} (${row.youth_id})`);
      console.log(`   - Program: ${row.program_type}`);
      console.log(`   - ODK Access: ${row.has_odk_access}`);
      console.log(`   - Active: ${row.is_active}`);
      console.log('');
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateYouthAssignments().catch(console.error);

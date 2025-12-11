// Script to add new settlements and youth participants
// Adds 28 new youth: 7 from Mji wa Huruma, 21 from Kariobangi Machakos

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function addNewYouth() {

  try {
    console.log('✅ Connected to database\n');

    // Step 1: Add settlement column
    console.log('📍 STEP 1: Adding settlement column...');
    await sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public'
              AND table_name = 'youth_participants' 
              AND column_name = 'settlement'
          ) THEN
              ALTER TABLE youth_participants 
              ADD COLUMN settlement VARCHAR(100);
              
              RAISE NOTICE 'Added settlement column';
          ELSE
              RAISE NOTICE 'settlement column already exists';
          END IF;
      END $$;
    `;

    // Create index
    await sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_indexes 
              WHERE schemaname = 'public'
              AND tablename = 'youth_participants' 
              AND indexname = 'idx_youth_settlement'
          ) THEN
              CREATE INDEX idx_youth_settlement ON youth_participants(settlement);
          END IF;
      END $$;
    `;

    // Update existing Kayole youth
    const kayoleUpdate = await sql`
      UPDATE youth_participants 
      SET settlement = 'Kayole' 
      WHERE youth_id LIKE 'KAY%' AND settlement IS NULL
      RETURNING youth_id
    `;
    console.log(`✓ Updated ${kayoleUpdate.rowCount} existing Kayole youth with settlement\n`);

    // Step 2: Insert Mji wa Huruma youth
    console.log('🏘️  STEP 2: Adding Mji wa Huruma youth...');
    const hurumaYouth = [
      ['HUR728CM', 'Catherine Mararo'],
      ['HUR801DN', 'Dennis Njuguna'],
      ['HUR478JM', 'John Mbugua'],
      ['HUR765JN', 'John Ngigi'],
      ['HUR564KM', 'Lydia Mwove'],
      ['HUR455MM', 'Martin Mbugua'],
      ['HUR768SW', 'Stephen Wanjiru']
    ];

    for (const [id, name] of hurumaYouth) {
      await sql`
        INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
        VALUES (${id}, ${name}, 'digitization', 'Mji wa Huruma', TRUE)
        ON CONFLICT (youth_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          program_type = EXCLUDED.program_type,
          settlement = EXCLUDED.settlement,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
      `;
      console.log(`  ✓ ${id} - ${name}`);
    }
    console.log(`✅ Added ${hurumaYouth.length} Mji wa Huruma youth\n`);

    // Step 3: Insert Kariobangi Machakos youth
    console.log('🏘️  STEP 3: Adding Kariobangi Machakos youth...');
    const kariobangiYouth = [
      ['KAR119BN', 'Bill Njiru'],
      ['KAR412CM', 'Caroline Mumina'],
      ['KAR225CT', 'Charity Titus'],
      ['KAR298DK', 'Diana Kasyula'],
      ['KAR386DM', 'Domitilla Mutunga'],
      ['KAR327EM', 'Eddis Maina'],
      ['KAR322FK', 'Festus Kaluki'],
      ['KAR224FM', 'Fredinah Mbai'],
      ['KAR074GA', 'George Alaka'],
      ['KAR369JJ', 'Jeremiah James'],
      ['KAR083JK', 'Joel Kihuria'],
      ['KAR019JM', 'Joseph Muta'],
      ['KAR399JM', 'Josephat Mwanthi'],
      ['KAR158KK', 'Kelvin Kinyatta'],
      ['KAR078KM', 'Kelvin Mulela'],
      ['KAR339PM', 'Peter Muia'],
      ['KAR282PM', 'Prisca Musau'],
      ['KAR268SM', 'Samuel Matheka'],
      ['KAR187SM', 'Samuel Mutuku'],
      ['KAR115SO', 'Sophie Gesare'],
      ['KAR181SM', 'Stacey Mutheu']
    ];

    for (const [id, name] of kariobangiYouth) {
      await sql`
        INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
        VALUES (${id}, ${name}, 'digitization', 'Kariobangi Machakos', TRUE)
        ON CONFLICT (youth_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          program_type = EXCLUDED.program_type,
          settlement = EXCLUDED.settlement,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
      `;
      console.log(`  ✓ ${id} - ${name}`);
    }
    console.log(`✅ Added ${kariobangiYouth.length} Kariobangi Machakos youth`);
    console.log(`⚠️  Note: Denis Musau excluded (no youth_id provided)\n`);

    // Verification
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY BY SETTLEMENT');
    console.log('═══════════════════════════════════════════════════════');
    const settlementSummary = await sql`
      SELECT 
        COALESCE(settlement, 'No Settlement') as settlement,
        COUNT(*) as youth_count
      FROM youth_participants 
      GROUP BY settlement
      ORDER BY youth_count DESC
    `;
    settlementSummary.rows.forEach(row => {
      console.log(`${row.settlement.padEnd(25)} ${row.youth_count} youth`);
    });

    const totalCount = await sql`SELECT COUNT(*) as total FROM youth_participants`;
    console.log(`${'─'.repeat(55)}`);
    console.log(`${'TOTAL'.padEnd(25)} ${totalCount.rows[0].total} youth`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ ALL YOUTH PARTICIPANTS ADDED SUCCESSFULLY!');
    console.log(`✅ Total new youth added: ${hurumaYouth.length + kariobangiYouth.length} (7 Huruma + 21 Kariobangi)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

addNewYouth();

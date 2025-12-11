// Quick verification script to check new youth were added
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function verify() {
  try {
    console.log('🔍 Verifying new youth participants...\n');

    // Count by settlement
    const settlements = await sql`
      SELECT settlement, COUNT(*) as count
      FROM youth_participants
      GROUP BY settlement
      ORDER BY count DESC
    `;
    
    console.log('📊 YOUTH BY SETTLEMENT:');
    settlements.rows.forEach(row => {
      console.log(`  ${(row.settlement || 'No Settlement').padEnd(25)} ${row.count}`);
    });

    // Check Huruma youth
    const huruma = await sql`
      SELECT youth_id, full_name
      FROM youth_participants
      WHERE settlement = 'Mji wa Huruma'
      ORDER BY full_name
    `;
    
    console.log(`\n🏘️  MJI WA HURUMA (${huruma.rowCount} youth):`);
    huruma.rows.forEach(row => {
      console.log(`  ${row.youth_id} - ${row.full_name}`);
    });

    // Check Kariobangi youth
    const kariobangi = await sql`
      SELECT youth_id, full_name
      FROM youth_participants
      WHERE settlement = 'Kariobangi Machakos'
      ORDER BY full_name
    `;
    
    console.log(`\n🏘️  KARIOBANGI MACHAKOS (${kariobangi.rowCount} youth):`);
    kariobangi.rows.forEach(row => {
      console.log(`  ${row.youth_id} - ${row.full_name}`);
    });

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verify();

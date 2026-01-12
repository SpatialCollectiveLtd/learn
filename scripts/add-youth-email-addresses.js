const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function addYouthEmailAddresses() {
  try {
    console.log('🚀 Adding work email addresses to youth participants...\n');

    // Add work_email column if it doesn't exist
    console.log('1️⃣ Adding work_email column...');
    await pool.query(`
      ALTER TABLE youth_participants 
      ADD COLUMN IF NOT EXISTS work_email VARCHAR(255)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_youth_work_email 
      ON youth_participants(work_email)
    `);
    console.log('   ✅ Column and index created\n');

    // List of youth with email accounts
    const emailAccounts = [
      { youth_id: 'KAY1498DO', email: 'kay1498do@spatialcollective.co.ke' },
      { youth_id: 'KAY1154SO', email: 'kay1154so@spatialcollective.co.ke' },
      { youth_id: 'KAY2579JN', email: 'kay2579jn@spatialcollective.co.ke' },
      { youth_id: 'KAY129SL', email: 'kay129sl@spatialcollective.co.ke' },
      { youth_id: 'KAY2603GK', email: 'kay2603gk@spatialcollective.co.ke' },
      { youth_id: 'KAY1725LK', email: 'kay1725lk@spatialcollective.co.ke' },
      { youth_id: 'KAR115SO', email: 'kar115so@spatialcollective.co.ke' },
      { youth_id: 'KAR268SM', email: 'kar268sm@spatialcollective.co.ke' },
      { youth_id: 'KAR399JM', email: 'kar399jm@spatialcollective.co.ke' },
      { youth_id: 'KAR119BN', email: 'kar119bn@spatialcollective.co.ke' },
      { youth_id: 'KAR078KM', email: 'kar078km@spatialcollective.co.ke' },
      { youth_id: 'KAR225CT', email: 'kar225ct@spatialcollective.co.ke' },
      { youth_id: 'KAR083JK', email: 'kar083jk@spatialcollective.co.ke' },
      { youth_id: 'KAR327EM', email: 'kar327em@spatialcollective.co.ke' },
      { youth_id: 'KAR339PM', email: 'kar339pm@spatialcollective.co.ke' },
      { youth_id: 'KAR187SM', email: 'kar187sm@spatialcollective.co.ke' },
      { youth_id: 'KAR322FK', email: 'kar322fk@spatialcollective.co.ke' },
      { youth_id: 'KAR298DK', email: 'kar298dk@spatialcollective.co.ke' },
      { youth_id: 'KAR369JJ', email: 'kar369jj@spatialcollective.co.ke' },
      { youth_id: 'KAR158KK', email: 'kar158kk@spatialcollective.co.ke' },
      { youth_id: 'HUR455MM', email: 'hur455mm@spatialcollective.co.ke' },
      { youth_id: 'HUR801DN', email: 'hur801dn@spatialcollective.co.ke' },
      { youth_id: 'HUR765JN', email: 'hur765jn@spatialcollective.co.ke' },
      { youth_id: 'HUR185RN', email: 'hur185rn@spatialcollective.co.ke' },
      { youth_id: 'HUR756SD', email: 'hur756sd@spatialcollective.co.ke' },
      { youth_id: 'HUR768SW', email: 'hur768sw@spatialcollective.co.ke' },
      { youth_id: 'KAY2714DV', email: 'kay2714dv@spatialcollective.co.ke' },
      { youth_id: 'KAY2705AO', email: 'kay2705ao@spatialcollective.co.ke' },
      { youth_id: 'KAY2333OO', email: 'kay2333oo@spatialcollective.co.ke' },
      { youth_id: 'KAY1395MO', email: 'kay1395mo@spatialcollective.co.ke' },
      { youth_id: 'KAY251BK', email: 'kay251bk@spatialcollective.co.ke' },
      { youth_id: 'KAY2391LN', email: 'kay2391ln@spatialcollective.co.ke' },
      { youth_id: 'KAY2284SM', email: 'kay2284sm@spatialcollective.co.ke' },
      { youth_id: 'KAY209BM', email: 'kay209bm@spatialcollective.co.ke' },
      { youth_id: 'KAY2805JK', email: 'kay2805jk@spatialcollective.co.ke' },
      { youth_id: 'HUR728CM', email: 'hur728cm@spatialcollective.co.ke' },
      { youth_id: 'HUR777BW', email: 'hur777bw@spatialcollective.co.ke' },
      { youth_id: 'HUR715CW', email: 'hur715cw@spatialcollective.co.ke' },
      { youth_id: 'KAR405DM', email: 'kar405dm@spatialcollective.co.ke' },
    ];

    console.log('2️⃣ Updating youth records with email addresses...');
    let updateCount = 0;
    let notFoundCount = 0;

    for (const account of emailAccounts) {
      const result = await pool.query(
        'UPDATE youth_participants SET work_email = $1 WHERE youth_id = $2',
        [account.email, account.youth_id]
      );

      if (result.rowCount > 0) {
        updateCount++;
        console.log(`   ✅ ${account.youth_id} → ${account.email}`);
      } else {
        notFoundCount++;
        console.log(`   ⚠️  ${account.youth_id} not found in database`);
      }
    }

    console.log(`\n3️⃣ Summary:`);
    console.log(`   ✅ Updated: ${updateCount} youth`);
    console.log(`   ⚠️  Not found: ${notFoundCount} youth`);

    // Verify the updates
    console.log('\n4️⃣ Verification:');
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total_with_email,
        COUNT(DISTINCT settlement) as settlements
      FROM youth_participants 
      WHERE work_email IS NOT NULL
    `);

    console.log(`   📧 Total youth with work email: ${verifyResult.rows[0].total_with_email}`);
    console.log(`   🏘️  Settlements covered: ${verifyResult.rows[0].settlements}`);

    // Show breakdown by settlement
    const settlementBreakdown = await pool.query(`
      SELECT 
        settlement,
        COUNT(*) as count
      FROM youth_participants 
      WHERE work_email IS NOT NULL
      GROUP BY settlement
      ORDER BY settlement
    `);

    console.log('\n5️⃣ Breakdown by settlement:');
    settlementBreakdown.rows.forEach(row => {
      console.log(`   📍 ${row.settlement}: ${row.count} youth`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add EMAIL_API_URL and EMAIL_API_KEY to .env.local');
    console.log('   2. Deploy to production');
    console.log('   3. Test messages page at /dashboard/messages');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addYouthEmailAddresses();

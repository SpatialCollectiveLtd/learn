const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Youth participants data
const youthParticipants = [
  { youthId: 'KAY1278MK', firstName: 'Michelle', lastName: 'Kinya' },
  { youthId: 'KAY1498DO', firstName: 'David', lastName: 'Ouma' },
  { youthId: 'KAY1154SO', firstName: 'Steven', lastName: 'Odhiambo' },
  { youthId: 'KAY2015NM', firstName: 'Natalia', lastName: 'Mukoya' },
  { youthId: 'KAY2615VO', firstName: 'Victor', lastName: 'Omolo' },
  { youthId: 'KAY2579JN', firstName: 'Jane', lastName: 'Njuguna' },
  { youthId: 'KAY129SL', firstName: 'Selina', lastName: 'Lipukah' },
  { youthId: 'KAY2603GK', firstName: 'Gilbert', lastName: 'Karigo' },
  { youthId: 'KAY1725LK', firstName: 'Lynn', lastName: 'Waweru' },
  { youthId: 'KAY620JH', firstName: 'Jacklyne', lastName: 'Megere' },
  { youthId: 'KAY2714DV', firstName: 'Doreen', lastName: 'Vutiti' },
  { youthId: 'KAY733CM', firstName: 'Catherine', lastName: 'Muli' },
  { youthId: 'KAY2705AO', firstName: 'Austine', lastName: 'Ongonga' },
  { youthId: 'KAY2333OO', firstName: 'Oketch', lastName: 'Ochieng' },
  { youthId: 'KAY269JW', firstName: 'Josephine', lastName: 'Wambua' },
  { youthId: 'KAY1395MO', firstName: 'Mercy', lastName: 'Moraa' },
  { youthId: 'KAY251BK', firstName: 'Brian', lastName: 'Karani' },
  { youthId: 'KAY2391LN', firstName: 'Lilian', lastName: 'Naliaka' },
  { youthId: 'KAY1255GO', firstName: 'George', lastName: 'Oduor' },
  { youthId: 'KAY2284SM', firstName: 'Selah', lastName: 'Muema' },
  { youthId: 'KAY348RN', firstName: 'Regina', lastName: 'Nzoka' },
  { youthId: 'KAY2762ZA', firstName: 'Zainab', lastName: 'Ayub' },
  { youthId: 'KAY209BM', firstName: 'Ben', lastName: 'Mutua' },
  { youthId: 'KAY2326TO', firstName: 'Tony', lastName: 'Oroko' },
  { youthId: 'KAY1522KK', firstName: 'Ken', lastName: 'Kariuki' },
  { youthId: 'KAY221DK', firstName: 'Dennis', lastName: 'Kanumi' },
  { youthId: 'KAY2805JK', firstName: 'Joe', lastName: 'Kimani' }
];

async function registerYouth() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Neon PostgreSQL database...\n');
    console.log('Registering 27 youth participants for Digitization Program...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const youth of youthParticipants) {
      try {
        // Check if youth already exists
        const checkResult = await client.query(
          'SELECT youth_id FROM youth_participants WHERE youth_id = $1',
          [youth.youthId]
        );
        
        if (checkResult.rows.length > 0) {
          console.log(`⚠️  ${youth.youthId} - ${youth.firstName} ${youth.lastName} (already exists)`);
          skipCount++;
          continue;
        }
        
        // Insert new youth participant
        const fullName = `${youth.firstName} ${youth.lastName}`;
        const email = `${youth.firstName.toLowerCase()}.${youth.lastName.toLowerCase()}@spatialcollective.co.ke`;
        
        await client.query(`
          INSERT INTO youth_participants (
            youth_id, 
            full_name, 
            email, 
            program_type, 
            is_active
          ) VALUES ($1, $2, $3, $4, $5)
        `, [youth.youthId, fullName, email, 'digitization', true]);
        
        console.log(`✅ ${youth.youthId} - ${fullName}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error inserting ${youth.youthId}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Registration Summary:`);
    console.log(`  ✅ Successfully registered: ${successCount}`);
    console.log(`  ⚠️  Already existed: ${skipCount}`);
    console.log(`  📊 Total processed: ${youthParticipants.length}`);
    console.log('='.repeat(60));
    
    // Verify total count
    const countResult = await client.query(
      "SELECT COUNT(*) as total FROM youth_participants WHERE program_type = 'digitization'"
    );
    console.log(`\n📈 Total digitization participants in database: ${countResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

registerYouth()
  .then(() => {
    console.log('\n🎉 Youth registration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Registration error:', error);
    process.exit(1);
  });

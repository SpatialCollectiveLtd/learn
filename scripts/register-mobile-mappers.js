/**
 * Register Mobile Mappers for Kayole Soweto
 * 
 * This script registers 100 mobile mappers from the Mobile Mappers.md file
 * and sets up the settlement work configuration for the 20-day work period
 * starting January 14, 2026.
 * 
 * Usage: node scripts/register-mobile-mappers.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Mobile Mappers data from Mobile Mappers.md
const mobileMappers = [
  { youthId: 'KAY348RN', firstName: 'Regina', lastName: 'Nzoka' },
  { youthId: 'KAY1278MK', firstName: 'Michelle', lastName: 'Kinya' },
  { youthId: 'KAY2015NM', firstName: 'Natalia', lastName: 'Mukoya' },
  { youthId: 'KAY2615VO', firstName: 'Victor', lastName: 'Omolo' },
  { youthId: 'KAY1383EN', firstName: 'Edward', lastName: 'Njue' },
  { youthId: 'KAY269JW', firstName: 'Josephine', lastName: 'Wambua' },
  { youthId: 'KAY1255GO', firstName: 'George', lastName: 'Oduor' },
  { youthId: 'KAY2326TO', firstName: 'Tony', lastName: 'Oroko' },
  { youthId: 'KAY2239NW', firstName: 'Wanjiku', lastName: 'Waithera' },
  { youthId: 'KAY1771NN', firstName: 'Nancy', lastName: 'Nderitu' },
  { youthId: 'KAY614FO', firstName: 'Francis', lastName: 'Okello' },
  { youthId: 'KAY621AM', firstName: 'Ann', lastName: 'Mwangi' },
  { youthId: 'KAY620JH', firstName: 'Jacklyne', lastName: 'Megere' },
  { youthId: 'KAY1840TM', firstName: 'Teddy', lastName: 'Mutua' },
  { youthId: 'KAY1353CW', firstName: 'Catherine', lastName: 'Wambua' },
  { youthId: 'KAY2762ZA', firstName: 'Zainab', lastName: 'Ayub' },
  { youthId: 'KAY2070EM', firstName: 'Emily', lastName: 'Munywoki' },
  { youthId: 'KAY498AW', firstName: 'Anne', lastName: 'Wainaina' },
  { youthId: 'KAY2065BW', firstName: 'Bonface', lastName: 'Mwaura' },
  { youthId: 'KAY2675PM', firstName: 'Peterson', lastName: 'Mwangi' },
  { youthId: 'KAY413GG', firstName: 'George', lastName: 'Githua' },
  { youthId: 'KAY1042KM', firstName: 'Keziah', lastName: 'Maina' },
  { youthId: 'KAY1008BO', firstName: 'Brian', lastName: 'Otieno' },
  { youthId: 'KAY264EM', firstName: 'Esther', lastName: 'Mwangi' },
  { youthId: 'KAY1007FO', firstName: 'Faith', lastName: 'Ochieng' },
  { youthId: 'KAY465DO', firstName: 'David', lastName: 'Omondi' },
  { youthId: 'KAY744IA', firstName: 'Isaac', lastName: 'Oduory' },
  { youthId: 'KAY1604FA', firstName: 'Fidelis', lastName: 'Wanjiru' },
  { youthId: 'KAY2802NM', firstName: 'Naffert', lastName: 'Mburu' },
  { youthId: 'KAY237FM', firstName: 'Faith', lastName: 'Mutua' },
  { youthId: 'KAY1000GN', firstName: 'Grace', lastName: 'Syombua' },
  { youthId: 'KAY1619JG', firstName: 'Josphat', lastName: 'Gitahi' },
  { youthId: 'KAY2412FO', firstName: 'Felix', lastName: 'Ochieng' },
  { youthId: 'KAY1990MM', firstName: 'Monica', lastName: 'Mawilu' },
  { youthId: 'KAY2188EG', firstName: 'Ephantus', lastName: 'Githinji' },
  { youthId: 'KAY2501CM', firstName: 'Caroline', lastName: 'Maina' },
  { youthId: 'KAY2423BO', firstName: 'Brian', lastName: 'Ogeloh' },
  { youthId: 'KAY2647MN', firstName: 'Mary', lastName: 'Ndenga' },
  { youthId: 'KAY760SK', firstName: 'Stephen', lastName: 'Karanja' },
  { youthId: 'KAY1230CA', firstName: 'Clinton', lastName: 'Awino' },
  { youthId: 'KAY2251TK', firstName: 'Titus', lastName: 'Kutula' },
  { youthId: 'KAY2531JO', firstName: 'Jackson', lastName: 'Ochieng' },
  { youthId: 'KAY2093GN', firstName: 'Geoffrey', lastName: 'Ndegwa' },
  { youthId: 'KAY1528CM', firstName: 'Celine', lastName: 'Macharia' },
  { youthId: 'KAY1537MW', firstName: 'Maurine', lastName: 'Apora' },
  { youthId: 'KAY955HO', firstName: 'Hillam', lastName: 'Osogo' },
  { youthId: 'KAY2549EG', firstName: 'Edward', lastName: 'Opiyo' },
  { youthId: 'KAY2529RW', firstName: 'Ruth', lastName: 'Wainaina' },
  { youthId: 'KAY2301SA', firstName: 'Solomon', lastName: 'Ashiono' },
  { youthId: 'KAY974VE', firstName: 'Vivian', lastName: 'Ekhalie' },
  { youthId: 'KAY2071PG', firstName: 'Pharis', lastName: 'Gacini' },
  { youthId: 'KAY2279JN', firstName: 'Joseph', lastName: 'Maina' },
  { youthId: 'KAY1177MS', firstName: 'Mary', lastName: 'Hatayi' },
  { youthId: 'KAY1223AK', firstName: 'Annah', lastName: 'Kimakiru' },
  { youthId: 'KAY1731EM', firstName: 'Esther', lastName: 'Maina' },
  { youthId: 'KAY2642PO', firstName: 'Philisian', lastName: 'Ochieng' },
  { youthId: 'KAY880LK', firstName: 'Lucywell', lastName: 'Kiunjuri' },
  { youthId: 'KAY098JO', firstName: 'Juliet', lastName: 'Achieng' },
  { youthId: 'KAY2031KM', firstName: 'Kelly', lastName: 'Muigai' },
  { youthId: 'KAY132DN', firstName: 'David', lastName: 'Ngemi' },
  { youthId: 'KAY2587RM', firstName: 'Rooney', lastName: 'Masila' },
  { youthId: 'KAY1143IM', firstName: 'Ivor', lastName: 'Mwangi' },
  { youthId: 'KAY1973FM', firstName: 'Francis', lastName: 'Mwendwa' },
  { youthId: 'KAY2465DN', firstName: 'Daniel', lastName: 'Ngugi' },
  { youthId: 'KAY1506DM', firstName: 'Dennis', lastName: 'Mutinda' },
  { youthId: 'KAY2687MN', firstName: 'Mary', lastName: 'Nthenya' },
  { youthId: 'KAY1504BA', firstName: 'Brian', lastName: 'Koli' },
  { youthId: 'KAY2190FM', firstName: 'Francis', lastName: 'Muthoni' },
  { youthId: 'KAY1640JM', firstName: 'Joab', lastName: 'Mandu' },
  { youthId: 'KAY2468HO', firstName: 'Hellen', lastName: 'Okoth' },
  { youthId: 'KAY1799DM', firstName: 'David', lastName: 'Mandu' },
  { youthId: 'KAY2570SM', firstName: 'Samuel', lastName: 'Mbiyu' },
  { youthId: 'KAY1681JM', firstName: 'Joyce', lastName: 'Motaroki' },
  { youthId: 'KAY461VO', firstName: 'Valary', lastName: "Ochieng'" },
  { youthId: 'KAY1975NM', firstName: 'Nancy', lastName: 'Mutinda' },
  { youthId: 'KAY1726RN', firstName: 'Reuben', lastName: 'Nyangweso' },
  { youthId: 'KAY2134VW', firstName: 'Veronica', lastName: 'Wambua' },
  { youthId: 'KAY778DT', firstName: 'Daudi', lastName: 'Tarangei' },
  { youthId: 'KAY2544DG', firstName: 'Denis', lastName: 'Gitahi' },
  { youthId: 'KAY1166AM', firstName: 'Abigail', lastName: 'Mukoko' },
  { youthId: 'KAY2248LK', firstName: 'Louse', lastName: 'Kitunda' },
  { youthId: 'KAY574GK', firstName: 'Getrude', lastName: 'Kamau' },
  { youthId: 'KAY2085SB', firstName: 'Samuel', lastName: 'Bogonko' },
  { youthId: 'KAY346CC', firstName: 'Charles', lastName: 'Chomba' },
  { youthId: 'KAY1398PO', firstName: 'Pauline', lastName: 'Owino' },
  { youthId: 'KAY291SM', firstName: 'Sharon', lastName: 'Makanga' },
  { youthId: 'KAY1092LJ', firstName: 'Lucy', lastName: 'Idarasia' },
  { youthId: 'KAY1138SM', firstName: 'Stephen', lastName: 'Muturi' },
  { youthId: 'KAY1380MM', firstName: 'Merlyne', lastName: 'Matseshe' },
  { youthId: 'KAY2754JD', firstName: 'Joyce', lastName: 'Daniel' },
  { youthId: 'KAY1614VA', firstName: 'Vivian Awino', lastName: 'Arango' },
  { youthId: 'KAY2491PL', firstName: 'Pauline', lastName: 'Lukhachi' },
  { youthId: 'KAY924LO', firstName: 'Lilian', lastName: 'Ondieki' },
  { youthId: 'KAY1994KK', firstName: 'Kenan', lastName: 'Konde' },
  { youthId: 'KAY2546PW', firstName: 'Peter', lastName: 'Wambui' },
  { youthId: 'KAY868JN', firstName: 'Joy', lastName: 'Nzomo' },
  { youthId: 'KAY1448PO', firstName: 'Paul', lastName: 'Omondi' },
  { youthId: 'KAY2490AM', firstName: 'Agnes', lastName: 'Mutuku' },
  { youthId: 'KAY288SM', firstName: 'Stephen', lastName: 'Mathu' },
  { youthId: 'KAY467DN', firstName: 'Debrah', lastName: "Nyaang'a" },
];

async function registerMobileMappers() {
  console.log('🚀 Starting Mobile Mappers Registration for Kayole Soweto');
  console.log('📅 Work Period: January 14, 2026 - 20 weekdays');
  console.log('👥 Total Youth: ' + mobileMappers.length);
  console.log('');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let inserted = 0;
    let updated = 0;
    let errors = [];
    
    // Register each mobile mapper
    for (const mapper of mobileMappers) {
      const fullName = `${mapper.firstName} ${mapper.lastName}`;
      
      try {
        const result = await client.query(`
          INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
          VALUES ($1, $2, 'mobile_mapping', 'Kayole Soweto', TRUE)
          ON CONFLICT (youth_id) DO UPDATE SET
            program_type = 'mobile_mapping',
            settlement = 'Kayole Soweto',
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS was_inserted
        `, [mapper.youthId, fullName]);
        
        if (result.rows[0].was_inserted) {
          inserted++;
        } else {
          updated++;
        }
      } catch (err) {
        errors.push({ youthId: mapper.youthId, error: err.message });
      }
    }
    
    console.log(`✅ Inserted: ${inserted} new mobile mappers`);
    console.log(`🔄 Updated: ${updated} existing records`);
    
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
      errors.forEach(e => console.log(`   - ${e.youthId}: ${e.error}`));
    }
    
    // Add settlement work configuration
    console.log('\n📋 Setting up Settlement Work Configuration...');
    
    await client.query(`
      INSERT INTO settlement_work_config (
        settlement,
        program_type,
        start_date,
        total_work_days,
        daily_target,
        is_active
      ) VALUES (
        'Kayole Soweto',
        'mobile_mapping',
        '2026-01-14',
        20,
        10,
        TRUE
      )
      ON CONFLICT (settlement, program_type) 
      DO UPDATE SET
        start_date = '2026-01-14',
        total_work_days = 20,
        daily_target = 10,
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('✅ Settlement work configuration set');
    console.log('   Settlement: Kayole Soweto');
    console.log('   Program: mobile_mapping');
    console.log('   Start Date: January 14, 2026');
    console.log('   Total Days: 20');
    
    await client.query('COMMIT');
    
    // Final verification
    console.log('\n📊 Verification:');
    
    const countResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM youth_participants 
      WHERE program_type = 'mobile_mapping' 
        AND settlement = 'Kayole Soweto'
        AND is_active = TRUE
    `);
    console.log(`   Total mobile mappers in Kayole Soweto: ${countResult.rows[0].count}`);
    
    console.log('\n✅ Registration complete!');
    console.log('📱 Mobile mappers can now login with their KAY IDs');
    console.log('📚 They will see Mobile Mapping training content');
    console.log('📅 Work period starts: January 14, 2026');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Registration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

registerMobileMappers().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function verifyUserAssignments() {
  const pool = new Pool({
    connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const digitizationUsers = [
    'KAY1498DO', 'KAY1154SO', 'KAY2579JN', 'KAY129SL', 'KAY2603GK', 'KAY1725LK',
    'KAR115SO', 'KAR268SM', 'KAR399JM', 'KAR119BN', 'KAR078KM', 'KAR225CT',
    'KAR083JK', 'KAR327EM', 'KAR339PM', 'KAR187SM', 'KAR322FK', 'KAR298DK',
    'KAR369JJ', 'KAR158KK', 'HUR455MM', 'HUR801DN', 'HUR765JN', 'HUR185RN',
    'HUR756SD', 'HUR768SW', 'KAY2714DV', 'KAY2705AO', 'KAY2333OO', 'KAY1395MO',
    'KAY251BK', 'KAY2391LN', 'KAY2284SM', 'KAY209BM', 'KAY2805JK', 'HUR728CM',
    'HUR777BW', 'HUR715CW', 'KAR405DM'
  ];

  const mobileMappingUsers = [
    'KAY348RN', 'KAY1278MK', 'KAY2015NM', 'KAY2615VO', 'KAR074GA', 'HUR610SW',
    'HUR689DM', 'KAY733CM', 'KAY269JW', 'KAY1255GO', 'KAY2326TO', 'KAY2239NW',
    'KAY1771NN', 'KAY614FO', 'KAY621AM', 'KAY620JH', 'KAY1840TM', 'KAY1353CW',
    'KAY2762ZA', 'KAY2070EM', 'KAY498AW', 'KAY2065BW', 'KAY2675PM', 'KAY413GG',
    'KAY1042KM', 'KAY1008BO', 'KAY264EM', 'KAY1007FO', 'KAY465DO', 'KAY744IA',
    'KAY1604FA', 'KAY2802NM', 'KAY237FM', 'KAY1000GN', 'KAY1619JG', 'KAY2412FO',
    'KAY1990MM', 'KAY2188EG', 'KAY2501CM', 'KAY2423BO', 'KAY2647MN', 'KAY760SK',
    'KAY1230CA', 'KAY2251TK', 'KAY2531JO', 'KAY2093GN', 'KAY1528CM', 'KAY1537MW',
    'KAY955HO', 'KAY2549EG', 'KAY2529RW', 'KAY2301SA', 'KAY974VE', 'KAY2071PG',
    'KAY2279JN', 'KAY1177MS', 'KAY1223AK', 'KAY1731EM', 'KAY2642PO', 'KAY880LK',
    'KAY098JO', 'KAY2031KM', 'KAY132DN', 'KAY2587RM', 'KAY1143IM', 'KAY1973FM',
    'KAY2465DN', 'KAY1506DM', 'KAY2687MN', 'KAR040JK', 'KAR422MM', 'KAR127FM',
    'KAR345WM', 'KAR350MM', 'KAR370PM', 'KAR192TK', 'KAR188MN', 'KAR189CM',
    'KAR297CM', 'KAR393CM', 'KAR439SN', 'KAR008CM', 'KAR456PE', 'KAR212MN',
    'KAR342RK', 'KAR447MK', 'KAR128DM', 'KAR090KM', 'KAR385JM', 'KAR394EM',
    'KAR096WM', 'KAR341CW', 'KAR290SK', 'KAR285JM', 'KAR284KM', 'KAR092GS',
    'KAR009MM', 'KAR108BM', 'KAR112CM', 'KAR023MK', 'KAR388JM', 'KAR208TS',
    'KAR404RM', 'KAR446FM', 'KAR026MM', 'KAR371MM', 'KAR191VM', 'KAR029AN',
    'HUR478JM', 'HUR438PW', 'HUR468GW', 'HUR558AC', 'HUR703SN', 'HUR714AK',
    'HUR386PM', 'HUR659SM', 'HUR452DM', 'HUR503EN', 'HUR600HW', 'HUR772BN',
    'HUR770AN', 'HUR773MN', 'HUR564KM', 'HUR788AW', 'HUR792SW', 'HUR343SK',
    'KAY1504BA', 'KAY2190FM', 'KAY1640JM', 'KAY2468HO', 'KAY1799DM', 'KAY2570SM',
    'KAY1681JM', 'KAY461VO', 'KAY1975NM', 'KAY1726RN', 'KAY2134VW', 'KAY778DT',
    'KAY2544DG', 'KAY1166AM', 'KAY2248LK', 'KAY574GK', 'KAY2085SB', 'KAY346CC',
    'KAY1398PO', 'KAY291SM', 'KAY1092LJ', 'KAY1138SM', 'KAY1380MM', 'KAY2754JD',
    'KAY1614VA', 'KAY2491PL', 'KAY924LO', 'KAY1994KK', 'KAY2546PW', 'KAY868JN',
    'KAY1448PO', 'KAY2490AM', 'KAY288SM', 'KAY467DN'
  ];

  try {
    console.log('\n🔍 VERIFYING USER PROGRAM ASSIGNMENTS');
    console.log('='.repeat(80));

    // Check digitization users
    console.log(`\n📋 CHECKING ${digitizationUsers.length} DIGITIZATION USERS...`);
    const digiResult = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment
      FROM youth_participants
      WHERE youth_id = ANY($1)
      ORDER BY youth_id
    `, [digitizationUsers]);

    const digiCorrect = [];
    const digiIncorrect = [];
    const digiNotFound = [];

    digitizationUsers.forEach(id => {
      const found = digiResult.rows.find(r => r.youth_id === id);
      if (!found) {
        digiNotFound.push(id);
      } else if (found.program_type === 'digitization') {
        digiCorrect.push({ id, name: found.full_name, module: found.module_assignment });
      } else {
        digiIncorrect.push({ id, name: found.full_name, actual: found.program_type });
      }
    });

    console.log(`\n   ✅ Correctly assigned: ${digiCorrect.length}/${digitizationUsers.length}`);
    if (digiIncorrect.length > 0) {
      console.log(`   ❌ INCORRECTLY assigned: ${digiIncorrect.length}`);
      digiIncorrect.forEach(u => {
        console.log(`      ${u.id} | ${u.name} | Actually: ${u.actual}`);
      });
    }
    if (digiNotFound.length > 0) {
      console.log(`   ⚠️  NOT FOUND in database: ${digiNotFound.length}`);
      digiNotFound.forEach(id => console.log(`      ${id}`));
    }

    // Check mobile mapping users
    console.log(`\n📋 CHECKING ${mobileMappingUsers.length} MOBILE MAPPING USERS...`);
    const mmResult = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment
      FROM youth_participants
      WHERE youth_id = ANY($1)
      ORDER BY youth_id
    `, [mobileMappingUsers]);

    const mmCorrect = [];
    const mmIncorrect = [];
    const mmNotFound = [];

    mobileMappingUsers.forEach(id => {
      const found = mmResult.rows.find(r => r.youth_id === id);
      if (!found) {
        mmNotFound.push(id);
      } else if (found.program_type === 'mobile_mapping') {
        mmCorrect.push({ id, name: found.full_name, module: found.module_assignment });
      } else {
        mmIncorrect.push({ id, name: found.full_name, actual: found.program_type });
      }
    });

    console.log(`\n   ✅ Correctly assigned: ${mmCorrect.length}/${mobileMappingUsers.length}`);
    if (mmIncorrect.length > 0) {
      console.log(`   ❌ INCORRECTLY assigned: ${mmIncorrect.length}`);
      mmIncorrect.forEach(u => {
        console.log(`      ${u.id} | ${u.name} | Actually: ${u.actual}`);
      });
    }
    if (mmNotFound.length > 0) {
      console.log(`   ⚠️  NOT FOUND in database: ${mmNotFound.length}`);
      mmNotFound.forEach(id => console.log(`      ${id}`));
    }

    // Check module_assignment consistency
    const mmWithModule = mmCorrect.filter(u => u.module !== null);
    if (mmWithModule.length > 0) {
      console.log(`\n   ⚠️  WARNING: ${mmWithModule.length} mobile_mapping users have module_assignment:`);
      mmWithModule.forEach(u => {
        console.log(`      ${u.id} | module: ${u.module} (should be NULL)`);
      });
    }

    console.log('\n' + '='.repeat(80));
    
    if (digiIncorrect.length === 0 && mmIncorrect.length === 0 && 
        digiNotFound.length === 0 && mmNotFound.length === 0 && 
        mmWithModule.length === 0) {
      console.log('✅ ALL USERS CORRECTLY ASSIGNED!');
    } else {
      console.log('❌ ISSUES FOUND - See details above');
    }
    
    console.log('='.repeat(80));
    console.log(`\nSUMMARY:`);
    console.log(`  Digitization users checked    : ${digitizationUsers.length}`);
    console.log(`  Mobile mapping users checked  : ${mobileMappingUsers.length}`);
    console.log(`  Total users verified          : ${digitizationUsers.length + mobileMappingUsers.length}`);
    console.log(`  Correct assignments           : ${digiCorrect.length + mmCorrect.length}`);
    console.log(`  Incorrect assignments         : ${digiIncorrect.length + mmIncorrect.length}`);
    console.log(`  Not found                     : ${digiNotFound.length + mmNotFound.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

verifyUserAssignments();

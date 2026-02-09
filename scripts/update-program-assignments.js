require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function updateProgramAssignments() {
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
    'KAR345WM', 'KAR350MM', 'KAR370PM', 'KAR192TK', 'KAR189CM',
    'KAR297CM', 'KAR393CM', 'KAR439SN', 'KAR008CM', 'KAR456PE', 'KAR212MN',
    'KAR342RK', 'KAR447MK', 'KAR128DM', 'KAR090KM', 'KAR385JM', 'KAR394EM',
    'KAR341CW', 'KAR290SK', 'KAR285JM', 'KAR284KM', 'KAR092GS',
    'KAR009MM', 'KAR108BM', 'KAR112CM', 'KAR023MK', 'KAR388JM', 'KAR208TS',
    'KAR404RM', 'KAR446FM', 'KAR026MM', 'KAR371MM', 'KAR191VM', 'KAR029AN',
    'HUR478JM', 'HUR438PW', 'HUR558AC', 'HUR703SN', 'HUR714AK',
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
    console.log('\n🔄 UPDATING PROGRAM ASSIGNMENTS TO MATCH PROVIDED LIST');
    console.log('='.repeat(80));

    // 1. Create backup
    console.log('\n1. CREATING BACKUP...');
    const backupData = await pool.query('SELECT * FROM youth_participants ORDER BY youth_id');
    const backupDir = path.join(__dirname, '..', 'backups', 'emergency-backup-before-reassignment');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupFile = path.join(backupDir, `backup-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      rowCount: backupData.rowCount,
      data: backupData.rows
    }, null, 2));
    console.log(`   ✅ Backup created: ${backupFile}`);

    // 2. Get current state
    const currentState = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as count
      FROM youth_participants
      GROUP BY program_type
    `);
    console.log('\n2. CURRENT STATE:');
    currentState.rows.forEach(r => console.log(`   ${r.program_type}: ${r.count}`));

    // 3. Update digitization users
    console.log(`\n3. UPDATING ${digitizationUsers.length} USERS TO DIGITIZATION...`);
    const digiUpdate = await pool.query(`
      UPDATE youth_participants
      SET 
        program_type = 'digitization',
        module_assignment = 'mapper',
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = ANY($1)
      RETURNING youth_id, full_name, program_type, module_assignment;
    `, [digitizationUsers]);
    console.log(`   ✅ Updated ${digiUpdate.rowCount} users to digitization`);
    
    if (digiUpdate.rowCount < digitizationUsers.length) {
      const found = digiUpdate.rows.map(r => r.youth_id);
      const notFound = digitizationUsers.filter(id => !found.includes(id));
      console.log(`   ⚠️  ${notFound.length} users not found: ${notFound.join(', ')}`);
    }

    // 4. Update mobile mapping users  
    console.log(`\n4. UPDATING ${mobileMappingUsers.length} USERS TO MOBILE MAPPING...`);
    const mmUpdate = await pool.query(`
      UPDATE youth_participants
      SET 
        program_type = 'mobile_mapping',
        module_assignment = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE youth_id = ANY($1)
      RETURNING youth_id, full_name, program_type, module_assignment;
    `, [mobileMappingUsers]);
    console.log(`   ✅ Updated ${mmUpdate.rowCount} users to mobile_mapping`);

    if (mmUpdate.rowCount < mobileMappingUsers.length) {
      const found = mmUpdate.rows.map(r => r.youth_id);
      const notFound = mobileMappingUsers.filter(id => !found.includes(id));
      console.log(`   ⚠️  ${notFound.length} users not found: ${notFound.join(', ')}`);
    }

    // 5. Check for users not in either list
    console.log('\n5. CHECKING FOR USERS NOT IN PROVIDED LISTS...');
    const allProvided = [...digitizationUsers, ...mobileMappingUsers];
    const notInLists = await pool.query(`
      SELECT youth_id, full_name, program_type, is_active
      FROM youth_participants
      WHERE youth_id != ALL($1)
      ORDER BY youth_id
    `, [allProvided]);
    
    if (notInLists.rowCount > 0) {
      console.log(`   ⚠️  ${notInLists.rowCount} users NOT in your lists (unchanged):`);
      notInLists.rows.forEach(r => {
        console.log(`      ${r.youth_id} | ${r.full_name} | ${r.program_type} | Active: ${r.is_active}`);
      });
    } else {
      console.log(`   ✅ All users accounted for`);
    }

    // 6. Final state
    const finalState = await pool.query(`
      SELECT 
        program_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE module_assignment IS NOT NULL) as with_module
      FROM youth_participants
      GROUP BY program_type
    `);
    console.log('\n6. FINAL STATE:');
    finalState.rows.forEach(r => {
      console.log(`   ${r.program_type}: ${r.count} users (${r.with_module} with module_assignment)`);
    });

    // 7. Verify Catherine Muli
    const catherine = await pool.query(`
      SELECT youth_id, full_name, program_type, module_assignment
      FROM youth_participants
      WHERE youth_id = 'KAY733CM'
    `);
    console.log('\n7. CATHERINE MULI (KAY733CM) STATUS:');
    if (catherine.rowCount > 0) {
      console.log(`   Program: ${catherine.rows[0].program_type}`);
      console.log(`   Module: ${catherine.rows[0].module_assignment || 'NULL'}`);
    } else {
      console.log(`   ⚠️  Not found in database`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE UPDATE COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nBackup location: ${backupFile}`);
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

updateProgramAssignments();

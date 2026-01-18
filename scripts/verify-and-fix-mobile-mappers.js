/**
 * Verify and Fix Mobile Mappers
 * 
 * This script:
 * 1. Checks if mobile mappers exist in youth_participants
 * 2. Ensures they are marked as active
 * 3. Ensures they have program_type = 'mobile_mapping'
 * 
 * Usage: node scripts/verify-and-fix-mobile-mappers.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Mobile Mappers from Mobile Mappers.md (all 100 youth)
const mobileMapperIds = [
  'KAY348RN', 'KAY1278MK', 'KAY2015NM', 'KAY2615VO', 'KAY1383EN',
  'KAY269JW', 'KAY1255GO', 'KAY2326TO', 'KAY2239NW', 'KAY1771NN',
  'KAY614FO', 'KAY621AM', 'KAY620JH', 'KAY1840TM', 'KAY1353CW',
  'KAY2762ZA', 'KAY2070EM', 'KAY498AW', 'KAY2065BW', 'KAY2675PM',
  'KAY413GG', 'KAY1042KM', 'KAY1008BO', 'KAY264EM', 'KAY1007FO',
  'KAY465DO', 'KAY744IA', 'KAY1604FA', 'KAY2802NM', 'KAY237FM',
  'KAY1000GN', 'KAY1619JG', 'KAY2412FO', 'KAY1990MM', 'KAY2188EG',
  'KAY2501CM', 'KAY2423BO', 'KAY2647MN', 'KAY760SK', 'KAY1230CA',
  'KAY2251TK', 'KAY2531JO', 'KAY2093GN', 'KAY1528CM', 'KAY1537MW',
  'KAY955HO', 'KAY2549EG', 'KAY2529RW', 'KAY2301SA', 'KAY974VE',
  'KAY2071PG', 'KAY2279JN', 'KAY1177MS', 'KAY1223AK', 'KAY1731EM',
  'KAY2642PO', 'KAY880LK', 'KAY098JO', 'KAY2031KM', 'KAY132DN',
  'KAY2587RM', 'KAY1143IM', 'KAY1973FM', 'KAY2465DN', 'KAY1506DM',
  'KAY2687MN', 'KAY1504BA', 'KAY2190FM', 'KAY1640JM', 'KAY2468HO',
  'KAY1799DM', 'KAY2570SM', 'KAY1681JM', 'KAY461VO', 'KAY1975NM',
  'KAY1726RN', 'KAY2134VW', 'KAY778DT', 'KAY2544DG', 'KAY1166AM',
  'KAY2248LK', 'KAY574GK', 'KAY2085SB', 'KAY346CC', 'KAY1398PO',
  'KAY291SM', 'KAY1092LJ', 'KAY1138SM', 'KAY1380MM', 'KAY2754JD',
  'KAY1614VA', 'KAY2491PL', 'KAY924LO', 'KAY1994KK', 'KAY2546PW',
  'KAY868JN', 'KAY1448PO', 'KAY2490AM', 'KAY288SM', 'KAY467DN'
];

async function verifyAndFix() {
  console.log('🔍 Verifying Mobile Mappers in Database\n');
  console.log(`Expected mobile mappers: ${mobileMapperIds.length}\n`);

  const client = await pool.connect();
  
  try {
    // 1. Check current state
    console.log('1️⃣ Checking current database state...');
    const currentState = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE youth_id = ANY($1)) as found_count,
        COUNT(*) FILTER (WHERE youth_id = ANY($1) AND is_active = TRUE) as active_count,
        COUNT(*) FILTER (WHERE youth_id = ANY($1) AND program_type = 'mobile_mapping') as correct_program_count,
        COUNT(*) FILTER (WHERE youth_id = ANY($1) AND is_active = TRUE AND program_type = 'mobile_mapping') as ready_count
      FROM youth_participants
    `, [mobileMapperIds]);
    
    const stats = currentState.rows[0];
    console.log(`   Found in database: ${stats.found_count}/${mobileMapperIds.length}`);
    console.log(`   Active: ${stats.active_count}/${mobileMapperIds.length}`);
    console.log(`   Correct program_type: ${stats.correct_program_count}/${mobileMapperIds.length}`);
    console.log(`   ✅ Ready (active + mobile_mapping): ${stats.ready_count}/${mobileMapperIds.length}\n`);
    
    // 2. Find missing youth
    const missingCheck = await client.query(`
      SELECT unnest($1::text[]) as youth_id
      EXCEPT
      SELECT youth_id FROM youth_participants WHERE youth_id = ANY($1)
    `, [mobileMapperIds]);
    
    if (missingCheck.rows.length > 0) {
      console.log(`⚠️  Missing youth (${missingCheck.rows.length}):`);
      missingCheck.rows.forEach(row => console.log(`   - ${row.youth_id}`));
      console.log('');
    }
    
    // 3. Find inactive youth
    const inactiveCheck = await client.query(`
      SELECT youth_id, full_name, program_type, is_active
      FROM youth_participants
      WHERE youth_id = ANY($1) AND is_active = FALSE
    `, [mobileMapperIds]);
    
    if (inactiveCheck.rows.length > 0) {
      console.log(`⚠️  Inactive youth (${inactiveCheck.rows.length}):`);
      inactiveCheck.rows.forEach(row => console.log(`   - ${row.youth_id}: ${row.full_name}`));
      console.log('');
    }
    
    // 4. Find youth with wrong program_type
    const wrongProgramCheck = await client.query(`
      SELECT youth_id, full_name, program_type
      FROM youth_participants
      WHERE youth_id = ANY($1) AND program_type != 'mobile_mapping'
    `, [mobileMapperIds]);
    
    if (wrongProgramCheck.rows.length > 0) {
      console.log(`⚠️  Wrong program_type (${wrongProgramCheck.rows.length}):`);
      wrongProgramCheck.rows.forEach(row => console.log(`   - ${row.youth_id}: ${row.full_name} (${row.program_type})`));
      console.log('');
    }
    
    // 5. Fix issues
    if (parseInt(stats.ready_count) < mobileMapperIds.length) {
      console.log('🔧 Fixing issues...\n');
      
      await client.query('BEGIN');
      
      const updateResult = await client.query(`
        UPDATE youth_participants
        SET 
          program_type = 'mobile_mapping',
          is_active = TRUE,
          settlement = 'Kayole Soweto',
          updated_at = CURRENT_TIMESTAMP
        WHERE youth_id = ANY($1)
        RETURNING youth_id
      `, [mobileMapperIds]);
      
      console.log(`✅ Updated ${updateResult.rows.length} youth records`);
      
      await client.query('COMMIT');
      console.log('✅ Changes committed\n');
    } else {
      console.log('✅ All mobile mappers are already correctly configured!\n');
    }
    
    // 6. Final verification
    console.log('📊 Final Status:');
    const finalCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM youth_participants
      WHERE youth_id = ANY($1) AND is_active = TRUE AND program_type = 'mobile_mapping'
    `, [mobileMapperIds]);
    
    console.log(`   Active mobile mappers: ${finalCheck.rows[0].count}/${mobileMapperIds.length}`);
    
    // 7. Check attendance records
    console.log('\n📅 Checking attendance records...');
    const attendanceCheck = await client.query(`
      SELECT 
        attendance_date,
        COUNT(*) as count
      FROM attendance_records
      WHERE youth_id = ANY($1)
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT 10
    `, [mobileMapperIds]);
    
    if (attendanceCheck.rows.length > 0) {
      console.log(`   Recent attendance records:`);
      attendanceCheck.rows.forEach(row => {
        console.log(`   - ${row.attendance_date}: ${row.count} records`);
      });
    } else {
      console.log('   No attendance records found');
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyAndFix().catch(console.error);

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Database connection
const sql = postgres(process.env.learn_DATABASE_URL || process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

async function updateUsersToMicrotasking() {
  try {
    console.log('=== UPDATING 25 USERS TO MICROTASKING ===\n');
    
    // 1. Read CSV file
    const csvPath = path.join(process.cwd(), 'The 25 moved to Microtasking from Mobile Mapping - 9-02-2026 The 14.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.trim().split('\n');
    
    // Parse CSV data (skip header)
    const usersToUpdate = [];
    for (let i = 1; i < csvLines.length; i++) {
      const fields = csvLines[i].split(',');
      usersToUpdate.push({
        youth_id: fields[0],
        firstName: fields[1],
        lastName: fields[2],
        settlement: fields[5], 
        daysInMicrotasking: parseInt(fields[7]),
        reason: fields[8]
      });
    }
    
    console.log(`Found ${usersToUpdate.length} users to update from CSV`);
    
    // 2. Check current status of these users
    const youthIds = usersToUpdate.map(u => u.youth_id);
    const currentUsers = await sql`
      SELECT youth_id, full_name, program_type, module_assignment, settlement 
      FROM youth_participants 
      WHERE youth_id = ANY(${youthIds})
      ORDER BY youth_id
    `;
    
    console.log(`\nFound ${currentUsers.length} matching users in database:`);
    
    // Group by current program type
    const programCounts = {};
    currentUsers.forEach(user => {
      programCounts[user.program_type] = (programCounts[user.program_type] || 0) + 1;
    });
    
    console.log('Current program type distribution:');
    Object.entries(programCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} users`);
    });
    
    // 3. Filter users that need updating (not already microtasking)
    const needsUpdate = currentUsers.filter(user => user.program_type !== 'microtasking');
    
    if (needsUpdate.length === 0) {
      console.log('\n✅ All users are already set to microtasking program type!');
      return;
    }
    
    console.log(`\n${needsUpdate.length} users need to be updated to microtasking:`);
    needsUpdate.forEach(user => {
      console.log(`  ${user.youth_id} - ${user.full_name} (currently: ${user.program_type})`);
    });
    
    // 4. Confirm before making changes
    console.log('\n=== PROCEEDING WITH DATABASE UPDATE ===');
    console.log('This will update program_type from mobile_mapping to microtasking');
    
    // 5. Perform the update
    let updateCount = 0;
    const updateResults = [];
    
    for (const user of needsUpdate) {
      try {
        const result = await sql`
          UPDATE youth_participants 
          SET program_type = 'microtasking',
              module_assignment = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE youth_id = ${user.youth_id}
          AND program_type != 'microtasking'
          RETURNING youth_id, full_name, program_type
        `;
        
        if (result.length > 0) {
          updateCount++;
          updateResults.push(result[0]);
          console.log(`✅ Updated ${user.youth_id} - ${user.full_name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update ${user.youth_id}: ${error.message}`);
      }
    }
    
    // 6. Final verification
    console.log(`\n=== UPDATE SUMMARY ===`);
    console.log(`Successfully updated: ${updateCount}/${needsUpdate.length} users`);
    
    if (updateCount > 0) {
      // Verify the updates
      const verifyUsers = await sql`
        SELECT youth_id, full_name, program_type 
        FROM youth_participants 
        WHERE youth_id = ANY(${youthIds}) AND program_type = 'microtasking'
        ORDER BY youth_id
      `;
      
      console.log(`\nVerification: ${verifyUsers.length} users now have microtasking program type`);
      
      // Check new total microtasking users
      const totalMicrotasking = await sql`
        SELECT COUNT(*) as count, settlement
        FROM youth_participants 
        WHERE program_type = 'microtasking'
        GROUP BY settlement
        ORDER BY settlement
      `;
      
      console.log('\nUpdated microtasking user counts by settlement:');
      totalMicrotasking.forEach(row => {
        console.log(`  ${row.settlement}: ${row.count} users`);
      });
      
      const kayoleMicrotasking = totalMicrotasking.find(row => row.settlement === 'Kayole Soweto');
      if (kayoleMicrotasking) {
        console.log(`\n🎯 Kayole Soweto now has ${kayoleMicrotasking.count} microtasking users total`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

updateUsersToMicrotasking();
const { sql } = require('@vercel/postgres');

const youthToAdd = [
  { youth_id: 'HUR777BW', full_name: 'Beatrice Wanjiru', settlement: 'Mji wa Huruma' }
];

async function verifyAndAddYouth() {
  try {
    console.log('\n=== Verifying Youth in Database ===\n');
    
    // Check which youth already exist
    const existingYouth = [];
    const newYouth = [];
    
    for (const youth of youthToAdd) {
      const result = await sql`
        SELECT youth_id, full_name, settlement 
        FROM youth_participants 
        WHERE youth_id = ${youth.youth_id}
      `;
      
      if (result.rows.length > 0) {
        existingYouth.push(result.rows[0]);
        console.log(`✓ ${youth.youth_id} - ${youth.full_name} (Already exists)`);
      } else {
        newYouth.push(youth);
        console.log(`✗ ${youth.youth_id} - ${youth.full_name} (Not found - will add)`);
      }
    }
    
    // Add new youth if any
    if (newYouth.length > 0) {
      console.log(`\n=== Adding ${newYouth.length} New Youth ===\n`);
      
      for (const youth of newYouth) {
        await sql`
          INSERT INTO youth_participants (youth_id, full_name, settlement, program_type)
          VALUES (${youth.youth_id}, ${youth.full_name}, ${youth.settlement}, 'digitization')
        `;
        console.log(`✓ Added: ${youth.youth_id} - ${youth.full_name}`);
      }
      
      console.log(`\n✓ Successfully added ${newYouth.length} youth to the platform`);
    } else {
      console.log('\n✓ All youth already exist in the database');
    }
    
    // Show final count
    const totalResult = await sql`SELECT COUNT(*) as count FROM youth_participants`;
    console.log(`\nTotal youth in database: ${totalResult.rows[0].count}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAndAddYouth();

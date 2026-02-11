require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// Database connection using postgres client
const sql = postgres(process.env.learn_DATABASE_URL || process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

async function testReginaAndFix() {
  try {
    console.log('=== TESTING REGINA SITUATION ===\n');
    
    // 1. Check current database record
    const currentRecord = await sql`
      SELECT youth_id, full_name, program_type, module_assignment, settlement 
      FROM youth_participants 
      WHERE youth_id = 'KAY348RN'
    `;
    
    if (currentRecord.length > 0) {
      console.log('Current Database Record:');
      console.log(JSON.stringify(currentRecord[0], null, 2));
      
      // 2. Update to match DPW data (digitization)
      if (currentRecord[0].program_type !== 'digitization') {
        console.log('\n=== FIXING PROGRAM TYPE ===');
        
        await sql`
          UPDATE youth_participants 
          SET program_type = 'digitization',
              module_assignment = 'mapper'
          WHERE youth_id = 'KAY348RN'
        `;
        
        console.log('✅ Updated Regina program_type to "digitization"');
        
        // Verify the update
        const updatedRecord = await sql`
          SELECT youth_id, full_name, program_type, module_assignment 
          FROM youth_participants 
          WHERE youth_id = 'KAY348RN'
        `;
        
        console.log('\nUpdated Record:');
        console.log(JSON.stringify(updatedRecord[0], null, 2));
      } else {
        console.log('✅ Database already shows digitization - no update needed');
      }
    } else {
      console.log('❌ No record found for KAY348RN');
    }
    
    // 3. Test local authentication
    console.log('\n=== TEST LOCAL AUTH ===');
    const authResponse = await fetch('http://localhost:3000/api/youth/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youthId: 'KAY348RN' })
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth successful!');
      console.log('Program Type returned:', authData.data.youth.programType);
      console.log('Module Assignment:', authData.data.youth.moduleAssignment);
      
      // 4. Test DPW performance API  
      const token = authData.data.token;
      const perfResponse = await fetch('http://localhost:3000/api/youth/performance/dpw', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        console.log('\\n=== DPW PERFORMANCE DATA ===');
        console.log('Rank:', perfData.user_ranking?.earnings_rank);
        console.log('Total Participants:', perfData.user_ranking?.total_participants);
        console.log('Quality Score:', perfData.personal_metrics?.quality_score);
        console.log('Total Earnings:', perfData.personal_metrics?.total_earnings);
      } else {
        console.log('❌ Performance API failed');
      }
      
    } else {
      console.log('❌ Authentication failed');
      const errorData = await authResponse.json();
      console.log('Error:', errorData.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

testReginaAndFix();
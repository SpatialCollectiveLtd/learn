const { sql } = require('@vercel/postgres');

async function validateAllOsmUsernames() {
  try {
    console.log('\n=== Validating All OSM Usernames ===\n');
    
    // Get all youth with OSM usernames
    const result = await sql`
      SELECT youth_id, osm_username, full_name 
      FROM youth_participants 
      WHERE osm_username IS NOT NULL 
      ORDER BY youth_id
    `;
    
    console.log(`Found ${result.rows.length} youth with OSM usernames\n`);
    
    const validUsernames = [];
    const invalidUsernames = [];
    const errorUsernames = [];
    
    for (const youth of result.rows) {
      const username = youth.osm_username;
      process.stdout.write(`Checking ${youth.youth_id} - ${username}... `);
      
      try {
        // Check if profile exists on OSM
        const response = await fetch(
          `https://www.openstreetmap.org/user/${encodeURIComponent(username)}`,
          {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Spatial-Collective-Training-Platform/1.0',
            },
          }
        );
        
        if (response.status === 200) {
          console.log('✓ Valid');
          validUsernames.push({
            youth_id: youth.youth_id,
            username: username,
            full_name: youth.full_name
          });
        } else if (response.status === 404) {
          console.log('✗ Not Found');
          invalidUsernames.push({
            youth_id: youth.youth_id,
            username: username,
            full_name: youth.full_name
          });
        } else {
          console.log(`? Status ${response.status}`);
          errorUsernames.push({
            youth_id: youth.youth_id,
            username: username,
            full_name: youth.full_name,
            status: response.status
          });
        }
      } catch (error) {
        console.log('✗ Error checking');
        errorUsernames.push({
          youth_id: youth.youth_id,
          username: username,
          full_name: youth.full_name,
          error: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n=== Validation Results ===\n');
    console.log(`✓ Valid: ${validUsernames.length}`);
    console.log(`✗ Invalid/Not Found: ${invalidUsernames.length}`);
    console.log(`? Error/Unknown: ${errorUsernames.length}`);
    
    if (invalidUsernames.length > 0) {
      console.log('\n=== Invalid Usernames ===\n');
      invalidUsernames.forEach(u => {
        console.log(`${u.youth_id} - ${u.username} (${u.full_name})`);
      });
    }
    
    if (errorUsernames.length > 0) {
      console.log('\n=== Error Checking ===\n');
      errorUsernames.forEach(u => {
        console.log(`${u.youth_id} - ${u.username} (${u.full_name}) - ${u.error || 'Status: ' + u.status}`);
      });
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

validateAllOsmUsernames();

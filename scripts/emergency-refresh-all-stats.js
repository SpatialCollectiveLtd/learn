// Emergency: Refresh ALL youth stats for Jan 8, 2026
// The counting logic was broken - everyone needs their stats recalculated

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const axios = require('axios');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);

async function refreshAllStats() {
  console.log('\n=== EMERGENCY: Refreshing ALL Youth Stats for Jan 8, 2026 ===\n');
  
  // Get all digitization youth with OSM usernames
  const youthResult = await sql`
    SELECT youth_id, full_name, osm_username
    FROM youth_participants
    WHERE osm_username IS NOT NULL
    AND osm_username != ''
    ORDER BY youth_id
  `;
  
  console.log(`Found ${youthResult.length} youth with OSM usernames\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let totalBuildings = 0;
  
  for (const youth of youthResult) {
    console.log(`\nProcessing ${youth.youth_id} (${youth.full_name}) - ${youth.osm_username}...`);
    
    try {
      // Call the refresh API endpoint
      const response = await axios.post(
        `http://localhost:3000/api/work/stats/refresh`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${generateTestToken(youth.youth_id)}`,
          },
          timeout: 60000, // 60 second timeout
        }
      );
      
      if (response.data.success) {
        const buildings = response.data.buildingsToday || 0;
        totalBuildings += buildings;
        console.log(`✅ SUCCESS: ${buildings} buildings counted`);
        successCount++;
      } else {
        console.log(`❌ FAILED: ${response.data.message}`);
        errorCount++;
      }
      
      // Rate limit: wait 2 seconds between requests
      await delay(2000);
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n=== REFRESH COMPLETE ===');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total buildings counted: ${totalBuildings}`);
  console.log('');
}

function generateTestToken(youthId) {
  // Simple JWT for testing - replace with actual JWT generation in production
  const jwt = require('jsonwebtoken');
  const secret = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || '';
  
  return jwt.sign(
    { youthId, role: 'youth' },
    secret,
    { expiresIn: '1h' }
  );
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

refreshAllStats().catch(console.error);

// Test the exact cache query being used in the API
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testCacheQuery() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const youthId = 'KAY2333OO';
    
    // Calculate today's date exactly like the API does
    const timezone = 'Africa/Nairobi';
    const offset = 3;
    const now = new Date();
    const localDate = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    const today = localDate.toISOString().split('T')[0];
    
    console.log('=== Date Calculation ===');
    console.log('Server now (UTC):', now.toISOString());
    console.log('Local date (EAT):', localDate.toISOString());
    console.log('Today string:', today);
    
    console.log('\n=== Current Cache Data ===');
    const allData = await pool.query(`
      SELECT 
        youth_id, 
        date,
        date::text as date_text,
        (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date as date_in_eat,
        buildings_mapped, 
        updated_at,
        NOW() - updated_at as age
      FROM youth_osm_stats
      WHERE youth_id = $1
      ORDER BY date DESC
      LIMIT 5
    `, [youthId]);
    console.log('All recent cache entries:');
    allData.rows.forEach(row => {
      console.log(`  Date: ${row.date_text} -> EAT: ${row.date_in_eat}, Buildings: ${row.buildings_mapped}, Age: ${row.age}`);
    });
    
    console.log('\n=== Running FIXED Cache Query ===');
    console.log('Query params: youthId =', youthId, ', today =', today);
    
    const result = await pool.query(`
      SELECT buildings_mapped, changesets_analyzed, last_changeset_id, last_upload_time, updated_at
      FROM youth_osm_stats
      WHERE youth_id = $1 
      AND date::date = $2::date
      AND updated_at > NOW() - INTERVAL '5 minutes'
    `, [youthId, today]);
    
    console.log('Results:', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('Cache HIT:', result.rows[0]);
    } else {
      console.log('Cache MISS - No rows returned');
      
      // Check without the 5-minute filter
      console.log('\n=== Query WITHOUT 5-minute filter ===');
      const result2 = await pool.query(`
        SELECT buildings_mapped, updated_at, NOW() - updated_at as age
        FROM youth_osm_stats
        WHERE youth_id = $1 
        AND date::date = $2::date
      `, [youthId, today]);
      
      if (result2.rows.length > 0) {
        console.log('Found without time filter:', result2.rows[0]);
      } else {
        console.log('Still no match - date conversion issue');
        
        // Try different date comparisons
        console.log('\n=== Debug Date Comparisons ===');
        const debug = await pool.query(`
          SELECT 
            date,
            date::text as raw_date,
            (date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date as eat_date,
            $2::date as query_date,
            ((date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::date = $2::date) as matches
          FROM youth_osm_stats
          WHERE youth_id = $1
          ORDER BY date DESC LIMIT 3
        `, [youthId, today]);
        console.log(debug.rows);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCacheQuery();

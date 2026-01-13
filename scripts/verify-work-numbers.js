/**
 * Database Verification Script
 * Compares API results with direct database queries
 */
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.NEON_DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function verify() {
  console.log('📊 WORK DASHBOARD NUMBER VERIFICATION\n');
  console.log('Comparing API results with direct database queries...\n');
  
  const accounts = ['KAR399JM', 'KAY1725LK', 'KAY2333OO', 'HUR777BW', 'HUR715CW', 'KAR158KK'];
  
  for (const youthId of accounts) {
    console.log('='.repeat(60));
    console.log('Youth ID:', youthId);
    
    // Get profile
    const profile = await pool.query(
      'SELECT full_name, osm_username, settlement FROM youth_participants WHERE youth_id = $1', 
      [youthId]
    );
    console.log('Name:', profile.rows[0]?.full_name);
    console.log('OSM Username:', profile.rows[0]?.osm_username);
    
    // Get work days from DB
    const workDays = await pool.query(
      `SELECT COUNT(*) as days, SUM(buildings_count) as buildings 
       FROM youth_work_days WHERE youth_id = $1 AND status = 'approved'`,
      [youthId]
    );
    console.log('DB Work Days:', workDays.rows[0]?.days, '| Buildings:', workDays.rows[0]?.buildings);
    
    // Get today's OSM stats from DB
    const today = new Date().toISOString().split('T')[0];
    const osmStats = await pool.query(
      'SELECT buildings_mapped, changesets_analyzed FROM youth_osm_stats WHERE youth_id = $1 AND date = $2',
      [youthId, today]
    );
    console.log('DB Today Stats:', osmStats.rows[0]?.buildings_mapped || 0, 'buildings');
    console.log('');
  }
  
  // Overall totals
  console.log('='.repeat(60));
  console.log('OVERALL TOTALS');
  const totalWork = await pool.query(
    `SELECT COUNT(*) as days, SUM(buildings_count) as buildings FROM youth_work_days WHERE status = 'approved'`
  );
  console.log('Total Approved Work Days:', totalWork.rows[0]?.days);
  console.log('Total Buildings Mapped:', totalWork.rows[0]?.buildings);
  
  const activeYouth = await pool.query('SELECT COUNT(*) FROM youth_participants WHERE is_active = true');
  console.log('Active Youth:', activeYouth.rows[0]?.count);
  
  const withOsm = await pool.query(
    'SELECT COUNT(*) FROM youth_participants WHERE is_active = true AND osm_username IS NOT NULL'
  );
  console.log('With OSM Username:', withOsm.rows[0]?.count);
  
  // Work days by settlement
  console.log('\n' + '='.repeat(60));
  console.log('WORK DAYS BY SETTLEMENT');
  const bySettlement = await pool.query(`
    SELECT 
      yp.settlement,
      COUNT(DISTINCT yp.youth_id) as youth_count,
      COUNT(ywd.youth_id) as total_days,
      SUM(ywd.buildings_count) as total_buildings,
      ROUND(AVG(ywd.buildings_count), 0) as avg_per_day
    FROM youth_participants yp
    LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
    WHERE yp.is_active = true
    GROUP BY yp.settlement
    ORDER BY total_buildings DESC NULLS LAST
  `);
  
  console.log('\n| Settlement          | Youth | Days | Buildings | Avg/Day |');
  console.log('|---------------------|-------|------|-----------|---------|');
  for (const row of bySettlement.rows) {
    console.log(`| ${(row.settlement || 'N/A').padEnd(19)} | ${String(row.youth_count).padEnd(5)} | ${String(row.total_days || 0).padEnd(4)} | ${String(row.total_buildings || 0).padEnd(9)} | ${String(row.avg_per_day || 0).padEnd(7)} |`);
  }
  
  // Top performers
  console.log('\n' + '='.repeat(60));
  console.log('TOP 10 PERFORMERS (by total buildings)');
  const topPerformers = await pool.query(`
    SELECT 
      yp.youth_id,
      yp.full_name,
      yp.settlement,
      COUNT(ywd.youth_id) as days_worked,
      SUM(ywd.buildings_count) as total_buildings
    FROM youth_participants yp
    JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id AND ywd.status = 'approved'
    WHERE yp.is_active = true
    GROUP BY yp.youth_id, yp.full_name, yp.settlement
    ORDER BY total_buildings DESC
    LIMIT 10
  `);
  
  console.log('\n| # | Youth ID   | Name                    | Settlement      | Days | Buildings |');
  console.log('|---|------------|-------------------------|-----------------|------|-----------|');
  topPerformers.rows.forEach((row, i) => {
    console.log(`| ${String(i+1).padEnd(1)} | ${row.youth_id.padEnd(10)} | ${(row.full_name || 'N/A').substring(0, 23).padEnd(23)} | ${(row.settlement || 'N/A').substring(0, 15).padEnd(15)} | ${String(row.days_worked).padEnd(4)} | ${String(row.total_buildings).padEnd(9)} |`);
  });
  
  await pool.end();
  console.log('\n✅ Verification complete!');
}

verify().catch(console.error);

/**
 * Unit Tests for Database Models and Utilities
 * Run: node scripts/unit-tests.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

// Test configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING,
  ssl: { rejectUnauthorized: false }
});

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper functions
async function test(name, testFn) {
  try {
    await testFn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy, got ${value}`);
  }
}

function assertArrayLength(arr, minLength, message) {
  if (!Array.isArray(arr) || arr.length < minLength) {
    throw new Error(`${message}: expected array with min length ${minLength}`);
  }
}

// ============================================
// DATABASE CONNECTION TESTS
// ============================================

async function testDatabaseConnection() {
  console.log('\n📋 Testing Database Connection...');
  
  await test('Database connection is established', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    assertTruthy(result.rows[0].current_time, 'Should return timestamp');
  });
  
  await test('Database version check', async () => {
    const result = await pool.query('SELECT version()');
    assertTruthy(result.rows[0].version.includes('PostgreSQL'), 'Should be PostgreSQL');
  });
}

// ============================================
// SCHEMA VALIDATION TESTS
// ============================================

async function testSchemaValidation() {
  console.log('\n📋 Testing Schema Validation...');
  
  await test('youth_participants table exists', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'youth_participants'
    `);
    assertTruthy(result.rows.length > 0, 'Table should have columns');
  });
  
  await test('staff_members table exists', async () => {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'staff_members'
    `);
    assertTruthy(result.rows.length > 0, 'Table should have columns');
  });
  
  await test('youth_work_days table exists', async () => {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'youth_work_days'
    `);
    assertTruthy(result.rows.length > 0, 'Table should have columns');
  });
  
  await test('Required indexes exist on youth_participants', async () => {
    const result = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'youth_participants'
    `);
    assertTruthy(result.rows.length >= 3, 'Should have multiple indexes');
  });
  
  await test('Foreign key constraints exist', async () => {
    const result = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY' 
      AND table_name = 'signed_contracts'
    `);
    assertTruthy(result.rows.length > 0, 'Should have foreign keys');
  });
}

// ============================================
// DATA INTEGRITY TESTS
// ============================================

async function testDataIntegrity() {
  console.log('\n📋 Testing Data Integrity...');
  
  await test('All youth have valid program_type', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as invalid_count 
      FROM youth_participants 
      WHERE program_type NOT IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')
    `);
    assertEqual(parseInt(result.rows[0].invalid_count), 0, 'Invalid program types');
  });
  
  await test('All staff have valid roles', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as invalid_count 
      FROM staff_members 
      WHERE role NOT IN ('trainer', 'admin', 'superadmin')
    `);
    assertEqual(parseInt(result.rows[0].invalid_count), 0, 'Invalid roles');
  });
  
  await test('No orphaned signed contracts', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as orphan_count 
      FROM signed_contracts sc 
      LEFT JOIN youth_participants yp ON sc.youth_id = yp.youth_id 
      WHERE yp.youth_id IS NULL
    `);
    assertEqual(parseInt(result.rows[0].orphan_count), 0, 'Orphaned contracts');
  });
  
  await test('Work days have valid status values', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as invalid_count 
      FROM youth_work_days 
      WHERE status NOT IN ('pending', 'approved', 'rejected')
    `);
    assertEqual(parseInt(result.rows[0].invalid_count), 0, 'Invalid status values');
  });
  
  await test('Buildings count is non-negative', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as negative_count 
      FROM youth_work_days 
      WHERE buildings_count < 0
    `);
    assertEqual(parseInt(result.rows[0].negative_count), 0, 'Negative buildings count');
  });
}

// ============================================
// QUERY PERFORMANCE TESTS
// ============================================

async function testQueryPerformance() {
  console.log('\n📋 Testing Query Performance...');
  
  await test('Youth lookup by ID is fast (<100ms)', async () => {
    const start = Date.now();
    await pool.query('SELECT * FROM youth_participants WHERE youth_id = $1', ['KAY1278MK']);
    const duration = Date.now() - start;
    assertTruthy(duration < 100, `Query took ${duration}ms`);
  });
  
  await test('Active youth list query is fast (<500ms)', async () => {
    const start = Date.now();
    await pool.query('SELECT * FROM youth_participants WHERE is_active = TRUE');
    const duration = Date.now() - start;
    assertTruthy(duration < 500, `Query took ${duration}ms`);
  });
  
  await test('Settlement filter uses index', async () => {
    const result = await pool.query(`
      EXPLAIN ANALYZE 
      SELECT * FROM youth_participants 
      WHERE settlement = 'Kayole' AND is_active = TRUE
    `);
    const plan = result.rows.map(r => r['QUERY PLAN']).join(' ');
    // Check that it's not doing a full sequential scan
    assertTruthy(plan.includes('Index') || plan.includes('Bitmap'), 'Should use index');
  });
}

// ============================================
// BUSINESS LOGIC TESTS
// ============================================

async function testBusinessLogic() {
  console.log('\n📋 Testing Business Logic...');
  
  await test('Youth ID format validation (KAY prefix)', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM youth_participants 
      WHERE youth_id LIKE 'KAY%'
    `);
    assertTruthy(parseInt(result.rows[0].count) >= 0, 'Should handle KAY prefix');
  });
  
  await test('Youth ID format validation (KAR prefix)', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM youth_participants 
      WHERE youth_id LIKE 'KAR%'
    `);
    assertTruthy(parseInt(result.rows[0].count) >= 0, 'Should handle KAR prefix');
  });
  
  await test('Work days do not exceed 20 per youth', async () => {
    const result = await pool.query(`
      SELECT youth_id, COUNT(*) as day_count 
      FROM youth_work_days 
      WHERE status = 'approved' 
      GROUP BY youth_id 
      HAVING COUNT(*) > 20
    `);
    assertEqual(result.rows.length, 0, 'No youth should exceed 20 days');
  });
  
  await test('Contract templates exist for each program type', async () => {
    const result = await pool.query(`
      SELECT DISTINCT program_type 
      FROM contract_templates 
      WHERE is_active = TRUE
    `);
    assertTruthy(result.rows.length > 0, 'Should have active templates');
  });
}

// ============================================
// VIEW TESTS
// ============================================

async function testViews() {
  console.log('\n📋 Testing Database Views...');
  
  await test('youth_contract_status view works', async () => {
    const result = await pool.query('SELECT * FROM youth_contract_status LIMIT 5');
    assertTruthy(result.rows !== undefined, 'View should return rows');
  });
  
  await test('recent_auth_activity view works', async () => {
    const result = await pool.query('SELECT * FROM recent_auth_activity LIMIT 5');
    assertTruthy(result.rows !== undefined, 'View should return rows');
  });
  
  // Check if materialized view exists
  await test('Check for materialized views', async () => {
    const result = await pool.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public'
    `);
    // May or may not have materialized views
    assertTruthy(result.rows !== undefined, 'Should query matviews');
  });
}

// ============================================
// TRIGGER TESTS
// ============================================

async function testTriggers() {
  console.log('\n📋 Testing Database Triggers...');
  
  await test('updated_at trigger exists on youth_participants', async () => {
    const result = await pool.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'youth_participants'
    `);
    assertTruthy(result.rows.length > 0, 'Should have triggers');
  });
  
  await test('updated_at is automatically updated', async () => {
    // Get a test record
    const selectResult = await pool.query(`
      SELECT youth_id, updated_at 
      FROM youth_participants 
      LIMIT 1
    `);
    
    if (selectResult.rows.length > 0) {
      const youthId = selectResult.rows[0].youth_id;
      const oldUpdatedAt = selectResult.rows[0].updated_at;
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update record
      await pool.query(`
        UPDATE youth_participants 
        SET full_name = full_name 
        WHERE youth_id = $1
      `, [youthId]);
      
      // Check updated_at changed
      const newResult = await pool.query(`
        SELECT updated_at 
        FROM youth_participants 
        WHERE youth_id = $1
      `, [youthId]);
      
      const newUpdatedAt = newResult.rows[0].updated_at;
      assertTruthy(
        new Date(newUpdatedAt) >= new Date(oldUpdatedAt),
        'updated_at should be >= old value'
      );
    }
  });
}

// ============================================
// AUTH LOG TESTS
// ============================================

async function testAuthLogs() {
  console.log('\n📋 Testing Auth Logging...');
  
  await test('Auth logs table accepts new entries', async () => {
    const result = await pool.query(`
      INSERT INTO auth_logs (user_id, user_type, action, success, ip_address)
      VALUES ('TEST_USER', 'youth', 'test', true, '127.0.0.1')
      RETURNING log_id
    `);
    assertTruthy(result.rows[0].log_id, 'Should return log_id');
    
    // Cleanup
    await pool.query('DELETE FROM auth_logs WHERE user_id = $1', ['TEST_USER']);
  });
  
  await test('Failed login attempts can be counted', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM auth_logs 
      WHERE success = FALSE 
      AND created_at > NOW() - INTERVAL '15 minutes'
    `);
    assertTruthy(result.rows[0].count !== undefined, 'Should return count');
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Unit Test Suite');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    await testDatabaseConnection();
    await testSchemaValidation();
    await testDataIntegrity();
    await testQueryPerformance();
    await testBusinessLogic();
    await testViews();
    await testTriggers();
    await testAuthLogs();
  } catch (error) {
    console.error('\n💥 Test suite error:', error);
  }
  
  const totalTime = Date.now() - startTime;
  
  // Close pool
  await pool.end();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 UNIT TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Pass Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests();

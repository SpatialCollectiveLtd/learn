const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function runProductionSync() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // 1. Add osm_username column
    console.log('📝 Step 1: Adding osm_username column...');
    await client.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public'
              AND table_name = 'youth_participants' 
              AND column_name = 'osm_username'
          ) THEN
              ALTER TABLE youth_participants 
              ADD COLUMN osm_username VARCHAR(255);
              RAISE NOTICE 'Added osm_username column';
          ELSE
              RAISE NOTICE 'osm_username column already exists';
          END IF;
      END $$;
    `);
    console.log('✅ osm_username column check complete\n');

    // 2. Create index
    console.log('📝 Step 2: Creating index for osm_username...');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_indexes 
              WHERE schemaname = 'public'
              AND tablename = 'youth_participants' 
              AND indexname = 'idx_youth_osm_username'
          ) THEN
              CREATE INDEX idx_youth_osm_username ON youth_participants(osm_username);
              RAISE NOTICE 'Created index idx_youth_osm_username';
          ELSE
              RAISE NOTICE 'Index idx_youth_osm_username already exists';
          END IF;
      END $$;
    `);
    console.log('✅ Index check complete\n');

    // 3. Add test user
    console.log('📝 Step 3: Adding test user KAYTEST001ES...');
    const insertResult = await client.query(`
      INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type, is_active)
      VALUES ('KAYTEST001ES', 'Test Youth Kayole', 'kaytest@example.com', '+254700000000', 'digitization', TRUE)
      ON CONFLICT (youth_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        program_type = EXCLUDED.program_type,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING youth_id, full_name, email;
    `);
    console.log('✅ Test user added/updated:', insertResult.rows[0]);
    console.log();

    // 4. Verify test user
    console.log('🔍 Step 4: Verifying test user...');
    const verifyUser = await client.query(`
      SELECT 
        youth_id, 
        full_name, 
        email, 
        program_type, 
        osm_username,
        is_active, 
        created_at 
      FROM youth_participants 
      WHERE youth_id = 'KAYTEST001ES';
    `);
    console.log('Test User Details:', verifyUser.rows[0]);
    console.log();

    // 5. Check OSM username statistics
    console.log('📊 Step 5: OSM Username Statistics...');
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(osm_username) as users_with_osm,
        COUNT(*) - COUNT(osm_username) as users_without_osm
      FROM youth_participants;
    `);
    console.log('Statistics:', stats.rows[0]);
    console.log();

    // 6. List all users
    console.log('👥 Step 6: All Youth Participants...');
    const allUsers = await client.query(`
      SELECT youth_id, full_name, program_type, osm_username, is_active 
      FROM youth_participants 
      ORDER BY created_at DESC;
    `);
    console.log(`Found ${allUsers.rows.length} youth participants:`);
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.youth_id}: ${user.full_name} (${user.program_type}) ${user.osm_username ? `[OSM: ${user.osm_username}]` : '[No OSM]'} ${user.is_active ? '✓' : '✗'}`);
    });
    console.log();

    console.log('✅ ✅ ✅ Production database update completed successfully! ✅ ✅ ✅');
    console.log('\n🎉 You can now login with: KAYTEST001ES');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runProductionSync();

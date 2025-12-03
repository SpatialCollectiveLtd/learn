import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { testConnection, execute, getClient } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function initializeDatabase() {
  console.log('📝 Environment check:');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Set (Neon PostgreSQL)' : 'NOT SET');
  console.log('');
  console.log('🚀 Starting PostgreSQL database initialization...\n');

  // Test connection
  console.log('1️⃣  Testing database connection...');
  const connected = await testConnection();

  if (!connected) {
    console.error('❌ Failed to connect to database. Please check your credentials.');
    process.exit(1);
  }

  // Run PostgreSQL schema
  console.log('\n2️⃣  Running PostgreSQL database schema...');
  const schemaPath = path.join(__dirname, '../database/schema-postgresql.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    // Execute entire schema file
    const client = await getClient();
    try {
      await client.query(schema);
      console.log('✅ PostgreSQL schema executed successfully');
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Error executing schema:', error.message);
    process.exit(1);
  }

  // Verify tables were created
  console.log('\n3️⃣  Verifying database tables...');
  try {
    const client = await getClient();
    try {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      console.log(`✅ ${result.rows.length} tables created:`);
      result.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Error verifying tables:', error.message);
  }

  // Check seed data
  console.log('\n4️⃣  Verifying seed data...');
  try {
    const client = await getClient();
    try {
      const modulesResult = await client.query('SELECT COUNT(*) as count FROM modules');
      const staffResult = await client.query('SELECT COUNT(*) as count FROM staff_members');
      const youthResult = await client.query('SELECT COUNT(*) as count FROM youth_participants');
      const templatesResult = await client.query('SELECT COUNT(*) as count FROM contract_templates');

      console.log(`✅ Seed data loaded:`);
      console.log(`   - Modules: ${modulesResult.rows[0].count}`);
      console.log(`   - Staff members: ${staffResult.rows[0].count}`);
      console.log(`   - Youth participants: ${youthResult.rows[0].count}`);
      console.log(`   - Contract templates: ${templatesResult.rows[0].count}`);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('❌ Error checking seed data:', error.message);
  }

  console.log('\n🎉 PostgreSQL database initialization complete!\n');
  console.log('📊 Next steps:');
  console.log('   1. Run: npm run dev (to start Next.js frontend)');
  console.log('   2. Run: cd api && npm run dev (to start Express API)');
  console.log('   3. Visit: http://localhost:3000\n');

  process.exit(0);
}

initializeDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

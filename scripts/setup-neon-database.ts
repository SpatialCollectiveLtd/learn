import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// ES module equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function setupDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔗 Connecting to Neon PostgreSQL database...');
    
    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected successfully at:', result.rows[0].now);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-neon-postgresql.sql');
    console.log('📄 Reading schema from:', schemaPath);
    
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('🔨 Executing schema...');
    await client.query(schema);
    console.log('✅ Schema executed successfully');

    // Verify tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify data
    const staffCount = await client.query('SELECT COUNT(*) FROM staff_members');
    const youthCount = await client.query('SELECT COUNT(*) FROM youth_participants');
    const templateCount = await client.query('SELECT COUNT(*) FROM contract_templates');

    console.log('\n📈 Seed data:');
    console.log(`  - Staff members: ${staffCount.rows[0].count}`);
    console.log(`  - Youth participants: ${youthCount.rows[0].count}`);
    console.log(`  - Contract templates: ${templateCount.rows[0].count}`);

    client.release();
    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });

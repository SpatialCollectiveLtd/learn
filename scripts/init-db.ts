import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { testConnection, execute } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function initializeDatabase() {
  console.log('📝 Environment check:');
  console.log('   DATABASE_HOST:', process.env.DATABASE_HOST);
  console.log('   DATABASE_USER:', process.env.DATABASE_USER);
  console.log('   DATABASE_NAME:', process.env.DATABASE_NAME);
  console.log('');
  console.log('🚀 Starting database initialization...\n');

  // Test connection
  console.log('1️⃣  Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('❌ Failed to connect to database. Please check your credentials.');
    process.exit(1);
  }

  // Run schema
  console.log('\n2️⃣  Running database schema...');
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove comments and split by semicolons properly
  const statements = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('--')) // Remove comment lines
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter empty or very short statements

  console.log(`   Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await execute(statement);
      const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
      console.log(`   ✅ ${i + 1}/${statements.length}: ${preview}...`);
    } catch (error: any) {
      const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
      console.error(`   ❌ ${i + 1}/${statements.length}: ${preview}... - ${error.message}`);
    }
  }
  
  console.log('✅ Schema execution completed');

  // Seed mapper content
  console.log('\n3️⃣  Seeding mapper training content...');
  const seedPath = path.join(__dirname, '../database/seed_mapper_content.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  
  // Execute entire seed file as multi-statement query
  try {
    await execute(seedSql);
    console.log('✅ Mapper content seeded successfully');
  } catch (error: any) {
    console.error('❌ Error seeding content:', error.message);
  }

  console.log('\n🎉 Database initialization complete!\n');
  process.exit(0);
}

initializeDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

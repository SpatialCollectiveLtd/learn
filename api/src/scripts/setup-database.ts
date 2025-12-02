import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// For CommonJS compatibility
const __dirname = process.cwd();

async function setupDatabase() {
  console.log('📦 Setting up database...\n');
  
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL database');

    // Read SQL file
    const sqlFile = join(__dirname, 'api/database/schema-mysql.sql');
    const sql = readFileSync(sqlFile, 'utf8');

    console.log('📄 Executing schema...\n');

    // Execute SQL
    const [results] = await connection.query(sql);
    
    console.log('\n✅ Database schema executed successfully!');
    console.log('\n📊 Verification:');
    
    // Verify tables
    const [tables] = await connection.query('SHOW TABLES') as any;
    console.log(`  Tables created: ${(tables as any[]).length}`);
    
    // Count records
    const [staffCount] = await connection.query('SELECT COUNT(*) as count FROM staff_members') as any;
    const [youthCount] = await connection.query('SELECT COUNT(*) as count FROM youth_participants') as any;
    const [templateCount] = await connection.query('SELECT COUNT(*) as count FROM contract_templates') as any;
    
    console.log(`  Staff members: ${(staffCount as any[])[0].count}`);
    console.log(`  Youth participants: ${(youthCount as any[])[0].count}`);
    console.log(`  Contract templates: ${(templateCount as any[])[0].count}`);
    
    console.log('\n🎉 Database setup complete!\n');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

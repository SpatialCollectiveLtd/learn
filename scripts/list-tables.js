const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function listTables() {
  const sql = neon(process.env.DATABASE_URL);
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tables:');
  tables.forEach(t => console.log('  -', t.table_name));
}
listTables();

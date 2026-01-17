const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Neon PostgreSQL database...');
    
    // Run the migration
    const result = await client.query(`
      ALTER TABLE signed_contracts 
      ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('Added invalidation_reason column to signed_contracts table');
    
    // Verify the column exists
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'signed_contracts' 
      AND column_name = 'invalidation_reason';
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:');
      console.log(verifyResult.rows[0]);
    } else {
      console.log('⚠️  Column not found in verification query');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Database migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });

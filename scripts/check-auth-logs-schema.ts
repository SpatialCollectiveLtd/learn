import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { query } from '../src/lib/db';

async function checkSchema() {
  try {
    const columns = await query<{ column_name: string; data_type: string }>(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'auth_logs'
       ORDER BY ordinal_position`
    );

    console.log('auth_logs columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();

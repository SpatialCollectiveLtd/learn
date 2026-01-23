
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env
import { query, testConnection, closePool } from '../src/lib/db';

async function checkUsers() {
  console.log("Checking database connection and users...");
  
  const connected = await testConnection();
  if (!connected) {
    console.error("Failed to connect to DB");
    process.exit(1);
  }

  try {
    // Check for youth table
    const youthCount = await query('SELECT count(*) FROM youth');
    console.log(`Youth users: ${youthCount[0].count}`);
  } catch (e: any) {
    console.error("Error querying youth table:", e.message);
    if (e.message.includes("relation \"youth\" does not exist")) {
        console.log("Youth table does not exist.");
    }
  }

  try {
    // Check for staff table
    const staffCount = await query('SELECT count(*) FROM staff');
    console.log(`Staff users: ${staffCount[0].count}`);
  } catch (e: any) {
    console.error("Error querying staff table:", e.message);
     if (e.message.includes("relation \"staff\" does not exist")) {
        console.log("Staff table does not exist.");
    }
  }

  await closePool();
}

checkUsers();

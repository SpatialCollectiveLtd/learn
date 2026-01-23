
import 'dotenv/config'; 
import { query, closePool } from '../src/lib/db';

async function listSettlements() {
  console.log("Checking available settlements in database...");
  
  try {
    // Check for distinct settlements in youth_participants (or youth table depending on schema)
    // Based on previous auth route, the model is likely using 'youth_participants' or similar, but the variable was 'youth'.
    // Let's try 'youth_participants' first as seen in the logs "SELECT * FROM youth_participants ..."
    const result = await query('SELECT DISTINCT settlement FROM youth_participants WHERE settlement IS NOT NULL ORDER BY settlement ASC');
    
    console.log(`Found ${result.length} settlements:`);
    result.forEach(row => {
        console.log(`- ${row.settlement}`);
    });

  } catch (e: any) {
    console.error("Error querying settlements:", e.message);
  }

  await closePool();
}

listSettlements();

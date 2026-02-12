const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.learn_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const csvFilePath = path.join(__dirname, '..', 'The 25 moved to Microtasking from Mobile Mapping - 9-02-2026 The 14.csv');

async function moveUsers() {
  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    const youthIds = [];

    // Skip header and empty lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(',');
        if (parts[0]) {
          youthIds.push(parts[0].trim());
        }
      }
    }

    console.log(`Found ${youthIds.length} youth IDs to move:`, youthIds);

    if (youthIds.length === 0) {
      console.log('No youth IDs found.');
      return;
    }

    // Update query
    const query = `
      UPDATE youth_participants
      SET program_type = 'mobile_mapping',
          updated_at = NOW()
      WHERE youth_id = ANY($1)
      RETURNING youth_id, full_name, program_type;
    `;

    const result = await pool.query(query, [youthIds]);
    
    console.log(`Successfully updated ${result.rowCount} users to mobile_mapping.`);
    console.log('Updated users:', result.rows.map(r => `${r.youth_id} (${r.full_name})`).join(', '));

  } catch (err) {
    console.error('Error moving users:', err);
  } finally {
    await pool.end();
  }
}

moveUsers();

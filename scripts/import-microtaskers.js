const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.learn_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CSV file path provided by user: 'Microtaskers - Sheet1.csv'
const csvFilePath = path.join(process.cwd(), 'Microtaskers - Sheet1.csv');

async function importMicrotaskers() {
  try {
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const lines = fileContent.split('\n');
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    console.log(`Starting import from ${csvFilePath}...`);

    // Skip header (line 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // UniqueID,FirstName,LastName,NationalID,Phone,Settlement,Zone,Gender,Age,Module
      const parts = line.split(',');
      if (parts.length < 5) continue;

      const youthId = parts[0]?.trim(); // UniqueID
      const firstName = parts[1]?.trim();
      const lastName = parts[2]?.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const phone = parts[4]?.trim();
      
      let settlementRaw = parts[5]?.trim();
      let settlement = settlementRaw;
      if (settlementRaw === 'kayole_soweto') settlement = 'Kayole Soweto';
      if (settlementRaw === 'kariobangi') settlement = 'Kariobangi Machakos';
      if (settlementRaw === 'mji_wa_huruma') settlement = 'Mji wa Huruma';

      const programType = 'microtasking';
      const moduleAssignment = 'mapper'; // Required by check constraint (mapper, validator)

      if (!youthId) continue;

      try {
        const query = `
          INSERT INTO youth_participants (
            youth_id, full_name, program_type, settlement, phone_number, is_active, module_assignment, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, true, $6, NOW(), NOW()
          )
          ON CONFLICT (youth_id) 
          DO UPDATE SET 
            program_type = EXCLUDED.program_type,
            settlement = EXCLUDED.settlement,
            full_name = EXCLUDED.full_name,
            phone_number = EXCLUDED.phone_number,
            module_assignment = EXCLUDED.module_assignment,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted;
        `;

        const res = await pool.query(query, [youthId, fullName, programType, settlement, phone, moduleAssignment]);
        
        if (res.rows[0].inserted) {
          importedCount++;
        } else {
          updatedCount++;
        }

      } catch (rowErr) {
        console.error(`Error importing ${youthId}:`);
        console.error(rowErr);
        errorCount++;
        // Continue despite errors to try importing others
      }
    }

    console.log('------------------------------------------------');
    console.log(`Import Complete.`);
    console.log(`New Users Inserted: ${importedCount}`);
    console.log(`Existing Users Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('------------------------------------------------');

  } catch (err) {
    console.error('Global Error:', err);
  } finally {
    await pool.end();
  }
}

importMicrotaskers();

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Database connection
const sql = postgres(process.env.learn_DATABASE_URL || process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

async function checkMicrotaskingUsers() {
  try {
    console.log('=== CHECKING MICROTASKING USERS ===\n');
    
    // 1. Check database for microtasking users
    const dbMicrotaskers = await sql`
      SELECT youth_id, full_name, program_type, settlement 
      FROM youth_participants 
      WHERE program_type = 'microtasking'
      ORDER BY youth_id
    `;
    
    console.log(`Database Microtasking Users: ${dbMicrotaskers.length}`);
    
    if (dbMicrotaskers.length > 0) {
      console.log('\nDatabase Users:');
      dbMicrotaskers.forEach(user => {
        console.log(`${user.youth_id} - ${user.full_name} (${user.settlement})`);
      });
    }
    
    // 2. Read CSV file
    const csvPath = path.join(process.cwd(), 'The 25 moved to Microtasking from Mobile Mapping - 9-02-2026 The 14.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.trim().split('\n');
    const csvHeaders = csvLines[0].split(',');
    
    console.log('\n=== CSV ANALYSIS ===');
    console.log(`CSV Headers: ${csvHeaders.join(', ')}`);
    console.log(`CSV Total Users: ${csvLines.length - 1}`); // -1 for header
    
    // Parse CSV data
    const csvUsers = [];
    for (let i = 1; i < csvLines.length; i++) {
      const fields = csvLines[i].split(',');
      csvUsers.push({
        youth_id: fields[0],
        firstName: fields[1],
        lastName: fields[2],
        settlement: fields[5], 
        daysInMicrotasking: parseInt(fields[7]),
        reason: fields[8]
      });
    }
    
    // 3. Count by settlement and days
    const kayoleUsers = csvUsers.filter(user => user.youth_id.startsWith('KAY'));
    console.log(`\nKayole Soweto (KAY) Users: ${kayoleUsers.length}`);
    
    // Days distribution
    const daysCounts = {};
    kayoleUsers.forEach(user => {
      daysCounts[user.daysInMicrotasking] = (daysCounts[user.daysInMicrotasking] || 0) + 1;
    });
    
    console.log('\nDays Distribution:');
    Object.keys(daysCounts).sort().forEach(days => {
      console.log(`${days} days: ${daysCounts[days]} users`);
    });
    
    // 4. Compare CSV vs Database
    console.log('\n=== COMPARISON ===');
    const dbUserIds = new Set(dbMicrotaskers.map(u => u.youth_id));
    const csvUserIds = new Set(csvUsers.map(u => u.youth_id));
    
    console.log(`Database has: ${dbUserIds.size} microtasking users`);
    console.log(`CSV shows: ${csvUserIds.size} users moved to microtasking`);
    
    // Users in CSV but not in DB as microtaskers
    const inCsvNotDb = csvUsers.filter(u => !dbUserIds.has(u.youth_id));
    if (inCsvNotDb.length > 0) {
      console.log(`\nUsers in CSV but NOT in DB as microtaskers: ${inCsvNotDb.length}`);
      inCsvNotDb.slice(0, 5).forEach(user => {
        console.log(`${user.youth_id} - ${user.firstName} ${user.lastName}`);
      });
      if (inCsvNotDb.length > 5) console.log(`... and ${inCsvNotDb.length - 5} more`);
    }
    
    // Users in DB but not in CSV
    const inDbNotCsv = dbMicrotaskers.filter(u => !csvUserIds.has(u.youth_id));
    if (inDbNotCsv.length > 0) {
      console.log(`\nUsers in DB as microtaskers but NOT in CSV: ${inDbNotCsv.length}`);
      inDbNotCsv.forEach(user => {
        console.log(`${user.youth_id} - ${user.full_name}`);
      });
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    if (inCsvNotDb.length > 0) {
      console.log(`• Consider updating ${inCsvNotDb.length} users in database to microtasking program`);
    }
    if (dbUserIds.size === csvUserIds.size && inCsvNotDb.length === 0) {
      console.log('✅ Database and CSV are synchronized!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkMicrotaskingUsers();
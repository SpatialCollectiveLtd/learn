require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Database connection
const sql = postgres(process.env.learn_DATABASE_URL || process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});

async function backupBeforeMicrotaskingUpdate() {
  try {
    console.log('=== BACKING UP DATA BEFORE MICROTASKING UPDATE ===\n');
    
    // 1. Read CSV to get the user IDs we'll be updating
    const csvPath = path.join(process.cwd(), 'The 25 moved to Microtasking from Mobile Mapping - 9-02-2026 The 14.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvLines = csvContent.trim().split('\n');
    
    const userIds = [];
    for (let i = 1; i < csvLines.length; i++) {
      const fields = csvLines[i].split(',');
      userIds.push(fields[0]); // youth_id
    }
    
    // 2. Backup current state of these 25 users
    const usersToBackup = await sql`
      SELECT youth_id, full_name, program_type, module_assignment, settlement, created_at, updated_at
      FROM youth_participants 
      WHERE youth_id = ANY(${userIds})
      ORDER BY youth_id
    `;
    
    // 3. Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `microtasking-users-backup-${timestamp}.json`);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      description: '25 users before converting from mobile_mapping to microtasking',
      csvFile: 'The 25 moved to Microtasking from Mobile Mapping - 9-02-2026 The 14.csv',
      users: usersToBackup
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`Backed up ${usersToBackup.length} user records`);
    
    // 4. Show current program type distribution of these users
    const programCounts = {};
    usersToBackup.forEach(user => {
      programCounts[user.program_type] = (programCounts[user.program_type] || 0) + 1;
    });
    
    console.log('\nCurrent program types of users to be updated:');
    Object.entries(programCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} users`);
    });
    
    console.log('\n🚀 Ready to proceed with microtasking update');
    
  } catch (error) {
    console.error('Backup error:', error.message);
  } finally {
    await sql.end();
  }
}

backupBeforeMicrotaskingUpdate();
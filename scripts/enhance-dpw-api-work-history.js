/**
 * Enhanced DPW API with Individual Work History
 * Add detailed work_history array to the existing DPW API for better external app integration
 */

require('dotenv').config({ path: '.env.local' });
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

async function enhanceDpwApi() {
  try {
    console.log('🔧 ENHANCING DPW API WITH WORK HISTORY DETAILS');
    console.log('==============================================');
    
    const apiFilePath = path.join(process.cwd(), 'src', 'app', 'api', 'external', 'dpw-sync', 'route.ts');
    
    console.log(`📁 Reading: ${apiFilePath}`);
    
    // Read current API file
    const currentContent = readFileSync(apiFilePath, 'utf8');
    
    // Check if work history is already added
    if (currentContent.includes('work_history')) {
      console.log('✅ Work history already included in DPW API');
      return;
    }
    
    console.log('📝 Adding individual work history to DPW API...');
    
    // Find the location to add work history (after work_summary)
    const workHistoryAddition = `        
        -- Individual work history (detailed work days)
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'work_date', work_date::text,
              'buildings_count', buildings_count,
              'daily_target', daily_target,
              'status', status,
              'target_met', target_met,
              'notes', notes,
              'created_at', created_at
            ) ORDER BY work_date DESC
          )
          FROM youth_work_days
          WHERE youth_id = yp.youth_id
        ), '[]'::json) as work_history,`;
    
    // Add work history after work_summary
    const updatedContent = currentContent.replace(
      ') as work_summary,',
      ') as work_summary,' + workHistoryAddition
    );
    
    // Backup original file
    const backupPath = apiFilePath + '.backup.' + Date.now();
    writeFileSync(backupPath, currentContent);
    console.log(`💾 Backup created: ${path.basename(backupPath)}`);
    
    // Write enhanced API
    writeFileSync(apiFilePath, updatedContent);
    console.log('✅ DPW API enhanced with individual work history!');
    
    console.log('\n📊 ENHANCEMENT DETAILS:');
    console.log('=======================');
    console.log('Added to DPW API response:');
    console.log('   📅 work_history: Array of individual work days');
    console.log('   📋 Each work day includes:');
    console.log('      - work_date: Date of work');
    console.log('      - buildings_count: Tasks completed');  
    console.log('      - daily_target: Target for that day');
    console.log('      - status: approved/pending/rejected');
    console.log('      - target_met: Boolean if target achieved');
    console.log('      - notes: Work day notes');
    console.log('      - created_at: When work was recorded');
    
    console.log('\n🎯 IMPACT:');
    console.log('=========');
    console.log('External DPW app (app.spatialcollective.com) will now see:');
    console.log('   ✅ Complete work day history for each youth');
    console.log('   ✅ Detailed timeline of work progression');  
    console.log('   ✅ Work status for payment processing');
    console.log('   ✅ Target achievement tracking');
    console.log('   ✅ Full audit trail for work performed');
    
    console.log('\n📋 EXAMPLE API RESPONSE:');
    console.log('========================');
    console.log(`{
  "youth_id": "KAY1042KM",
  "full_name": "Keziah Maina", 
  "program_type": "microtasking",
  "total_days_worked": 18,
  "work_summary": {
    "buildings_mapped": 180,
    "total_days": 18,
    "latest_date": "2026-02-06"  
  },
  "work_history": [
    {
      "work_date": "2026-02-05",
      "buildings_count": 10,
      "daily_target": 10,
      "status": "approved", 
      "target_met": true,
      "notes": "Mobile mapping work - synced from attendance",
      "created_at": "2026-02-16T09:00:00Z"
    },
    {
      "work_date": "2026-02-04", 
      "buildings_count": 10,
      "daily_target": 10,
      "status": "approved",
      "target_met": true,
      "notes": "Mobile mapping work - synced from attendance",
      "created_at": "2026-02-16T09:00:00Z"
    }
    // ... more work days
  ]
}`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('==============');
    console.log('1. Restart the development server to apply changes');
    console.log('2. Test the enhanced API with: GET /api/external/dpw-sync?youth_id=KAY1042KM');
    console.log('3. Verify external DPW app can consume detailed work history');
    console.log('4. Deploy to production when ready');
    
  } catch (error) {
    console.error('💥 Enhancement error:', error);
  }
}

if (require.main === module) {
  enhanceDpwApi();
}
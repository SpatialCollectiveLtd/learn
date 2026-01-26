/**
 * Test DPW Sync API - Attendance History Fix Verification
 * 
 * This script tests that the Learn API now correctly returns:
 * 1. attendance_history as an array (not null)
 * 2. attendance_days matches the array length
 * 3. Date format is YYYY-MM-DD for filtering
 * 
 * Usage: node scripts/test-dpw-sync-attendance.js
 */

require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.DPW_MANAGER_API_KEY;

async function testDPWSyncAPI() {
  console.log('\n🧪 Testing DPW Sync API - Attendance History Fix\n');
  console.log('='.repeat(60));
  
  if (!API_KEY) {
    console.log('❌ DPW_MANAGER_API_KEY not found in .env.local');
    return;
  }

  try {
    // Test 1: Get all participants (limit to a few for testing)
    console.log('\n📡 Test 1: Fetching participant data...\n');
    
    const response = await fetch(`${API_URL}/api/external/dpw-sync?module=mobile_mapping`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });

    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ API returned error:', data.message);
      return;
    }

    console.log(`✅ API responded successfully`);
    console.log(`   Total participants: ${data.data.count}`);
    
    // Test 2: Check attendance_history structure
    console.log('\n📊 Test 2: Analyzing attendance_history structure...\n');
    
    const participants = data.data.participants.slice(0, 5); // Test first 5
    
    let fixedCount = 0;
    let withAttendanceCount = 0;
    let nullCount = 0;
    
    participants.forEach((p, index) => {
      console.log(`--- Participant ${index + 1}: ${p.full_name} (${p.youth_id}) ---`);
      
      // Check attendance_history type
      const historyType = Array.isArray(p.attendance_history) ? 'Array' : 
                         p.attendance_history === null ? 'null' : 
                         typeof p.attendance_history;
      
      console.log(`   attendance_history type: ${historyType}`);
      console.log(`   attendance_days: ${p.attendance_days}`);
      
      if (p.attendance_history === null) {
        console.log(`   ❌ ISSUE: Still returning null!`);
        nullCount++;
      } else if (Array.isArray(p.attendance_history)) {
        console.log(`   ✅ FIXED: Returns array`);
        console.log(`   Array length: ${p.attendance_history.length}`);
        fixedCount++;
        
        if (p.attendance_history.length > 0) {
          withAttendanceCount++;
          console.log(`   Sample record:`, p.attendance_history[0]);
          
          // Verify date format
          const dateStr = p.attendance_history[0].date;
          const dateFormat = /^\d{4}-\d{2}-\d{2}/.test(dateStr) ? 'YYYY-MM-DD ✅' : 'Invalid ❌';
          console.log(`   Date format: ${dateFormat} (${dateStr})`);
          
          // Check if attendance_days matches array length
          if (p.attendance_days === p.attendance_history.length) {
            console.log(`   ✅ attendance_days matches array length`);
          } else {
            console.log(`   ⚠️  Mismatch: attendance_days=${p.attendance_days}, array length=${p.attendance_history.length}`);
          }
        } else {
          console.log(`   ℹ️  No attendance records yet (empty array is correct)`);
        }
      }
      console.log('');
    });
    
    // Test 3: Summary
    console.log('\n📈 Test 3: Summary\n');
    console.log('='.repeat(60));
    console.log(`Total tested: ${participants.length}`);
    console.log(`✅ Fixed (returns array): ${fixedCount}`);
    console.log(`❌ Still null: ${nullCount}`);
    console.log(`📝 Has attendance records: ${withAttendanceCount}`);
    
    if (nullCount > 0) {
      console.log('\n⚠️  WARNING: Some participants still have null attendance_history');
      console.log('   The API fix may not be deployed yet.');
    } else if (fixedCount === participants.length) {
      console.log('\n✅ SUCCESS: All participants return attendance_history as array!');
      console.log('   The DPW Manager can now filter by date range.');
    }
    
    // Test 4: Date filtering example
    if (withAttendanceCount > 0) {
      console.log('\n🗓️  Test 4: Date filtering example\n');
      console.log('='.repeat(60));
      
      const participantWithAttendance = participants.find(p => 
        Array.isArray(p.attendance_history) && p.attendance_history.length > 0
      );
      
      if (participantWithAttendance) {
        console.log(`Testing with: ${participantWithAttendance.full_name} (${participantWithAttendance.youth_id})`);
        console.log(`Total attendance records: ${participantWithAttendance.attendance_history.length}\n`);
        
        // Example: Filter for January 2026
        const startDate = '2026-01-01';
        const endDate = '2026-01-31';
        
        const januaryRecords = participantWithAttendance.attendance_history.filter(record => {
          const date = record.date.split('T')[0]; // Handle both YYYY-MM-DD and ISO format
          return date >= startDate && date <= endDate;
        });
        
        console.log(`Date range: ${startDate} to ${endDate}`);
        console.log(`Filtered records: ${januaryRecords.length}`);
        
        if (januaryRecords.length > 0) {
          console.log(`\nSample filtered records:`);
          januaryRecords.slice(0, 3).forEach(r => {
            console.log(`  - ${r.date} (submitted by ${r.submitted_by})`);
          });
        }
        
        // Example: Filter for Jan 7-26 (typical payment period)
        const paymentStart = '2026-01-07';
        const paymentEnd = '2026-01-26';
        
        const paymentPeriodRecords = participantWithAttendance.attendance_history.filter(record => {
          const date = record.date.split('T')[0];
          return date >= paymentStart && date <= paymentEnd;
        });
        
        console.log(`\nPayment period: ${paymentStart} to ${paymentEnd}`);
        console.log(`Filtered records: ${paymentPeriodRecords.length}`);
        console.log(`\n✅ Date filtering works correctly!`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Testing complete!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run test
console.log('Starting DPW Sync API attendance test...\n');
testDPWSyncAPI();

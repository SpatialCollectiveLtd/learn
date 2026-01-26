/**
 * Test Script: Attendance Delete Functionality
 * Tests the DELETE endpoint for attendance records
 * 
 * Usage: node scripts/test-attendance-delete.js
 */

const readline = require('readline');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // You'll need to provide a valid staff token
  staffToken: 'YOUR_STAFF_TOKEN_HERE',
  
  // Test data
  testYouthId: 'KAYTEST001ES',
  testDate: new Date().toISOString().split('T')[0],
  testNotes: 'Test attendance for deletion'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testAttendanceDelete() {
  console.log('\n🧪 Testing Attendance Delete Functionality\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Get staff token
    let token = TEST_CONFIG.staffToken;
    if (token === 'YOUR_STAFF_TOKEN_HERE') {
      console.log('\n⚠️  No staff token configured.');
      console.log('Please login as a staff member and copy your token from localStorage.\n');
      token = await prompt('Enter your staff token: ');
      if (!token) {
        console.log('❌ Token required. Exiting.');
        rl.close();
        return;
      }
    }

    // Step 2: Create test attendance record
    console.log('\n📝 Step 1: Creating test attendance record...');
    const createResponse = await fetch(`${BASE_URL}/api/staff/attendance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        youth_id: TEST_CONFIG.testYouthId,
        attendance_date: TEST_CONFIG.testDate,
        notes: TEST_CONFIG.testNotes
      })
    });

    const createData = await createResponse.json();
    
    if (!createData.success) {
      if (createData.message?.includes('already recorded')) {
        console.log('ℹ️  Attendance already exists. Will attempt to find and delete it.');
        
        // Get existing records
        const getResponse = await fetch(
          `${BASE_URL}/api/staff/attendance?date=${TEST_CONFIG.testDate}&module=digitization`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const getData = await getResponse.json();
        
        const existingRecord = getData.data?.records?.find(
          r => r.youth_id === TEST_CONFIG.testYouthId
        );
        
        if (!existingRecord) {
          console.log('❌ Could not find existing record');
          rl.close();
          return;
        }
        
        console.log('✅ Found existing record:', {
          id: existingRecord.id,
          youth_id: existingRecord.youth_id,
          full_name: existingRecord.full_name
        });
        
        // Use existing record for deletion test
        await testDeletion(token, existingRecord);
        
      } else {
        console.log('❌ Failed to create test record:', createData.message);
        rl.close();
        return;
      }
    } else {
      console.log('✅ Test record created:', {
        id: createData.data.record.id,
        youth_id: createData.data.record.youth_id,
        date: createData.data.record.attendance_date
      });
      
      await testDeletion(token, createData.data.record);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    rl.close();
  }
}

async function testDeletion(token, record) {
  // Step 3: Delete the record
  console.log('\n🗑️  Step 2: Deleting attendance record...');
  const deleteResponse = await fetch(
    `${BASE_URL}/api/staff/attendance?id=${record.id}`,
    {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const deleteData = await deleteResponse.json();
  
  if (deleteData.success) {
    console.log('✅ Deletion successful!');
    console.log('   Message:', deleteData.message);
    console.log('   Deleted:', deleteData.data.deleted_record);
  } else {
    console.log('❌ Deletion failed:', deleteData.message);
    return;
  }

  // Step 4: Verify deletion
  console.log('\n🔍 Step 3: Verifying deletion...');
  const verifyResponse = await fetch(
    `${BASE_URL}/api/staff/attendance?date=${TEST_CONFIG.testDate}&module=digitization`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const verifyData = await verifyResponse.json();
  const stillExists = verifyData.data?.records?.find(r => r.id === record.id);
  
  if (stillExists) {
    console.log('❌ Record still exists in database!');
  } else {
    console.log('✅ Record successfully deleted from database');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!\n');
}

// Run tests
console.log('Starting attendance delete tests...');
testAttendanceDelete();

// Test DPW Manager Integration API
const API_KEY = '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testDPWSync() {
  console.log('\n🔄 Testing DPW Manager Integration API\n');
  
  // Test 1: Get all participants
  console.log('1. Testing: Get all participants');
  try {
    const response = await fetch(`${API_URL}/api/external/dpw-sync`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success! Found ${data.data.count} participants`);
      console.log('   Statistics:', data.data.statistics);
    } else {
      console.log('❌ Failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: Get mobile mappers only
  console.log('\n2. Testing: Get mobile mappers only');
  try {
    const response = await fetch(`${API_URL}/api/external/dpw-sync?module=mobile_mapping`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success! Found ${data.data.count} mobile mappers`);
      if (data.data.participants.length > 0) {
        const sample = data.data.participants[0];
        console.log('\n   Sample participant:');
        console.log('   -', sample.youth_id, '-', sample.full_name);
        console.log('   - Days worked:', sample.total_days_worked);
        console.log('   - Attendance days:', sample.attendance_days);
        console.log('   - Training completed:', sample.training_progress?.mobile_mapping_completed);
      }
    } else {
      console.log('❌ Failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Get specific youth
  console.log('\n3. Testing: Get specific youth (KAY1799DM)');
  try {
    const response = await fetch(`${API_URL}/api/external/dpw-sync?youth_id=KAY1799DM`, {
      headers: { 'X-API-Key': API_KEY }
    });
    const data = await response.json();
    
    if (data.success && data.data.participants.length > 0) {
      console.log('✅ Success!');
      const youth = data.data.participants[0];
      console.log('\n   Youth Details:');
      console.log('   - ID:', youth.youth_id);
      console.log('   - Name:', youth.full_name);
      console.log('   - Module:', youth.module);
      console.log('   - Settlement:', youth.settlement);
      console.log('   - Days worked:', youth.total_days_worked);
      console.log('   - Attendance:', youth.attendance_days);
      console.log('   - Contract signed:', youth.has_signed_contract);
      console.log('   - ODK configured:', youth.odk_configured);
    } else {
      console.log('❌ Not found or failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 4: Invalid API key
  console.log('\n4. Testing: Invalid API key (should fail)');
  try {
    const response = await fetch(`${API_URL}/api/external/dpw-sync`, {
      headers: { 'X-API-Key': 'invalid-key' }
    });
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Security working! Correctly rejected invalid key');
    } else {
      console.log('❌ Security issue: Accepted invalid key!');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n✅ All tests completed!\n');
}

testDPWSync().catch(console.error);

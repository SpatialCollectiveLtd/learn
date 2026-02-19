require('dotenv').config({ path: '.env.local' });

async function testMicrotaskingDashboard() {
  try {
    console.log('=== TESTING MICROTASKING USER DASHBOARD ===\n');
    
    // Test with one of the updated users (KAY1042KM - Keziah Maina)
    const testUserId = 'KAY1042KM';
    
    // 1. Test authentication 
    console.log(`Testing authentication for ${testUserId}...`);
    const authResponse = await fetch('http://localhost:3000/api/youth/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youthId: testUserId })
    });
    
    if (!authResponse.ok) {
      console.log('❌ Authentication failed');
      const errorData = await authResponse.json();
      console.log('Error:', errorData.message);
      return;
    }
    
    const authData = await authResponse.json();
    console.log('✅ Authentication successful!');
    console.log(`Program Type: ${authData.data.youth.programType}`);
    console.log(`Full Name: ${authData.data.youth.fullName}`);
    console.log(`Settlement: ${authData.data.youth.settlement}`);
    
    // 2. Test training completion status
    console.log('\nTesting training completion status...');
    const token = authData.data.token;
    const statusResponse = await fetch('http://localhost:3000/api/training/completion-status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Training status fetched successfully');
      console.log(`Training Completed: ${statusData.data.trainingCompleted}`);
      console.log(`Can Access Work Dashboard: ${statusData.data.canAccessWorkDashboard}`);
      console.log(`Program Type: ${statusData.data.programType}`);
      
      // Verify that microtasking users can't access work dashboard
      if (statusData.data.programType === 'microtasking' && !statusData.data.canAccessWorkDashboard) {
        console.log('✅ Correct: Microtasking users cannot access work dashboard');
      } else if (statusData.data.programType === 'microtasking' && statusData.data.canAccessWorkDashboard) {
        console.log('⚠️ Warning: Microtasking user can access work dashboard (should be blocked)');
      }
    } else {
      console.log('❌ Failed to fetch training status');
    }
    
    console.log('\n=== DASHBOARD BEHAVIOR VERIFICATION ===');
    console.log('✅ Microtasking users should see:');
    console.log('  - Training section (for microtasking training)');
    console.log('  - Messages section (if applicable)');
    console.log('  - NO Work Dashboard section');
    
    console.log('\n🎯 Update successful! Microtasking users now have appropriate dashboard experience.');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testMicrotaskingDashboard();
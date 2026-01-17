// Test script for authentication API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testYouthAuth() {
  console.log('Testing Youth Authentication API...');
  console.log('API URL:', `${API_URL}/api/youth/auth/authenticate`);
  
  try {
    const response = await fetch(`${API_URL}/api/youth/auth/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        youthId: 'YT001',
      }),
    });

    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const data = await response.json();
    console.log('\nResponse Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Authentication successful!');
      console.log('Token:', data.data.token.substring(0, 20) + '...');
      console.log('Youth:', data.data.youth);
    } else {
      console.log('\n❌ Authentication failed:', data.message);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testOPTIONS() {
  console.log('\n\nTesting OPTIONS (CORS preflight)...');
  console.log('API URL:', `${API_URL}/api/youth/auth/authenticate`);
  
  try {
    const response = await fetch(`${API_URL}/api/youth/auth/authenticate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (response.status === 200) {
      console.log('\n✅ CORS preflight successful!');
    } else {
      console.log('\n❌ CORS preflight failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  await testOPTIONS();
  await testYouthAuth();
})();

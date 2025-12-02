// Test API Endpoints
const testYouthAuth = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/youth/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youthId: 'YT001' })
    });
    const data = await response.json();
    console.log('Youth Auth Response:', data);
  } catch (error) {
    console.error('Youth Auth Error:', error);
  }
};

const testStaffAuth = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/staff/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId: 'SC001' })
    });
    const data = await response.json();
    console.log('Staff Auth Response:', data);
  } catch (error) {
    console.error('Staff Auth Error:', error);
  }
};

const testHealth = async () => {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('Health Check:', data);
  } catch (error) {
    console.error('Health Check Error:', error);
  }
};

// Run tests
console.log('🧪 Testing API Endpoints...\n');
testHealth().then(() => testYouthAuth()).then(() => testStaffAuth());

/**
 * Test the work days count API to verify it returns the new fields
 */

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

// Create a test token for a Kariobangi user
const testToken = jwt.sign(
  { youthId: 'KAR158KM' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function testAPI() {
  console.log('\n🧪 Testing /api/work/days/count endpoint\n');
  console.log('='.repeat(70));
  
  try {
    const baseUrl = 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/work/days/count`, {
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    const data = await response.json();
    
    console.log('\n📡 API Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n✅ API is working!');
      console.log('\nReturned fields:');
      Object.keys(data.data).forEach(key => {
        console.log(`  - ${key}: ${data.data[key]}`);
      });
      
      if (data.data.daysWorked2025 !== undefined && data.data.daysWorked2026 !== undefined) {
        console.log('\n✅ New fields (daysWorked2025, daysWorked2026) are present!');
        console.log(`   2025: ${data.data.daysWorked2025}`);
        console.log(`   2026: ${data.data.daysWorked2026}`);
        console.log(`   Total: ${data.data.daysWorked}`);
      } else {
        console.log('\n❌ New fields are MISSING!');
        console.log('   The API needs to be restarted or redeployed.');
      }
    } else {
      console.log('\n❌ API Error:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure the development server is running:');
    console.log('  npm run dev');
  }
  
  console.log('\n' + '='.repeat(70));
}

testAPI();

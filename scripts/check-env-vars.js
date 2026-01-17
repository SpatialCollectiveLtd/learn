require('dotenv').config({ path: '.env.local' });

console.log('Checking environment variables...\n');

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DPW_MANAGER_API_KEY'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first 10 chars for security
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\nFull DPW_MANAGER_API_KEY check:');
console.log('Value:', process.env.DPW_MANAGER_API_KEY);
console.log('Type:', typeof process.env.DPW_MANAGER_API_KEY);
console.log('Length:', process.env.DPW_MANAGER_API_KEY ? process.env.DPW_MANAGER_API_KEY.length : 0);

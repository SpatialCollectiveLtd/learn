// Test DPW API directly
async function testAPI() {
  console.log('Testing DPW API...\n');
  
  const API_KEY = '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';
  const URL = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping';
  
  try {
    console.log('URL:', URL);
    console.log('API Key:', API_KEY.substring(0, 20) + '...\n');
    
    const response = await fetch(URL, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse Body:');
    
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw text (not JSON):', text);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPI();

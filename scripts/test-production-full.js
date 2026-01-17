// Comprehensive production API test
async function testAPI() {
  console.log('🔍 Testing Production DPW API\n');
  console.log('=' .repeat(60));
  
  const API_KEY = '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3';
  
  // Test 1: Mobile mappers
  console.log('\n📱 Test 1: Mobile Mappers Query');
  console.log('-'.repeat(60));
  try {
    const url1 = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping';
    const res1 = await fetch(url1, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    console.log(`Status: ${res1.status} ${res1.statusText}`);
    console.log(`Cache: ${res1.headers.get('x-vercel-cache')}`);
    console.log(`ID: ${res1.headers.get('x-vercel-id')}`);
    
    const data1 = await res1.json();
    
    if (res1.status === 200) {
      console.log('\n✅ SUCCESS');
      console.log(`Found ${data1.data?.count || 0} participants`);
      if (data1.data?.statistics) {
        console.log('\nStatistics:', JSON.stringify(data1.data.statistics, null, 2));
      }
      if (data1.data?.participants?.[0]) {
        const sample = data1.data.participants[0];
        console.log('\nSample participant:');
        console.log(`  - ID: ${sample.youth_id}`);
        console.log(`  - Name: ${sample.full_name}`);
        console.log(`  - Module: ${sample.module}`);
        console.log(`  - Days worked: ${sample.total_days_worked}`);
        console.log(`  - Work summary:`, sample.work_summary);
      }
    } else {
      console.log('\n❌ FAILED');
      console.log('Error:', data1);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  // Test 2: Specific youth
  console.log('\n\n👤 Test 2: Specific Youth (KAY1799DM)');
  console.log('-'.repeat(60));
  try {
    const url2 = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync?youth_id=KAY1799DM';
    const res2 = await fetch(url2, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    console.log(`Status: ${res2.status} ${res2.statusText}`);
    
    const data2 = await res2.json();
    
    if (res2.status === 200) {
      console.log('\n✅ SUCCESS');
      if (data2.data?.participants?.[0]) {
        const youth = data2.data.participants[0];
        console.log(JSON.stringify(youth, null, 2));
      }
    } else {
      console.log('\n❌ FAILED');
      console.log('Error:', data2);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  // Test 3: Invalid API key
  console.log('\n\n🔐 Test 3: Security - Invalid API Key');
  console.log('-'.repeat(60));
  try {
    const url3 = 'https://learn.spatialcollective.co.ke/api/external/dpw-sync';
    const res3 = await fetch(url3, {
      headers: { 'X-API-Key': 'invalid_key_12345' }
    });
    
    console.log(`Status: ${res3.status} ${res3.statusText}`);
    
    const data3 = await res3.json();
    
    if (res3.status === 401) {
      console.log('\n✅ SECURITY WORKING - Correctly rejected invalid key');
    } else {
      console.log('\n⚠️  Security issue - Should return 401');
      console.log('Response:', data3);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Tests complete!\n');
}

testAPI();

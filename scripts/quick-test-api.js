async function testAPI() {
  console.log('\n🧪 Testing Attendance API\n');
  
  try {
    // Test without auth to see the error
    const response = await fetch('http://localhost:3000/api/staff/attendance?date=2026-01-15&module=mobile_mapping');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('\n📊 Results:');
      console.log('- Total Mappers:', data.data.total_mappers);
      console.log('- Attendance Count:', data.data.attendance_count);
      console.log('- Records:', data.data.records?.length || 0);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

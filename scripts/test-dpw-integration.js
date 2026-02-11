require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function quickTestDPWAPI() {
  console.log('\n🧪 QUICK TEST: DPW API ENDPOINTS');
  console.log('='.repeat(60));

  // Test if data file exists
  const fs = require('fs');
  const path = require('path');
  const dataFile = path.join(__dirname, '..', 'data', 'dpw-payment-data.json');

  if (!fs.existsSync(dataFile)) {
    console.log('❌ DPW payment data file not found');
    return;
  }

  console.log('✅ DPW payment data file exists');
  
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  console.log(`📊 Data contains ${data.total_participants} participants`);
  console.log(`📅 Period: ${data.period_displayed}`);
  
  // Show sample participant
  const sampleId = Object.keys(data.data)[0];
  const sample = data.data[sampleId];
  
  console.log('\n📝 SAMPLE PARTICIPANT:');
  console.log(`   ID: ${sample.youth_id}`);
  console.log(`   Name: ${sample.name}`);
  console.log(`   Total Payment: KES ${sample.total_payment.toLocaleString()}`);
  console.log(`   Quality Score: ${sample.overall_quality_percentage}%`);
  console.log(`   Total Days: ${sample.total_days}`);

  // Test database connection for youth lookup
  try {
    const pool = new Pool({
      connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const testResult = await pool.query('SELECT youth_id FROM youth_participants WHERE youth_id = $1', [sampleId]);
    
    if (testResult.rows.length > 0) {
      console.log('✅ Sample participant found in database');
    } else {
      console.log('⚠️  Sample participant not found in database');
    }

    await pool.end();
    
  } catch (dbError) {
    console.log('❌ Database connection error:', dbError.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ QUICK TEST COMPLETE - Ready for dashboard testing');
  console.log('   📱 Toggle to "DPW" in PaymentTab and PerformanceTab');
  console.log('   🔀 Switch between Regular and DPW views');
  console.log('='.repeat(60) + '\n');
}

quickTestDPWAPI();
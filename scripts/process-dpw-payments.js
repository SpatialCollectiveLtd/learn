require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.learn_DATABASE_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function processPaymentData() {
  console.log('\n🔄 PROCESSING DPW PAYMENT DATA FOR DASHBOARD');
  console.log('='.repeat(80));
  
  try {
    // Read Excel files
    const cycle2File = path.join(__dirname, '..', 'DPW Cycle 2 Payment Sheet - Master.xlsx');
    const cycle3File = path.join(__dirname, '..', 'DPW Cycle 3 Payment Sheet - Master.xlsx');
    
    if (!fs.existsSync(cycle2File) || !fs.existsSync(cycle3File)) {
      console.log('❌ Excel files not found');
      return;
    }
    
    // Read Cycle 2 data (Jan 7-23)
    const cycle2Workbook = XLSX.readFile(cycle2File);
    const cycle2Sheet = cycle2Workbook.Sheets[cycle2Workbook.SheetNames[0]];
    const cycle2Data = XLSX.utils.sheet_to_json(cycle2Sheet);
    
    console.log(`📊 CYCLE 2: ${cycle2Data.length} participants`);
    
    // Read Cycle 3 data (Jan 26-Feb 6)  
    const cycle3Workbook = XLSX.readFile(cycle3File);
    const cycle3Sheet = cycle3Workbook.Sheets[cycle3Workbook.SheetNames[0]];
    const cycle3Data = XLSX.utils.sheet_to_json(cycle3Sheet);
    
    console.log(`📊 CYCLE 3: ${cycle3Data.length} participants`);
    
    // Process and combine data by youth ID
    const combinedPaymentData = {};
    
    // Process Cycle 2
    cycle2Data.forEach(row => {
      const youthId = row['Unique ID'];
      if (youthId) {
        combinedPaymentData[youthId] = {
          youth_id: youthId,
          name: row['Name'],
          settlement: row['Village'],
          program_type: row['Cohort'],
          cycle2: {
            days_present: row['Number of Days Present'] || 0,
            base_pay: row['Cumulative Base Pay'] || 0,
            quality_pay: row['Cumulative Quality Pay'] || 0,
            total_earned: row['Total Amount Earned'] || 0,
            period: 'Jan 7-23, 2025'
          },
          cycle3: null,
          total_payment: row['Total Amount Earned'] || 0,
          total_days: row['Number of Days Present'] || 0
        };
      }
    });
    
    // Process Cycle 3
    cycle3Data.forEach(row => {
      const youthId = row['Unique ID'];
      if (youthId) {
        if (combinedPaymentData[youthId]) {
          // Add Cycle 3 to existing Cycle 2 data
          combinedPaymentData[youthId].cycle3 = {
            days_present: row['Number of Days Present'] || 0,
            base_pay: row['Cumulative Base Pay'] || 0,
            quality_pay: row['Cumulative Quality Pay'] || 0,
            total_earned: row['Total Amount Earned'] || 0,
            period: 'Jan 26-Feb 6, 2025'
          };
          combinedPaymentData[youthId].total_payment += row['Total Amount Earned'] || 0;
          combinedPaymentData[youthId].total_days += row['Number of Days Present'] || 0;
        } else {
          // Cycle 3 only participant
          combinedPaymentData[youthId] = {
            youth_id: youthId,
            name: row['Name'],
            settlement: row['Village'],
            program_type: row['Cohort'],
            cycle2: null,
            cycle3: {
              days_present: row['Number of Days Present'] || 0,
              base_pay: row['Cumulative Base Pay'] || 0,
              quality_pay: row['Cumulative Quality Pay'] || 0,
              total_earned: row['Total Amount Earned'] || 0,
              period: 'Jan 26-Feb 6, 2025'
            },
            total_payment: row['Total Amount Earned'] || 0,
            total_days: row['Number of Days Present'] || 0
          };
        }
      }
    });
    
    console.log(`\n🔗 COMBINED DATA: ${Object.keys(combinedPaymentData).length} unique participants`);
    
    // Calculate quality scores (quality pay / base pay * 100)
    Object.values(combinedPaymentData).forEach(participant => {
      if (participant.cycle2) {
        const basePay = participant.cycle2.base_pay;
        const qualityPay = participant.cycle2.quality_pay;
        participant.cycle2.quality_percentage = basePay > 0 ? Math.round((qualityPay / basePay) * 100) : 0;
      }
      
      if (participant.cycle3) {
        const basePay = participant.cycle3.base_pay;
        const qualityPay = participant.cycle3.quality_pay;
        participant.cycle3.quality_percentage = basePay > 0 ? Math.round((qualityPay / basePay) * 100) : 0;
      }
      
      // Overall quality percentage
      const totalBasePay = (participant.cycle2?.base_pay || 0) + (participant.cycle3?.base_pay || 0);
      const totalQualityPay = (participant.cycle2?.quality_pay || 0) + (participant.cycle3?.quality_pay || 0);
      participant.overall_quality_percentage = totalBasePay > 0 ? Math.round((totalQualityPay / totalBasePay) * 100) : 0;
    });
    
    // Save processed data to JSON for API use
    const outputFile = path.join(__dirname, '..', 'data', 'dpw-payment-data.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFile, JSON.stringify({
      generated_at: new Date().toISOString(),
      period_displayed: 'Feb 7-6, 2025',
      cycle2_period: 'Jan 7-23, 2025',
      cycle3_period: 'Jan 26-Feb 6, 2025',
      total_participants: Object.keys(combinedPaymentData).length,
      data: combinedPaymentData
    }, null, 2));
    
    console.log(`💾 SAVED: ${outputFile}`);
    
    // Show some sample data
    console.log('\n📝 SAMPLE PROCESSED DATA:');
    const sampleIds = Object.keys(combinedPaymentData).slice(0, 3);
    sampleIds.forEach(youthId => {
      const p = combinedPaymentData[youthId];
      console.log(`\n   ${youthId}: ${p.name} (${p.program_type})`);
      console.log(`   Total Payment: KES ${p.total_payment.toLocaleString()}`);
      console.log(`   Total Days: ${p.total_days}`);
      console.log(`   Quality Score: ${p.overall_quality_percentage}%`);
      
      if (p.cycle2) {
        console.log(`   Cycle 2: ${p.cycle2.days_present} days, KES ${p.cycle2.total_earned.toLocaleString()}, ${p.cycle2.quality_percentage}% quality`);
      }
      if (p.cycle3) {
        console.log(`   Cycle 3: ${p.cycle3.days_present} days, KES ${p.cycle3.total_earned.toLocaleString()}, ${p.cycle3.quality_percentage}% quality`);
      }
    });
    
    // Get database youth for validation
    const dbQuery = `SELECT youth_id, full_name, program_type FROM youth_participants WHERE youth_id = ANY($1)`;
    const dbResult = await pool.query(dbQuery, [Object.keys(combinedPaymentData)]);
    
    const matchedYouth = dbResult.rows.length;
    const totalPaymentParticipants = Object.keys(combinedPaymentData).length;
    
    console.log(`\n✅ DATABASE MATCH: ${matchedYouth}/${totalPaymentParticipants} participants found in database`);
    
    // Show unmatched for debugging
    const dbYouthIds = new Set(dbResult.rows.map(row => row.youth_id));
    const unmatchedIds = Object.keys(combinedPaymentData).filter(id => !dbYouthIds.has(id));
    
    if (unmatchedIds.length > 0) {
      console.log(`\n⚠️  UNMATCHED IDs (${unmatchedIds.length}):`, unmatchedIds.slice(0, 5).join(', '), unmatchedIds.length > 5 ? '...' : '');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await pool.end();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ PAYMENT DATA PROCESSING COMPLETE');
  console.log('   Next: Update PaymentTab and PerformanceTab to use this data');
  console.log('='.repeat(80) + '\n');
}

processPaymentData();
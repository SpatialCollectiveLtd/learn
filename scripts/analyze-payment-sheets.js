const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function analyzePaymentSheets() {
  console.log('\n📊 ANALYZING DPW PAYMENT SHEETS');
  console.log('='.repeat(80));

  const files = [
    'DPW Cycle 2 Payment Sheet - Master.xlsx',
    'DPW Cycle 3 Payment Sheet - Master.xlsx'
  ];

  for (const filename of files) {
    const filePath = path.join(__dirname, '..', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filename}`);
      continue;
    }

    try {
      console.log(`\n📋 ANALYZING: ${filename}`);
      console.log('-'.repeat(60));
      
      const workbook = XLSX.readFile(filePath);
      
      // List all sheets
      console.log(`📑 Sheets: ${workbook.SheetNames.join(', ')}`);
      
      // Analyze first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON to see structure
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`\n📊 First Sheet: "${firstSheetName}"`);
      console.log(`   Rows: ${data.length}`);
      
      // Show headers (first row)
      if (data.length > 0) {
        console.log(`   Headers: ${data[0].join(', ')}`);
      }
      
      // Show sample data (first few rows)
      console.log('\n📝 Sample Data:');
      for (let i = 0; i < Math.min(5, data.length); i++) {
        console.log(`   Row ${i + 1}: ${JSON.stringify(data[i])}`);
      }
      
      // Look for specific columns
      const headers = data[0] || [];
      const relevantColumns = headers.filter(header => {
        if (typeof header !== 'string') return false;
        const h = header.toLowerCase();
        return h.includes('id') || h.includes('name') || h.includes('payment') || 
               h.includes('quality') || h.includes('score') || h.includes('amount') ||
               h.includes('total') || h.includes('rate') || h.includes('pois');
      });
      
      if (relevantColumns.length > 0) {
        console.log(`\n🔍 Relevant Columns: ${relevantColumns.join(', ')}`);
      }

    } catch (error) {
      console.log(`❌ Error reading ${filename}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(80) + '\n');
}

// Check if xlsx package is available
try {
  analyzePaymentSheets();
} catch (error) {
  console.log('Note: xlsx package not found. Install with: npm install xlsx');
  console.log('For now, please manually describe the Excel file structure.');
}
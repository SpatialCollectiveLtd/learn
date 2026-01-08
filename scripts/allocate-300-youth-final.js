const fs = require('fs');

// The 40 youth actually in digitization (matched by ID Number)
const actualDigitizationIDs = [
  "39339331", "42129862", "42227405", "42284396", "41690306", "794479841",
  "29361872", "32464224", "37563136", "42580985", "33107603", "39008822",
  "38322816", "37924586", "29978724", "40326505", "34881547", "37025915",
  "39801712", "38833676", "39840210", "38034939", "39952811", "35327007",
  "37911721", "36420304", "42307801", "41272996", "39166611", "39991406",
  "39168987", "37812985", "780840244", "29114677", "305733708", "38454037",
  "36117151", "523579589", "39656945", "30550499"
];

// The 14 dropouts from earlier analysis (by Youth ID)
const dropoutIDs = [
  "KAY1278MK", "KAY2015NM", "KAY2615VO", "KAR074GA", "KAR282PM",
  "KAR224FM", "KAR181SM", "KAR019JM", "HUR478JM", "HUR564KM",
  "KAY733CM", "KAY269JW", "KAY1255GO", "KAY2326TO"
];

// Read the actual raw data
const rawDataContent = fs.readFileSync('scripts/count-actual-disabilities.js', 'utf8');
const match = rawDataContent.match(/const rawData = `([^`]+)`/s);
if (!match) {
  console.error('ERROR: Could not extract raw data');
  process.exit(1);
}
const rawData = match[1];
const lines = rawData.trim().split('\n').slice(1);

const allYouth = [];

lines.forEach(line => {
  const parts = line.split('\t');
  const uniqueId = parts[0].trim();
  const firstName = parts[1].trim();
  const lastName = parts[2].trim();
  const nationalId = parts[3].trim();
  const phone = parts[4].trim();
  const age = parts[5].trim();
  const gender = parts[6].trim();
  const settlement = parts[7].trim();
  const zone = parts[8] ? parts[8].trim() : '';
  const disability = parts[9] ? parts[9].trim() : '';
  
  if (uniqueId) {
    allYouth.push({
      uniqueId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      nationalId,
      phone,
      age,
      gender,
      settlement,
      zone,
      disability,
      hasDisability: disability !== '' && disability.toLowerCase() !== 'none'
    });
  }
});

console.log(`Total youth in 300 list: ${allYouth.length}`);

// Separate into groups
const digitizationYouth = [];
const dropoutYouth = [];
const remainingYouth = [];

allYouth.forEach(youth => {
  if (actualDigitizationIDs.includes(youth.nationalId)) {
    digitizationYouth.push({ ...youth, module: 'digitization' });
  } else if (dropoutIDs.includes(youth.uniqueId)) {
    dropoutYouth.push({ ...youth, module: 'dropout' });
  } else {
    remainingYouth.push(youth);
  }
});

console.log(`\n=== SEPARATION ===`);
console.log(`Digitization (40 who showed up): ${digitizationYouth.length}`);
console.log(`Dropouts (not allocated yet): ${dropoutYouth.length}`);
console.log(`Remaining to allocate: ${remainingYouth.length}`);

// From remaining, separate by disability
const withDisabilities = remainingYouth.filter(y => y.hasDisability);
const withoutDisabilities = remainingYouth.filter(y => !y.hasDisability);

console.log(`\n=== REMAINING BREAKDOWN ===`);
console.log(`With disabilities: ${withDisabilities.length}`);
console.log(`Without disabilities: ${withoutDisabilities.length}`);

// Module allocation for remaining
// 1. All with disabilities → Microtasking
const microtaskingYouth = withDisabilities.map(y => ({ ...y, module: 'microtasking' }));

// 2. Without disabilities: 60% Mobile Mapping, 40% Household Survey
const mobileCount = Math.round(withoutDisabilities.length * 0.6);
const householdCount = withoutDisabilities.length - mobileCount;

const mobileMappingYouth = withoutDisabilities.slice(0, mobileCount).map(y => ({ ...y, module: 'mobile_mapping' }));
const householdSurveyYouth = withoutDisabilities.slice(mobileCount).map(y => ({ ...y, module: 'household_survey' }));

console.log(`\n=== FINAL MODULE ALLOCATION ===`);
console.log(`Digitization: ${digitizationYouth.length}`);
console.log(`Dropouts (no module): ${dropoutYouth.length}`);
console.log(`Microtasking: ${microtaskingYouth.length} (all with disabilities)`);
console.log(`Mobile Mapping: ${mobileMappingYouth.length} (60% of remaining)`);
console.log(`Household Survey: ${householdSurveyYouth.length} (40% of remaining)`);
console.log(`TOTAL: ${digitizationYouth.length + dropoutYouth.length + microtaskingYouth.length + mobileMappingYouth.length + householdSurveyYouth.length}`);

// Verify = 300
const total = digitizationYouth.length + dropoutYouth.length + microtaskingYouth.length + mobileMappingYouth.length + householdSurveyYouth.length;
if (total !== 300) {
  console.log(`\n⚠️  WARNING: Total is ${total}, not 300!`);
} else {
  console.log(`\n✅ Total matches 300 youth`);
}

// Save outputs
fs.writeFileSync('module-allocation-digitization.json', JSON.stringify(digitizationYouth, null, 2));
fs.writeFileSync('module-allocation-dropouts.json', JSON.stringify(dropoutYouth, null, 2));
fs.writeFileSync('module-allocation-microtasking.json', JSON.stringify(microtaskingYouth, null, 2));
fs.writeFileSync('module-allocation-mobile-mapping.json', JSON.stringify(mobileMappingYouth, null, 2));
fs.writeFileSync('module-allocation-household-survey.json', JSON.stringify(householdSurveyYouth, null, 2));

// Create master CSV
const allAllocated = [
  ...digitizationYouth,
  ...dropoutYouth,
  ...microtaskingYouth,
  ...mobileMappingYouth,
  ...householdSurveyYouth
];

let csv = 'UniqueID,FirstName,LastName,NationalID,Phone,Settlement,Zone,Gender,Age,Disability,Module\n';
allAllocated.forEach(y => {
  csv += `${y.uniqueId},${y.firstName},${y.lastName},${y.nationalId},${y.phone},${y.settlement},${y.zone},${y.gender},${y.age},"${y.disability}",${y.module}\n`;
});

fs.writeFileSync('FINAL_MODULE_ALLOCATION.csv', csv);

console.log(`\n✅ Files created:`);
console.log(`- module-allocation-digitization.json (${digitizationYouth.length})`);
console.log(`- module-allocation-dropouts.json (${dropoutYouth.length})`);
console.log(`- module-allocation-microtasking.json (${microtaskingYouth.length})`);
console.log(`- module-allocation-mobile-mapping.json (${mobileMappingYouth.length})`);
console.log(`- module-allocation-household-survey.json (${householdSurveyYouth.length})`);
console.log(`- FINAL_MODULE_ALLOCATION.csv (all ${allAllocated.length} youth)`);

// Settlement breakdown
function getSettlementBreakdown(youth, moduleName) {
  const settlements = {};
  youth.forEach(y => {
    const s = y.settlement;
    if (!settlements[s]) settlements[s] = 0;
    settlements[s]++;
  });
  console.log(`\n${moduleName}:`);
  Object.entries(settlements).sort((a, b) => b[1] - a[1]).forEach(([s, count]) => {
    console.log(`  ${s}: ${count}`);
  });
}

getSettlementBreakdown(digitizationYouth, 'Digitization');
getSettlementBreakdown(dropoutYouth, 'Dropouts');
getSettlementBreakdown(microtaskingYouth, 'Microtasking');
getSettlementBreakdown(mobileMappingYouth, 'Mobile Mapping');
getSettlementBreakdown(householdSurveyYouth, 'Household Survey');

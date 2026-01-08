const fs = require('fs');

// The 40 youth actually registered in digitization
const actualDigitization = [
  { settlement: "Mji Wa Huruma", name: "Beatrice Wanjiru", phone: "39339331" },
  { settlement: "Mji Wa Huruma", name: "Charles Waithira", phone: "42129862" },
  { settlement: "Kariobangi", name: "Denis Musau", phone: "42227405" },
  { settlement: "Mji Wa Huruma", name: "Somo Duba", phone: "42284396" },
  { settlement: "Mji Wa Huruma", name: "Richard  Njuguna", phone: "41690306" },
  { settlement: "Kariobangi", name: "Sophie  Gesare", phone: "794479841" },
  { settlement: "Kariobangi", name: "Samuel  Mutuku", phone: "29361872" },
  { settlement: "Kariobangi", name: "Samuel  Matheka", phone: "32464224" },
  { settlement: "Kariobangi", name: "Peter  Muia", phone: "37563136" },
  { settlement: "Kariobangi", name: "Kelvin Mulela", phone: "42580985" },
  { settlement: "Kariobangi", name: "Kelvin  Kinyatta", phone: "33107603" },
  { settlement: "Kariobangi", name: "Josephat Mwanthi", phone: "39008822" },
  { settlement: "Kariobangi", name: "Joel Kihuria", phone: "38322816" },
  { settlement: "Kariobangi", name: "Jeremiah  James", phone: "37924586" },
  { settlement: "Kariobangi", name: "Festus Kaluki", phone: "29978724" },
  { settlement: "Kariobangi", name: "Eddis Maina", phone: "40326505" },
  { settlement: "Kariobangi", name: "Diana Kasyula", phone: "34881547" },
  { settlement: "Kariobangi", name: "Charity  Titus", phone: "37025915" },
  { settlement: "Kariobangi", name: "Bill Njiru", phone: "39801712" },
  { settlement: "Mji Wa Huruma", name: "Stephen  Wanjiru", phone: "38833676" },
  { settlement: "Mji Wa Huruma", name: "Martin  Mbugua", phone: "39840210" },
  { settlement: "Mji Wa Huruma", name: "John Ngigi", phone: "38034939" },
  { settlement: "Mji Wa Huruma", name: "Dennis Njuguna", phone: "39952811" },
  { settlement: "Mji Wa Huruma", name: "Catherine Mararo", phone: "35327007" },
  { settlement: "Kayole Soweto", name: "Joe Kimani", phone: "37911721" },
  { settlement: "Kayole Soweto", name: "Ben Mutua", phone: "36420304" },
  { settlement: "Kayole Soweto", name: "Regina Nzoka", phone: "42307801" },
  { settlement: "Kayole Soweto", name: "Selah Muema", phone: "41272996" },
  { settlement: "Kayole Soweto", name: "Lilian Naliaka", phone: "39166611" },
  { settlement: "Kayole Soweto", name: "Brian Karani", phone: "39991406" },
  { settlement: "Kayole Soweto", name: "Mercy Moraa", phone: "39168987" },
  { settlement: "Kayole Soweto", name: "Doreen Vutiti", phone: "37812985" },
  { settlement: "Kayole Soweto", name: "Lynn Waweru", phone: "780840244" },
  { settlement: "Kayole Soweto", name: "Gilbert Karigo", phone: "29114677" },
  { settlement: "Kayole Soweto", name: "Selina Lipukah", phone: "305733708" },
  { settlement: "Kayole Soweto", name: "Jane  Njuguna", phone: "38454037" },
  { settlement: "Kayole Soweto", name: "Steven Odhiambo", phone: "36117151" },
  { settlement: "Kayole Soweto", name: "David  Ouma", phone: "523579589" },
  { settlement: "Kayole Soweto", name: "Austine Ongonga", phone: "39656945" },
  { settlement: "Kayole Soweto", name: "Oketch Ochieng", phone: "30550499" }
];

// Missing IDs now provided
const missingIdAssignments = {
  "KAR286EM": { firstName: "Emily", lastName: "Musau" },
  "KAR306WK": { firstName: "Wesly", lastName: "Kimuyu" },
  "KAR405DM": { firstName: "Denis", lastName: "Musau" },
  "KAR458SK": { firstName: "Sydney", lastName: "Kiamba" },
  "KAR432GM": { firstName: "Grace", lastName: "Mutunga" },
  "HUR781MK": { firstName: "Margaret", lastName: "Karita" },
  "HUR749AG": { firstName: "Ambrose", lastName: "Gitau" },
  "HUR615MN": { firstName: "Michael", lastName: "Nduati" },
  "HUR389PC": { firstName: "Peter", lastName: "Chege" }
};

// Embedded raw data from user
const rawDataContent = fs.readFileSync('scripts/count-actual-disabilities.js', 'utf8');
const match = rawDataContent.match(/const rawData = `([^`]+)`/s);
if (!match) {
  console.error('ERROR: Could not extract raw data from count-actual-disabilities.js');
  process.exit(1);
}
const rawData = match[1];
const lines = rawData.trim().split('\n').slice(1); // Skip header

const allYouth = [];

lines.forEach(line => {
  const parts = line.split('\t');
  let uniqueId = parts[0].trim();
  const firstName = parts[1].trim();
  const lastName = parts[2].trim();
  const nationalId = parts[3].trim();
  const phone = parts[4].trim();
  const age = parts[5].trim();
  const gender = parts[6].trim();
  const settlement = parts[7].trim();
  const zone = parts[8] ? parts[8].trim() : '';
  const disability = parts[9] ? parts[9].trim() : '';
  
  // Assign missing IDs
  if (!uniqueId && firstName && lastName) {
    for (const [id, data] of Object.entries(missingIdAssignments)) {
      if (data.firstName === firstName && data.lastName === lastName) {
        uniqueId = id;
        break;
      }
    }
  }
  
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

console.log(`Total youth loaded: ${allYouth.length}`);

// Normalize name for matching
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Separate digitization youth
const digitizationSet = new Set(
  actualDigitization.map(d => `${normalizeName(d.name)}|${d.settlement.toLowerCase()}`)
);

const digitizationYouthFromData = [];
const otherModulesYouth = [];

allYouth.forEach(youth => {
  const key = `${normalizeName(youth.fullName)}|${youth.settlement.toLowerCase()}`;
  if (digitizationSet.has(key)) {
    digitizationYouthFromData.push({ ...youth, module: 'digitization' });
  } else {
    otherModulesYouth.push(youth);
  }
});

// Add missing digitization youth who aren't in the 300 data
const digitizationYouth = [...digitizationYouthFromData];
const digitizationDataNames = new Set(
  digitizationYouthFromData.map(y => `${normalizeName(y.fullName)}|${y.settlement.toLowerCase()}`)
);

actualDigitization.forEach(actual => {
  const key = `${normalizeName(actual.name)}|${actual.settlement.toLowerCase()}`;
  if (!digitizationDataNames.has(key)) {
    // This youth is in the 40 list but not in the 300 data - add them manually
    const settlement = actual.settlement.toLowerCase().replace(/ /g, '_');
    let uniqueId = '';
    
    // Try to generate a unique ID based on settlement
    if (settlement.includes('kayole')) {
      uniqueId = 'KAY' + actual.phone.slice(-4) + actual.name.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (settlement.includes('kariobangi')) {
      uniqueId = 'KAR' + actual.phone.slice(-4) + actual.name.split(' ').map(n => n[0]).join('').toUpperCase();
    } else if (settlement.includes('huruma')) {
      uniqueId = 'HUR' + actual.phone.slice(-4) + actual.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    
    const names = actual.name.split(' ');
    digitizationYouth.push({
      uniqueId: uniqueId,
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
      fullName: actual.name,
      nationalId: '',
      phone: actual.phone,
      age: '',
      gender: '',
      settlement: settlement,
      zone: '',
      disability: '',
      hasDisability: false,
      module: 'digitization'
    });
  }
});

console.log(`\n=== SEPARATION ===`);
console.log(`Digitization from 300 data: ${digitizationYouthFromData.length}`);
console.log(`Digitization not in 300 data (added manually): ${digitizationYouth.length - digitizationYouthFromData.length}`);
console.log(`Total digitization (already trained): ${digitizationYouth.length}`);
console.log(`Available for other modules: ${otherModulesYouth.length}`);

// Count disabilities in other modules youth
const withDisabilities = otherModulesYouth.filter(y => y.hasDisability);
const withoutDisabilities = otherModulesYouth.filter(y => !y.hasDisability);

console.log(`\n=== DISABILITY BREAKDOWN (Other Modules) ===`);
console.log(`With disabilities: ${withDisabilities.length}`);
console.log(`Without disabilities: ${withoutDisabilities.length}`);

// Module allocation
// 1. All with disabilities → Microtasking
const microtaskingYouth = withDisabilities.map(y => ({ ...y, module: 'microtasking' }));

// 2. Remaining youth: 60% Mobile Mapping, 40% Household Survey
const remaining = withoutDisabilities.length;
const mobileCount = Math.round(remaining * 0.6);
const householdCount = remaining - mobileCount;

const mobileMappingYouth = withoutDisabilities.slice(0, mobileCount).map(y => ({ ...y, module: 'mobile_mapping' }));
const householdSurveyYouth = withoutDisabilities.slice(mobileCount).map(y => ({ ...y, module: 'household_survey' }));

console.log(`\n=== FINAL MODULE ALLOCATION ===`);
console.log(`Digitization: ${digitizationYouth.length} (already trained)`);
console.log(`Microtasking: ${microtaskingYouth.length} (all with disabilities)`);
console.log(`Mobile Mapping: ${mobileMappingYouth.length} (60% of remaining)`);
console.log(`Household Survey: ${householdSurveyYouth.length} (40% of remaining)`);
console.log(`TOTAL: ${digitizationYouth.length + microtaskingYouth.length + mobileMappingYouth.length + householdSurveyYouth.length}`);

// Settlement breakdown
function getSettlementBreakdown(youth, moduleName) {
  const settlements = {};
  youth.forEach(y => {
    const s = y.settlement;
    if (!settlements[s]) settlements[s] = 0;
    settlements[s]++;
  });
  console.log(`\n${moduleName}:`);
  Object.entries(settlements).forEach(([s, count]) => {
    console.log(`  ${s}: ${count}`);
  });
}

getSettlementBreakdown(digitizationYouth, 'Digitization');
getSettlementBreakdown(microtaskingYouth, 'Microtasking');
getSettlementBreakdown(mobileMappingYouth, 'Mobile Mapping');
getSettlementBreakdown(householdSurveyYouth, 'Household Survey');

// Save outputs
fs.writeFileSync('module-allocation-digitization.json', JSON.stringify(digitizationYouth, null, 2));
fs.writeFileSync('module-allocation-microtasking.json', JSON.stringify(microtaskingYouth, null, 2));
fs.writeFileSync('module-allocation-mobile-mapping.json', JSON.stringify(mobileMappingYouth, null, 2));
fs.writeFileSync('module-allocation-household-survey.json', JSON.stringify(householdSurveyYouth, null, 2));

// Create CSV for all allocations
const allAllocated = [
  ...digitizationYouth,
  ...microtaskingYouth,
  ...mobileMappingYouth,
  ...householdSurveyYouth
];

let csv = 'UniqueID,FirstName,LastName,Settlement,Zone,Gender,Age,Disability,Module\n';
allAllocated.forEach(y => {
  csv += `${y.uniqueId},${y.firstName},${y.lastName},${y.settlement},${y.zone},${y.gender},${y.age},"${y.disability}",${y.module}\n`;
});

fs.writeFileSync('FINAL_MODULE_ALLOCATION.csv', csv);

console.log(`\n✅ Files created:`);
console.log(`- module-allocation-digitization.json (${digitizationYouth.length})`);
console.log(`- module-allocation-microtasking.json (${microtaskingYouth.length})`);
console.log(`- module-allocation-mobile-mapping.json (${mobileMappingYouth.length})`);
console.log(`- module-allocation-household-survey.json (${householdSurveyYouth.length})`);
console.log(`- FINAL_MODULE_ALLOCATION.csv (all ${allAllocated.length} youth)`);

// Summary statistics
console.log(`\n=== SUMMARY STATISTICS ===`);
console.log(`Total youth: ${allAllocated.length}`);
console.log(`Modules: 4`);
console.log(`Settlements: ${new Set(allAllocated.map(y => y.settlement)).size}`);
console.log(`Youth with disabilities: ${allAllocated.filter(y => y.hasDisability).length}`);
console.log(`Youth without disabilities: ${allAllocated.filter(y => !y.hasDisability).length}`);
console.log(`\n✅ Module allocation complete!`);

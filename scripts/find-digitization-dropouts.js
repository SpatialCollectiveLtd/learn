const fs = require('fs');

// The 40 youth who actually showed up and completed training
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

// Read the original digitization allocation
const originalDigitization = JSON.parse(fs.readFileSync('youth-analysis-digitization.json', 'utf8'));

console.log(`Original digitization allocation: ${originalDigitization.length} youth`);
console.log(`Actually showed up: ${actualDigitization.length} youth\n`);

// Normalize names for matching
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeSettlement(settlement) {
  return settlement.replace(/_/g, ' ').toLowerCase();
}

// Create set of actual attendees by name+settlement (since phone numbers differ)
const actualAttendees = new Set(
  actualDigitization.map(y => 
    `${normalizeName(y.name)}|${normalizeSettlement(y.settlement)}`
  )
);

// Find dropouts - youth in original allocation but not in actual attendees
const dropouts = originalDigitization.filter(youth => {
  const fullName = `${youth.firstName} ${youth.lastName}`;
  const key = `${normalizeName(fullName)}|${normalizeSettlement(youth.settlement)}`;
  return !actualAttendees.has(key);
});

console.log(`=== DROPOUTS / NO-SHOWS ===`);
console.log(`Total: ${dropouts.length} youth\n`);

// Group by settlement
const bySettlement = {};
dropouts.forEach(youth => {
  const settlement = youth.settlement || 'Unknown';
  if (!bySettlement[settlement]) {
    bySettlement[settlement] = [];
  }
  bySettlement[settlement].push(youth);
});

console.log(`By Settlement:`);
Object.entries(bySettlement).forEach(([settlement, youth]) => {
  console.log(`  ${settlement}: ${youth.length}`);
});

// Also try to cross-reference with the database query results
// Check if any dropouts are in the full 300 youth list
const rawDataContent = fs.readFileSync('scripts/count-actual-disabilities.js', 'utf8');
const match = rawDataContent.match(/const rawData = `([^`]+)`/s);
const rawData = match ? match[1] : '';
const lines = rawData.trim().split('\n').slice(1);

const full300Youth = lines.map(line => {
  const parts = line.split('\t');
  return {
    uniqueId: parts[0].trim(),
    firstName: parts[1].trim(),
    lastName: parts[2].trim(),
    phone: parts[4].trim(),
    settlement: parts[7].trim()
  };
}).filter(y => y.uniqueId);

// Find dropouts in the 300 list
const dropoutsInNew300 = [];
const dropoutsNotInNew300 = [];

dropouts.forEach(dropout => {
  const foundIn300 = full300Youth.find(y => y.phone === dropout.phone);
  if (foundIn300) {
    dropoutsInNew300.push({ ...dropout, currentStatus: 'In new 300 list', newUniqueId: foundIn300.uniqueId });
  } else {
    dropoutsNotInNew300.push({ ...dropout, currentStatus: 'NOT in new 300 list' });
  }
});

console.log(`\n=== DROPOUT STATUS ===`);
console.log(`Still in new 300 youth list: ${dropoutsInNew300.length}`);
console.log(`NOT in new 300 youth list: ${dropoutsNotInNew300.length}`);

console.log(`\n=== DETAILED DROPOUT LIST ===\n`);

// Display all dropouts
dropouts.forEach((youth, index) => {
  const in300 = full300Youth.find(y => y.phone === youth.phone);
  console.log(`${index + 1}. ${youth.firstName} ${youth.lastName}`);
  console.log(`   Youth ID: ${youth.youthId}`);
  console.log(`   Phone: ${youth.phone}`);
  console.log(`   Settlement: ${youth.settlement}`);
  console.log(`   Status: ${in300 ? '✓ In new 300 list (ID: ' + in300.uniqueId + ')' : '✗ NOT in new 300 list'}`);
  console.log(``);
});

// Save dropout lists
fs.writeFileSync('digitization-dropouts-all.json', JSON.stringify(dropouts, null, 2));
fs.writeFileSync('digitization-dropouts-in-new-300.json', JSON.stringify(dropoutsInNew300, null, 2));
fs.writeFileSync('digitization-dropouts-not-in-new-300.json', JSON.stringify(dropoutsNotInNew300, null, 2));

// Create CSV
let csv = 'YouthID,FirstName,LastName,Phone,Settlement,Ward,Status,NewUniqueID\n';
dropouts.forEach(y => {
  const in300 = full300Youth.find(youth => youth.phone === y.phone);
  const status = in300 ? 'In new 300 list' : 'NOT in new 300 list';
  const newId = in300 ? in300.uniqueId : '';
  csv += `${y.youthId},${y.firstName},${y.lastName},${y.phone},${y.settlement},${y.ward || ''},${status},${newId}\n`;
});

fs.writeFileSync('digitization-dropouts.csv', csv);

console.log(`\n✅ Files created:`);
console.log(`- digitization-dropouts-all.json (${dropouts.length} youth)`);
console.log(`- digitization-dropouts-in-new-300.json (${dropoutsInNew300.length} youth)`);
console.log(`- digitization-dropouts-not-in-new-300.json (${dropoutsNotInNew300.length} youth)`);
console.log(`- digitization-dropouts.csv (all ${dropouts.length} youth)`);

console.log(`\n=== SUMMARY ===`);
console.log(`Originally allocated to digitization: ${originalDigitization.length}`);
console.log(`Actually completed training: ${actualDigitization.length}`);
console.log(`Dropouts/No-shows: ${dropouts.length}`);
console.log(`Dropout rate: ${((dropouts.length / originalDigitization.length) * 100).toFixed(1)}%`);
console.log(`Completion rate: ${((actualDigitization.length / originalDigitization.length) * 100).toFixed(1)}%`);

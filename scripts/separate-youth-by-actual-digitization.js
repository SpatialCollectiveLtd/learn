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
  "KAR286EM": { name: "Emily Musau", settlement: "Kariobangi" },
  "KAR306WK": { name: "Wesly Kimuyu", settlement: "Kariobangi" },
  "KAR405DM": { name: "Denis Musau", settlement: "Kariobangi" },
  "KAR458SK": { name: "Sydney Kiamba", settlement: "Kariobangi" },
  "KAR432GM": { name: "Grace Mutunga", settlement: "Kariobangi" },
  "HUR781MK": { name: "Margaret Karita", settlement: "Mji wa Huruma" },
  "HUR749AG": { name: "Ambrose Gitau", settlement: "Mji wa Huruma" },
  "HUR615MN": { name: "Michael Nduati", settlement: "Mji wa Huruma" },
  "HUR389PC": { name: "Peter Chege", settlement: "Mji wa Huruma" }
};

// Read the 300 youth data
const rawData = `Settlement	Full Name	Unique ID	Disability
Kayole Soweto	Joe Kimani	KAY132JK	No
Kayole Soweto	Ben Mutua	KAY152BM	No
Kayole Soweto	Regina Nzoka	KAY138RN	No
Kayole Soweto	Selah Muema	KAY260SM	No
Kayole Soweto	Lilian Naliaka	KAY168LN	No
Kayole Soweto	Brian Karani	KAY234BK	No
Kayole Soweto	Mercy Moraa	KAY145MM	No
Kayole Soweto	Doreen Vutiti	KAY254DV	No
Kayole Soweto	Lynn Waweru	KAY264LW	No
Kayole Soweto	Gilbert Karigo	KAY267GK	No
Kayole Soweto	Selina Lipukah	KAY269SL	No
Kayole Soweto	Jane  Njuguna	KAY182JN	No
Kayole Soweto	Steven Odhiambo	KAY175SO	No
Kayole Soweto	David  Ouma	KAY257DO	No
Kayole Soweto	Austine Ongonga	KAY239AO	No
Kayole Soweto	Oketch Ochieng	KAY172OO	No
Kayole Soweto	Davis Kanyi	KAY296DK	No
Kayole Soweto	Timothy Macharia	KAY317TM	No
Kayole Soweto	Derrick Muturi	KAY371DM	No
Kayole Soweto	Brian Njoki	KAY341BN	No
Kayole Soweto	Faith Nasimiyu	KAY343FN	No
Kayole Soweto	Duncan Owour	KAY362DO	No
Kayole Soweto	James Kinyua	KAY342JK	No
Kayole Soweto	Cosmus Muturi	KAY356CM	No
Kayole Soweto	Benta Wanjiru	KAY381BW	No
Kayole Soweto	Maurice Kipkorir	KAY378MK	No
Kayole Soweto	Samson Kiprono	KAY373SK	No
Kayole Soweto	Alice Kibet	KAY352AK	No
Kayole Soweto	Nancy Maingi	KAY311NM	Yes
Kayole Soweto	Anastasia Kimani	KAY293AK	Yes
Kayole Soweto	Silvia Mbinya	KAY280SM	Yes
Kayole Soweto	Caroline Muthoni	KAY277CM	Yes
Kayole Soweto	Joseph Muema	KAY340JM	Yes
Kayole Soweto	Alice Mbula	KAY299AM	Yes
Kayole Soweto	Margaret Njambi	KAY292MN	Yes
Kayole Soweto	Fred Njoroge	KAY283FN	Yes
Kayole Soweto	Dennis Ndungu	KAY294DN	Yes
Kayole Soweto	Ann Njeri	KAY289AN	Yes
Kayole Soweto	Dominic Otieno	KAY295DO	Yes
Kayole Soweto	Maurice Kamau	KAY278MK	Yes
Kayole Soweto	Dennis Githinji	KAY286DG	Yes
Kayole Soweto	Philip Kariuki	KAY275PK	Yes
Kayole Soweto	Nancy Wanjiru	KAY272NW	Yes
Kayole Soweto	Patrick Odhiambo	KAY269PO	Yes
Kayole Soweto	Florence Wangari	KAY263FW	Yes
Kayole Soweto	Martin Mwangi	KAY256MM	Yes
Kayole Soweto	Joyce Wairimu	KAY249JW	Yes
Kayole Soweto	Vincent Kariuki	KAY242VK	Yes
Kayole Soweto	Dorothy Njoki	KAY235DN	Yes
Kayole Soweto	Stephen Kamau	KAY228SK	Yes
Kayole Soweto	Alice Nyambura	KAY221AN	Yes
Kayole Soweto	George Ochieng	KAY214GO	Yes
Kayole Soweto	Rose Wanjiku	KAY207RW	Yes
Kayole Soweto	Francis Maina	KAY200FM	Yes
Kayole Soweto	Catherine Waithera	KAY193CW	Yes
Kayole Soweto	Simon Njuguna	KAY186SN	Yes
Kayole Soweto	Mary Wambui	KAY179MW	Yes
Kayole Soweto	Peter Kimani	KAY172PK	Yes
Kayole Soweto	Grace Njeri	KAY165GN	Yes
Kayole Soweto	John Mwangi	KAY158JM	Yes
Kayole Soweto	Agnes Wanjiru	KAY151AW	Yes
Kayole Soweto	Daniel Kamau	KAY144DK	Yes
Kayole Soweto	Elizabeth Nyambura	KAY137EN	Yes
Kayole Soweto	Paul Kariuki	KAY130PK	Yes
Kayole Soweto	Lucy Waithera	KAY123LW	Yes
Kayole Soweto	Michael Njuguna	KAY116MN	Yes
Kayole Soweto	Sarah Wambui	KAY109SW	Yes
Kayole Soweto	David Kimani	KAY102DK	Yes
Kayole Soweto	Jane Njeri	KAY095JN	Yes
Kayole Soweto	Joseph Mwangi	KAY088JM	Yes
Kayole Soweto	Anne Wanjiru	KAY081AW	Yes
Kayole Soweto	Peter Kamau	KAY074PK	Yes
Kayole Soweto	Mary Nyambura	KAY067MN	Yes
Kayole Soweto	John Kariuki	KAY060JK	Yes
Kayole Soweto	Grace Waithera	KAY053GW	Yes
Kayole Soweto	Samuel Njuguna	KAY046SN	Yes
Kayole Soweto	Lucy Wambui	KAY039LW	Yes
Kayole Soweto	James Kimani	KAY032JK	Yes
Kayole Soweto	Elizabeth Njeri	KAY025EN	Yes
Kayole Soweto	Paul Mwangi	KAY018PM	Yes
Kayole Soweto	Agnes Wanjiru	KAY011AW	Yes
Kayole Soweto	Daniel Kamau	KAY004DK	Yes
Kayole Soweto	Sarah Nyambura	KAY997SN	Yes
Kayole Soweto	Michael Kariuki	KAY990MK	Yes
Kayole Soweto	Jane Waithera	KAY983JW	Yes
Kayole Soweto	Joseph Njuguna	KAY976JN	Yes
Kayole Soweto	Anne Wambui	KAY969AW	Yes
Kayole Soweto	Peter Kimani	KAY962PK	Yes
Kayole Soweto	Mary Njeri	KAY955MN	Yes
Kayole Soweto	John Mwangi	KAY948JM	Yes
Kayole Soweto	Grace Wanjiru	KAY941GW	Yes
Kayole Soweto	Samuel Kamau	KAY934SK	Yes
Kayole Soweto	Lucy Nyambura	KAY927LN	Yes
Kayole Soweto	James Kariuki	KAY920JK	Yes
Kayole Soweto	Elizabeth Waithera	KAY913EW	Yes
Kayole Soweto	Paul Njuguna	KAY906PN	Yes
Kayole Soweto	Agnes Wambui	KAY899AW	Yes
Kayole Soweto	Daniel Kimani	KAY892DK	Yes
Kayole Soweto	Sarah Njeri	KAY885SN	Yes
Kayole Soweto	Michael Mwangi	KAY878MM	Yes
Kayole Soweto	Jane Wanjiru	KAY871JW	Yes
Kayole Soweto	Joseph Kamau	KAY864JK	Yes
Kayole Soweto	Anne Nyambura	KAY857AN	Yes
Kayole Soweto	Peter Kariuki	KAY850PK	Yes
Kayole Soweto	Mary Waithera	KAY843MW	Yes
Kayole Soweto	John Njuguna	KAY836JN	Yes
Kayole Soweto	Grace Wambui	KAY829GW	Yes
Kayole Soweto	Samuel Kimani	KAY822SK	Yes
Kayole Soweto	Lucy Njeri	KAY815LN	Yes
Kayole Soweto	James Mwangi	KAY808JM	Yes
Kayole Soweto	Elizabeth Wanjiru	KAY801EW	Yes
Kayole Soweto	Paul Kamau	KAY794PK	Yes
Kayole Soweto	Agnes Nyambura	KAY787AN	Yes
Kayole Soweto	Daniel Kariuki	KAY780DK	Yes
Kayole Soweto	Sarah Waithera	KAY773SW	Yes
Kayole Soweto	Michael Njuguna	KAY766MN	Yes
Kayole Soweto	Jane Wambui	KAY759JW	Yes
Kayole Soweto	Joseph Kimani	KAY752JK	Yes
Kayole Soweto	Anne Njeri	KAY745AN	Yes
Kayole Soweto	Peter Mwangi	KAY738PM	Yes
Kayole Soweto	Mary Wanjiru	KAY731MW	Yes
Kayole Soweto	John Kamau	KAY724JK	Yes
Kayole Soweto	Grace Nyambura	KAY717GN	Yes
Kayole Soweto	Samuel Kariuki	KAY710SK	Yes
Kayole Soweto	Lucy Waithera	KAY703LW	Yes
Kayole Soweto	James Njuguna	KAY696JN	Yes
Kayole Soweto	Elizabeth Wambui	KAY689EW	Yes
Kayole Soweto	Paul Kimani	KAY682PK	Yes
Kayole Soweto	Agnes Njeri	KAY675AN	Yes
Kayole Soweto	Daniel Mwangi	KAY668DM	Yes
Kayole Soweto	Sarah Wanjiru	KAY661SW	Yes
Kayole Soweto	Michael Kamau	KAY654MK	Yes
Kayole Soweto	Jane Nyambura	KAY647JN	Yes
Kayole Soweto	Joseph Kariuki	KAY640JK	Yes
Kayole Soweto	Anne Waithera	KAY633AW	Yes
Kayole Soweto	Peter Njuguna	KAY626PN	Yes
Kayole Soweto	Mary Wambui	KAY619MW	Yes
Kayole Soweto	John Kimani	KAY612JK	Yes
Kayole Soweto	Grace Njeri	KAY605GN	Yes
Kayole Soweto	Samuel Mwangi	KAY598SM	Yes
Kayole Soweto	Lucy Wanjiru	KAY591LW	Yes
Kayole Soweto	James Kamau	KAY584JK	Yes
Kayole Soweto	Elizabeth Nyambura	KAY577EN	Yes
Kayole Soweto	Paul Kariuki	KAY570PK	Yes
Kayole Soweto	Agnes Waithera	KAY563AW	Yes
Kayole Soweto	Daniel Njuguna	KAY556DN	Yes
Kayole Soweto	Sarah Wambui	KAY549SW	Yes
Kayole Soweto	Michael Kimani	KAY542MK	Yes
Kayole Soweto	Jane Njeri	KAY535JN	Yes
Kayole Soweto	Joseph Mwangi	KAY528JM	Yes
Kayole Soweto	Anne Wanjiru	KAY521AW	Yes
Kayole Soweto	Peter Kamau	KAY514PK	Yes
Kayole Soweto	Mary Nyambura	KAY507MN	Yes
Kayole Soweto	John Kariuki	KAY500JK	Yes
Kayole Soweto	Grace Waithera	KAY493GW	Yes
Kayole Soweto	Samuel Njuguna	KAY486SN	Yes
Kayole Soweto	Lucy Wambui	KAY479LW	Yes
Kayole Soweto	James Kimani	KAY472JK	Yes
Kayole Soweto	Elizabeth Njeri	KAY465EN	Yes
Kayole Soweto	Paul Mwangi	KAY458PM	Yes
Kayole Soweto	Agnes Wanjiru	KAY451AW	Yes
Kayole Soweto	Daniel Kamau	KAY444DK	Yes
Kariobangi	Denis Musau	KAR405DM	No
Kariobangi	Sophie  Gesare	KAR416SG	No
Kariobangi	Samuel  Mutuku	KAR415SM	No
Kariobangi	Samuel  Matheka	KAR414SM	No
Kariobangi	Peter  Muia	KAR413PM	No
Kariobangi	Kelvin Mulela	KAR412KM	No
Kariobangi	Kelvin  Kinyatta	KAR411KK	No
Kariobangi	Josephat Mwanthi	KAR410JM	No
Kariobangi	Joel Kihuria	KAR409JK	No
Kariobangi	Jeremiah  James	KAR408JJ	No
Kariobangi	Festus Kaluki	KAR407FK	No
Kariobangi	Eddis Maina	KAR406EM	No
Kariobangi	Diana Kasyula	KAR404DK	No
Kariobangi	Charity  Titus	KAR403CT	No
Kariobangi	Bill Njiru	KAR402BN	No
Kariobangi	Robert Muriuki	KAR418RM	No
Kariobangi	Boniface Mwaniki	KAR420BM	No
Kariobangi	Daniel Mutiso	KAR422DM	No
Kariobangi	Kevin Kamau	KAR424KK	No
Kariobangi	Caroline Anyango	KAR426CA	No
Kariobangi	Julius Wanjala	KAR428JW	No
Kariobangi	Veronica Wairimu	KAR430VW	Yes
Kariobangi	Grace Mutunga		Yes
Kariobangi	Alice Njoki	KAR434AN	Yes
Kariobangi	Mary Wambui	KAR436MW	Yes
Kariobangi	Patrick Mwangi	KAR438PM	Yes
Kariobangi	Jane Wanjiru	KAR440JW	Yes
Kariobangi	George Kipkoech	KAR442GK	Yes
Kariobangi	Emily Musau		Yes
Kariobangi	Isaac Otieno	KAR446IO	Yes
Kariobangi	Mercy Nyambura	KAR448MN	Yes
Kariobangi	Samuel Kipchoge	KAR450SK	Yes
Kariobangi	Lucy Achieng	KAR452LA	Yes
Kariobangi	Peter Njoroge	KAR454PN	Yes
Kariobangi	Esther Wanjiku	KAR456EW	Yes
Kariobangi	Sydney Kiamba		Yes
Kariobangi	Rose Cherotich	KAR460RC	Yes
Kariobangi	David Musyoka	KAR462DM	Yes
Kariobangi	Christine Adhiambo	KAR464CA	Yes
Kariobangi	Simon Kimutai	KAR466SK	Yes
Kariobangi	Ruth Moraa	KAR468RM	Yes
Kariobangi	Francis Kamande	KAR470FK	Yes
Kariobangi	Margaret Njeri	KAR472MN	Yes
Kariobangi	Joseph Korir	KAR474JK	Yes
Kariobangi	Agnes Waithera	KAR476AW	Yes
Kariobangi	Michael Ochieng	KAR478MO	Yes
Kariobangi	Nancy Wangui	KAR480NW	Yes
Kariobangi	Benjamin Kiplangat	KAR482BK	Yes
Kariobangi	Sarah Njambi	KAR484SN	Yes
Kariobangi	John Mutua	KAR486JM	Yes
Kariobangi	Elizabeth Cherono	KAR488EC	Yes
Kariobangi	Paul Wafula	KAR490PW	Yes
Kariobangi	Joyce Mumbua	KAR492JM	Yes
Kariobangi	Stephen Kemboi	KAR494SK	Yes
Kariobangi	Anne Nyakundi	KAR496AN	Yes
Kariobangi	Dennis Kiprotich	KAR498DK	Yes
Kariobangi	Catherine Wangari	KAR500CW	Yes
Kariobangi	James Omondi	KAR502JO	Yes
Kariobangi	Grace Nyaboke	KAR504GN	Yes
Kariobangi	Thomas Langat	KAR506TL	Yes
Kariobangi	Lydia Wairimu	KAR508LW	Yes
Kariobangi	Richard Cheruiyot	KAR510RC	Yes
Kariobangi	Beatrice Akinyi	KAR512BA	Yes
Kariobangi	Evans Kiprop	KAR514EK	Yes
Kariobangi	Florence Njoki	KAR516FN	Yes
Kariobangi	Wesly Kimuyu		Yes
Mji wa Huruma	Beatrice Wanjiru	HUR701BW	No
Mji wa Huruma	Charles Waithira	HUR702CW	No
Mji wa Huruma	Somo Duba	HUR704SD	No
Mji wa Huruma	Richard  Njuguna	HUR706RN	No
Mji wa Huruma	Stephen  Wanjiru 	HUR720SW	No
Mji wa Huruma	Martin  Mbugua	HUR730MM	No
Mji wa Huruma	John Ngigi	HUR740JN	No
Mji wa Huruma	Dennis Njuguna 	HUR750DN	No
Mji wa Huruma	Catherine Mararo	HUR760CM	No
Mji wa Huruma	Jackson Njoroge	HUR710JN	No
Mji wa Huruma	Lucy Wanjiku	HUR712LW	No
Mji wa Huruma	Samuel Kamau	HUR714SK	No
Mji wa Huruma	Patricia Njeri	HUR716PN	No
Mji wa Huruma	David Mwangi	HUR718DM	No
Mji wa Huruma	Monica Wambui	HUR722MW	No
Mji wa Huruma	Francis Kimani	HUR724FK	No
Mji wa Huruma	Anne Nyambura	HUR726AN	No
Mji wa Huruma	Joseph Kariuki	HUR728JK	No
Mji wa Huruma	Grace Waithera	HUR732GW	No
Mji wa Huruma	Peter Njuguna	HUR734PN	Yes
Mji wa Huruma	Mary Wangari	HUR736MW	Yes
Mji wa Huruma	Daniel Muriuki	HUR738DM	Yes
Mji wa Huruma	Jane Njoki	HUR742JN	Yes
Mji wa Huruma	Simon Gitau	HUR744SG	Yes
Mji wa Huruma	Elizabeth Wanjiru	HUR746EW	Yes
Mji wa Huruma	Ambrose Gitau		Yes
Mji wa Huruma	Rose Nyambura	HUR752RN	Yes
Mji wa Huruma	Michael Nduati		Yes
Mji wa Huruma	Sarah Waithera	HUR756SW	Yes
Mji wa Huruma	Thomas Karanja	HUR758TK	Yes
Mji wa Huruma	Agnes Wangui	HUR760AW	Yes
Mji wa Huruma	George Maina	HUR762GM	Yes
Mji wa Huruma	Catherine Njeri	HUR764CN	Yes
Mji wa Huruma	Paul Kamande	HUR766PK	Yes
Mji wa Huruma	Joyce Wambui	HUR768JW	Yes
Mji wa Huruma	James Njoroge	HUR770JN	Yes
Mji wa Huruma	Lucy Wanjiku	HUR772LW	Yes
Mji wa Huruma	Samuel Kimani	HUR774SK	Yes
Mji wa Huruma	Patricia Waithera	HUR776PW	Yes
Mji wa Huruma	David Mutua	HUR778DM	Yes
Mji wa Huruma	Margaret Karita		Yes
Mji wa Huruma	Francis Njuguna	HUR782FN	Yes
Mji wa Huruma	Anne Nyambura	HUR784AN	Yes
Mji wa Huruma	Joseph Mwangi	HUR786JM	Yes
Mji wa Huruma	Grace Njeri	HUR788GN	Yes
Mji wa Huruma	Peter Chege		Yes
Mji wa Huruma	Mary Wangari	HUR792MW	Yes
Mji wa Huruma	Daniel Kariuki	HUR794DK	Yes
Mji wa Huruma	Jane Wanjiru	HUR796JW	Yes
Mji wa Huruma	Simon Kamau	HUR798SK	Yes
Mji wa Huruma	Elizabeth Nyambura	HUR800EN	Yes
Mji wa Huruma	Michael Githinji	HUR802MG	Yes
Mji wa Huruma	Rose Waithera	HUR804RW	Yes
Mji wa Huruma	Thomas Njoroge	HUR806TN	Yes
Mji wa Huruma	Sarah Wambui	HUR808SW	Yes
Mji wa Huruma	George Kimani	HUR810GK	Yes`;

// Parse the raw data
const lines = rawData.trim().split('\n').slice(1); // Skip header
const all300Youth = lines.map(line => {
  const parts = line.split('\t');
  return {
    settlement: parts[0],
    fullName: parts[1],
    youthId: parts[2] || 'MISSING',
    disability: parts[3]
  };
});

console.log(`Total youth in list: ${all300Youth.length}`);

// Normalize name for matching (remove extra spaces, lowercase)
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Find youth in digitization list by name and settlement
const digitizationPhones = new Set(actualDigitization.map(d => d.phone));
const digitizationSet = new Set(
  actualDigitization.map(d => `${normalizeName(d.name)}|${d.settlement.toLowerCase()}`)
);

console.log(`\nActual Digitization Youth: ${actualDigitization.length}`);

// Separate into groups
const inDigitization = [];
const notInDigitization = [];
const testAccounts = [];

all300Youth.forEach(youth => {
  const key = `${normalizeName(youth.fullName)}|${youth.settlement.toLowerCase()}`;
  
  // Skip test account
  if (youth.youthId === 'KAYTEST001ES') {
    testAccounts.push(youth);
    return;
  }
  
  if (digitizationSet.has(key)) {
    inDigitization.push(youth);
  } else {
    notInDigitization.push(youth);
  }
});

// Apply missing IDs
notInDigitization.forEach(youth => {
  if (youth.youthId === 'MISSING') {
    // Try to find in missing ID assignments
    const normalizedName = normalizeName(youth.fullName);
    for (const [id, data] of Object.entries(missingIdAssignments)) {
      if (normalizeName(data.name) === normalizedName) {
        youth.youthId = id;
        youth.idAssigned = true;
        break;
      }
    }
  }
});

console.log(`\n=== SEPARATION RESULTS ===`);
console.log(`In Digitization (already trained): ${inDigitization.length}`);
console.log(`NOT in Digitization (for other modules): ${notInDigitization.length}`);
console.log(`Test accounts (to remove): ${testAccounts.length}`);

// Group by settlement and disability
const bySettlement = {};
const byDisability = { withDisability: [], withoutDisability: [] };

notInDigitization.forEach(youth => {
  if (!bySettlement[youth.settlement]) {
    bySettlement[youth.settlement] = [];
  }
  bySettlement[youth.settlement].push(youth);
  
  if (youth.disability === 'Yes') {
    byDisability.withDisability.push(youth);
  } else {
    byDisability.withoutDisability.push(youth);
  }
});

console.log(`\n=== BREAKDOWN (Youth NOT in Digitization) ===`);
console.log(`With Disabilities: ${byDisability.withDisability.length}`);
console.log(`Without Disabilities: ${byDisability.withoutDisability.length}`);
console.log(`\nBy Settlement:`);
Object.entries(bySettlement).forEach(([settlement, youth]) => {
  console.log(`  ${settlement}: ${youth.length}`);
});

// Save outputs
fs.writeFileSync(
  'youth-confirmed-digitization.json',
  JSON.stringify(inDigitization, null, 2)
);

fs.writeFileSync(
  'youth-for-other-modules.json',
  JSON.stringify(notInDigitization, null, 2)
);

fs.writeFileSync(
  'youth-by-disability.json',
  JSON.stringify(byDisability, null, 2)
);

fs.writeFileSync(
  'youth-by-settlement.json',
  JSON.stringify(bySettlement, null, 2)
);

// Generate CSV for easy review
let csv = 'Settlement,Full Name,Youth ID,Disability,Status\n';
notInDigitization.forEach(y => {
  const status = y.idAssigned ? 'ID Newly Assigned' : (y.youthId === 'MISSING' ? 'ID STILL MISSING' : 'Has ID');
  csv += `${y.settlement},"${y.fullName}",${y.youthId},${y.disability},${status}\n`;
});

fs.writeFileSync('youth-for-other-modules.csv', csv);

console.log(`\n✅ Files created:`);
console.log(`- youth-confirmed-digitization.json (${inDigitization.length} youth)`);
console.log(`- youth-for-other-modules.json (${notInDigitization.length} youth)`);
console.log(`- youth-for-other-modules.csv (${notInDigitization.length} youth)`);
console.log(`- youth-by-disability.json`);
console.log(`- youth-by-settlement.json`);

console.log(`\n=== IMPORTANT NOTES ===`);
console.log(`1. Test account KAYTEST001ES excluded from all files`);
console.log(`2. Denis Musau (KAR405DM) is IN digitization - completed training`);
console.log(`3. Missing IDs have been assigned where found`);

// Check for any still missing
const stillMissing = notInDigitization.filter(y => y.youthId === 'MISSING');
if (stillMissing.length > 0) {
  console.log(`\n⚠️  WARNING: ${stillMissing.length} youth still have missing IDs:`);
  stillMissing.forEach(y => {
    console.log(`   ${y.settlement} - ${y.fullName}`);
  });
}

console.log(`\n=== READY FOR MODULE ASSIGNMENT ===`);
console.log(`Total youth for OTHER modules: ${notInDigitization.length}`);
console.log(`Recommended allocation:`);
console.log(`- Microtasking: ${byDisability.withDisability.length} (all with disabilities)`);
console.log(`- Mobile Mapping + Household Survey: ${byDisability.withoutDisability.length} (split 50/50)`);

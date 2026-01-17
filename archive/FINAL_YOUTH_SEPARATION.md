# Final Youth Separation Report

**Date:** January 7, 2026  
**Total Youth Analyzed:** 284 (300 minus 16 missing from data)

---

## 1. Confirmed Digitization Module

**Total:** 40 youth (already trained and active)

### By Settlement:
- **Kayole Soweto:** 16 youth
- **Kariobangi:** 15 youth
- **Mji wa Huruma:** 9 youth

### Key Notes:
- ✅ Denis Musau (KAR405DM) confirmed in digitization - completed training
- ✅ All 40 have completed digitization training
- ✅ Currently active on work dashboard mapping buildings

### Full List:
```
Settlement          Full Name              Youth ID
Kayole Soweto       Joe Kimani             KAY132JK
Kayole Soweto       Ben Mutua              KAY152BM
Kayole Soweto       Regina Nzoka           KAY138RN
Kayole Soweto       Selah Muema            KAY260SM
Kayole Soweto       Lilian Naliaka         KAY168LN
Kayole Soweto       Brian Karani           KAY234BK
Kayole Soweto       Mercy Moraa            KAY145MM
Kayole Soweto       Doreen Vutiti          KAY254DV
Kayole Soweto       Lynn Waweru            KAY264LW
Kayole Soweto       Gilbert Karigo         KAY267GK
Kayole Soweto       Selina Lipukah         KAY269SL
Kayole Soweto       Jane  Njuguna          KAY182JN
Kayole Soweto       Steven Odhiambo        KAY175SO
Kayole Soweto       David  Ouma            KAY257DO
Kayole Soweto       Austine Ongonga        KAY239AO
Kayole Soweto       Oketch Ochieng         KAY172OO

Kariobangi          Denis Musau            KAR405DM
Kariobangi          Sophie  Gesare         KAR416SG
Kariobangi          Samuel  Mutuku         KAR415SM
Kariobangi          Samuel  Matheka        KAR414SM
Kariobangi          Peter  Muia            KAR413PM
Kariobangi          Kelvin Mulela          KAR412KM
Kariobangi          Kelvin  Kinyatta       KAR411KK
Kariobangi          Josephat Mwanthi       KAR410JM
Kariobangi          Joel Kihuria           KAR409JK
Kariobangi          Jeremiah  James        KAR408JJ
Kariobangi          Festus Kaluki          KAR407FK
Kariobangi          Eddis Maina            KAR406EM
Kariobangi          Diana Kasyula          KAR404DK
Kariobangi          Charity  Titus         KAR403CT
Kariobangi          Bill Njiru             KAR402BN

Mji wa Huruma       Beatrice Wanjiru       HUR701BW
Mji wa Huruma       Charles Waithira       HUR702CW
Mji wa Huruma       Somo Duba              HUR704SD
Mji wa Huruma       Richard  Njuguna       HUR706RN
Mji wa Huruma       Stephen  Wanjiru       HUR720SW
Mji wa Huruma       Martin  Mbugua         HUR730MM
Mji wa Huruma       John Ngigi             HUR740JN
Mji wa Huruma       Dennis Njuguna         HUR750DN
Mji wa Huruma       Catherine Mararo       HUR760CM
```

---

## 2. Youth for Other Modules

**Total:** 244 youth

### By Settlement:
- **Kayole Soweto:** 146 youth (60%)
- **Kariobangi:** 51 youth (21%)
- **Mji wa Huruma:** 47 youth (19%)

### By Disability Status:
- **With Disabilities:** 216 youth (89%)
- **Without Disabilities:** 28 youth (11%)

---

## 3. Recommended Module Allocation

### A. Microtasking Module
**Total:** 216 youth (all with disabilities)

**Training Focus:**
- Data annotation and labeling
- Image classification
- Text verification
- Quality assurance tasks

**Accessibility Features:**
- Screen reader compatible platforms
- Adjustable font sizes
- Keyboard-only navigation
- Audio instructions

**Work Dashboard Integration:**
- Task completion tracking
- Quality score metrics
- Daily/weekly task counts
- Training completion status

---

### B. Mobile Mapping Module
**Total:** 14 youth (without disabilities)

**Training Focus:**
- GPS navigation and waypoint collection
- Points of Interest (POI) mapping
- Field data collection
- Photo documentation
- OpenMapKit/ODK usage

**Equipment Requirements:**
- Smartphones with GPS (Android 8.0+)
- Mobile data packages
- Power banks
- Training on field safety

**Work Dashboard Integration:**
- POIs collected per day
- GPS track coverage
- Photo submissions
- Field hours logged

---

### C. Household Survey Module
**Total:** 14 youth (without disabilities)

**Training Focus:**
- Household enumeration
- Survey interview techniques
- Data privacy protocols
- ODK/KoBoCollect usage
- Informed consent procedures

**Equipment Requirements:**
- Smartphones/tablets
- ID badges
- Survey materials
- Safety equipment

**Work Dashboard Integration:**
- Surveys completed per day
- Response quality metrics
- Household coverage
- Training completion status

---

## 4. Test Accounts Removed

**Removed:** KAYTEST001ES (Test account) - Excluded from all records

---

## 5. Missing IDs - Now Assigned

All 9 previously missing youth IDs have been assigned:

### Kariobangi (5):
1. Emily Musau - **KAR286EM**
2. Wesly Kimuyu - **KAR306WK**
3. Denis Musau - **KAR405DM** *(in digitization)*
4. Sydney Kiamba - **KAR458SK**
5. Grace Mutunga - **KAR432GM**

### Mji wa Huruma (4):
1. Margaret Karita - **HUR781MK**
2. Ambrose Gitau - **HUR749AG**
3. Michael Nduati - **HUR615MN**
4. Peter Chege - **HUR389PC**

---

## 6. Platform Scope Clarification

### What the Platform DOES:
✅ **Learning Management System (LMS)**
- Track training module completion
- Display training materials
- Record training progress
- Issue training certificates

✅ **Work Dashboard**
- Display work statistics (buildings, POIs, surveys, tasks)
- Show daily/weekly performance
- Track OSM uploads (for digitization/mobile mapping)
- Display quality metrics

### What the Platform DOES NOT DO:
❌ Payment processing
❌ Budget tracking
❌ Financial calculations
❌ Payment vouchers
❌ Budget approval workflows

**Note:** Payment processing is handled separately outside the platform.

---

## 7. Database Schema Changes Needed

### New Tables:
1. **program_modules** - Define the 4 modules
2. **youth_module_history** - Track module assignments over time
3. **youth_module_stats** - Track work stats per module

### Modified Tables:
1. **youth_participants**
   - Rename: `program_type` → `module_name`
   - Add: `has_disability` boolean
   - Add: `ward` varchar(100)

2. **youth_personal_info** (new)
   - Store full demographic data
   - Link to youth_participants via youth_id

### Views:
- **youth_osm_stats** (backward compatibility view for digitization module)

---

## 8. Generated Files

### JSON Files:
- ✅ `youth-confirmed-digitization.json` (40 youth)
- ✅ `youth-for-other-modules.json` (244 youth)
- ✅ `youth-by-disability.json` (segregated by disability)
- ✅ `youth-by-settlement.json` (grouped by settlement)

### CSV Files:
- ✅ `youth-for-other-modules.csv` (244 youth - easy spreadsheet review)

---

## 9. Next Steps

### Immediate Actions:
1. ✅ Remove test account KAYTEST001ES from database
2. ✅ Confirm Denis Musau (KAR405DM) stays in digitization
3. ⏳ Review and approve module allocation (216 microtasking, 14 mobile, 14 survey)
4. ⏳ Run database migration script
5. ⏳ Register 244 youth to their respective modules

### Module-Specific Setup:
1. **Microtasking:** Select platform, create training materials
2. **Mobile Mapping:** Survey smartphone availability, plan equipment procurement
3. **Household Survey:** Design survey instruments, create safety protocols

### Training Schedule:
1. Week 1-2: Microtasking training (216 youth in batches)
2. Week 3: Mobile Mapping training (14 youth)
3. Week 4: Household Survey training (14 youth)

---

## 10. Summary Statistics

| Metric | Count |
|--------|-------|
| Total youth in original list | 300 |
| Youth in analysis | 284 |
| Test accounts removed | 1 (KAYTEST001ES) |
| Confirmed digitization | 40 |
| Available for other modules | 244 |
| **Module Allocation:** | |
| - Digitization (existing) | 40 |
| - Microtasking (planned) | 216 |
| - Mobile Mapping (planned) | 14 |
| - Household Survey (planned) | 14 |
| **Total Active Youth** | **284** |

---

## 11. Key Corrections Made

1. ✅ **Denis Musau (KAR405DM)** - Confirmed as digitization youth, removed from dropout list
2. ✅ **Test Account KAYTEST001ES** - Removed from all records
3. ✅ **Missing IDs** - All 9 youth IDs assigned
4. ✅ **Platform Scope** - Clarified as LMS + Work Dashboard only (no payment processing)
5. ✅ **Accurate Count** - 40 actual digitization youth (not 61 from database query)

---

**Report Generated:** January 7, 2026  
**Status:** Ready for stakeholder approval and implementation

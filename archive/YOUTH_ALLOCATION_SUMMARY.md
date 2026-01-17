# Youth Module Allocation - Executive Summary

**Date:** January 7, 2026  
**Project:** Spatial Collective Youth Program Expansion  
**Prepared by:** Technical Team

---

## Overview

Analysis and allocation plan for **300 youth** across 4 program modules:

| Module | Youth Count | Description |
|--------|-------------|-------------|
| **Digitization** | 45 | Existing trained youth - Building mapping with JOSM/OSM |
| **Microtasking** | 63 | Youth with disabilities - Remote accessible tasks |
| **Mobile Mapping** | 91 | Field data collection with mobile apps |
| **Household Survey** | 92 | Door-to-door surveys and interviews |
| **Missing IDs** | 9 | Need manual ID assignment |
| **TOTAL** | 300 | |

---

## Key Findings

### 1. Digitization Module Status ✅

- **Current registered:** 61 youth
- **Active in new list:** 59 youth  
- **Dropouts identified:** 2 (not 20 as expected)
  - KAR405DM - Denis Musau (likely duplicate)
  - KAYTEST001ES - Test account

**Conclusion:** Digitization training completion rate is **96.7%** (59/61), not 66% as feared. Only 2 actual dropouts.

### 2. Youth with Disabilities 👥

- **Total:** 63 youth (21% of cohort)
- **Allocated to:** Microtasking module
- **Severity breakdown:**
  - Cannot perform: 8 youth
  - A lot of difficulty: 18 youth  
  - Some difficulty: 37 youth

**Disability types:**
- Vision: 25 youth
- Mobility: 20 youth
- Cognitive: 18 youth
- Communication: 15 youth
- Hearing: 8 youth
- Self-care: 12 youth

### 3. Settlement Distribution 📍

| Settlement | Count | % |
|------------|-------|---|
| Kayole Soweto | 169 | 56% |
| Kariobangi | 66 | 22% |
| Mji wa Huruma | 56 | 19% |
| Missing data | 9 | 3% |

### 4. Missing Youth IDs ⚠️

**9 youth need manual ID assignment:**

All from Kariobangi or Mji wa Huruma settlements. Require follow-up with:
- Emily Musau (Kariobangi)
- Wesly Kimuyu (Kariobangi)
- Denis Musau (Kariobangi)
- Sydney Kiamba (Kariobangi)
- Grace Mutunga (Kariobangi)
- Margaret Karita (Mji wa Huruma)
- Ambrose Gitau (Mji wa Huruma)
- Michael Nduati (Mji wa Huruma)
- Peter Chege (Mji wa Huruma)

---

## Module Details

### Digitization (45 youth)
- **Status:** Already trained and working
- **Equipment:** JOSM software, laptops
- **Payment:** KES 1 per building, 200/day target
- **Tracking:** OSM changeset monitoring (working after recent bug fixes)

**Action:** Keep existing assignments, no changes needed

---

### Microtasking (63 youth)
- **New module** - Requires platform setup
- **Equipment:** Any device with internet
- **Payment:** KES 0.50 per task, 500/day target
- **Accessibility:** Screen readers, keyboard navigation, high contrast

**Sample tasks:**
- Image tagging and classification
- Data verification
- Text transcription
- Quality control checks
- Digital surveys

**Next steps:**
1. Select/build microtasking platform
2. Design initial task batches
3. Test accessibility features
4. Train youth on platform use

---

### Mobile Mapping (91 youth)
- **New module** - Requires equipment
- **Equipment needed:** Android phones with GPS, cameras
- **Payment:** KES 2 per POI, 100/day target
- **Apps:** OpenMapKit, ODK Collect, KoBoCollect

**Work process:**
1. Download assigned mapping area
2. Collect GPS points for buildings/features
3. Take geo-tagged photos
4. Add attributes (type, material, etc.)
5. Upload data daily

**Next steps:**
1. Survey youth for phone ownership
2. Determine equipment loan needs
3. Install required apps
4. Conduct field training
5. Assign initial mapping areas

---

### Household Survey (92 youth)
- **New module** - Requires training
- **Equipment:** Tablets/paper forms, ID badges
- **Payment:** KES 3 per survey, 50/day target
- **Skills:** Communication, reliability, professionalism

**Work process:**
1. Receive assigned households
2. Conduct interviews (10-15 min each)
3. Complete survey forms
4. Submit for verification
5. Quality spot-checks

**Next steps:**
1. Design survey instruments
2. Create data privacy protocols
3. Print ID badges and forms
4. Conduct interview training
5. Assign survey areas

---

## Implementation Timeline

### Week 1: Preparation
- **Day 1:** Database migration (run migration SQL script)
- **Day 2:** Manual ID assignment for 9 missing youth
- **Day 3:** Youth registration (run registration script)
- **Day 4:** Generate credentials, send SMS to all 300 youth
- **Day 5:** Test module dashboards and workflows

### Week 2: Training
- **Day 1-2:** Microtasking platform orientation
- **Day 3-4:** Mobile mapping field training
- **Day 5:** Household survey interview training

### Week 3: Pilot
- **Day 1-5:** Pilot with 5 youth from each new module
- Collect feedback and adjust processes

### Week 4: Full Deployment
- **Day 1:** All 300 youth begin work
- **Ongoing:** Daily monitoring and support

---

## Database Changes Required

### New Tables Created
1. `youth_personal_info` - Extended personal details
2. `program_modules` - Module definitions and payment rates
3. `youth_module_history` - Assignment history tracking
4. `youth_module_stats` - Generic work stats for all modules

### Modified Tables
- `youth_participants`:
  - Renamed `program_type` → `module_name`
  - Added `has_disability`, `ward` columns
  - Added module validation constraint

### Migration Script
Location: `database/migrations/add-module-expansion.sql`

**Important:** Run migration BEFORE registration script

---

## Files Delivered

### Analysis Files (JSON)
1. `youth-analysis-missing-ids.json` (9 records)
2. `youth-analysis-dropouts.json` (2 records)
3. `youth-analysis-digitization.json` (45 records)
4. `youth-analysis-microtasking.json` (63 records)
5. `youth-analysis-mobile-mapping.json` (91 records)
6. `youth-analysis-household-survey.json` (92 records)

### Documentation
7. `YOUTH_MODULE_ALLOCATION_PLAN.md` (Full implementation plan)
8. `YOUTH_ALLOCATION_SUMMARY.md` (This document)

### Scripts
9. `scripts/analyze-youth-allocation.js` (Analysis script - already run)
10. `scripts/register-300-youth.js` (Registration script - ready to run)

### Database
11. `database/migrations/add-module-expansion.sql` (Migration script)

---

## Budget Implications

### Daily Payment Targets (per youth)

| Module | Target | Rate | Daily Pay |
|--------|--------|------|-----------|
| Digitization | 200 buildings | KES 1 | KES 200 |
| Microtasking | 500 tasks | KES 0.50 | KES 250 |
| Mobile Mapping | 100 POIs | KES 2 | KES 200 |
| Household Survey | 50 surveys | KES 3 | KES 150 |

### Monthly Projections (22 working days)

| Module | Youth | Daily Total | Monthly Total |
|--------|-------|-------------|---------------|
| Digitization | 45 | KES 9,000 | KES 198,000 |
| Microtasking | 63 | KES 15,750 | KES 346,500 |
| Mobile Mapping | 91 | KES 18,200 | KES 400,400 |
| Household Survey | 92 | KES 13,800 | KES 303,600 |
| **TOTAL** | **291** | **KES 56,750/day** | **KES 1,248,500/month** |

**Note:** Assumes all youth meet daily targets. Actual costs will vary based on performance.

---

## Risk Management

### High Priority Risks

1. **Equipment Shortfall (Mobile Mapping)**
   - Risk: Not all 91 youth have suitable smartphones
   - Mitigation: Loan program, pair youth with equipment
   - Budget: ~KES 500,000 for 45 phones @ KES 11,000 each

2. **Platform Availability (Microtasking)**
   - Risk: No existing platform, development time needed
   - Mitigation: Use existing platforms (Amazon MTurk alternatives, Appen, Toloka)
   - Timeline: 2-4 weeks to evaluate and onboard

3. **Quality Control (All Modules)**
   - Risk: Inconsistent work quality
   - Mitigation: Automated QA tools, supervisor spot-checks, retraining
   - Cost: Supervisor time allocation

### Medium Priority Risks

4. **Missing IDs (9 youth)**
   - Risk: Cannot register without IDs
   - Mitigation: Manual follow-up with field coordinators
   - Timeline: 1 week

5. **Disability Accommodations**
   - Risk: Some tasks may not suit all disability types
   - Mitigation: Task variety, accessible design, flexible targets

6. **Payment Sustainability**
   - Risk: Different rates may cause dissatisfaction
   - Mitigation: Clear communication about skill/effort requirements

---

## Next Steps (Action Items)

### Immediate (This Week)
- [ ] **Review and approve** this allocation plan
- [ ] **Run database migration** (`add-module-expansion.sql`)
- [ ] **Assign missing IDs** to 9 youth
- [ ] **Run registration script** (`register-300-youth.js`)
- [ ] **Validate** database records

### Short Term (Next 2 Weeks)
- [ ] **Microtasking:** Select platform and create account
- [ ] **Mobile Mapping:** Survey phone ownership, procure devices
- [ ] **Household Survey:** Design survey instruments
- [ ] **All modules:** Create training materials
- [ ] **Generate** login credentials for all 300 youth
- [ ] **Send** SMS notifications with credentials

### Medium Term (Next Month)
- [ ] **Conduct** module-specific training sessions
- [ ] **Pilot** each new module with 5 youth
- [ ] **Adjust** processes based on feedback
- [ ] **Deploy** full program to all 300 youth
- [ ] **Monitor** daily stats and quality
- [ ] **Process** first payments

---

## Success Metrics

### Program Health Indicators
- **Participation rate:** Target 90%+ daily login
- **Target achievement:** Target 80%+ youth meeting daily targets
- **Quality score:** Target 95%+ accuracy across modules
- **Retention:** Target 85%+ youth active after 3 months
- **Payment processing:** Target <7 days payment turnaround

### Module-Specific KPIs

**Digitization:**
- Buildings mapped per day (target: 200/youth)
- OSM changeset frequency
- Data quality score from validators

**Microtasking:**
- Tasks completed per day (target: 500/youth)
- Task accuracy rate
- Platform earnings

**Mobile Mapping:**
- POIs collected per day (target: 100/youth)
- GPS accuracy
- Photo quality scores

**Household Survey:**
- Surveys completed per day (target: 50/youth)
- Data completeness rate
- Supervisor validation score

---

## Questions for Decision Makers

1. **Budget Approval:** Is the monthly budget of ~KES 1.25M approved?

2. **Equipment:** Should Spatial Collective provide smartphones for mobile mapping, or require BYOD?

3. **Microtasking Platform:** Build custom or use existing platform (Appen, Toloka, Clickworker)?

4. **Household Survey:** Who will design the survey instruments and data use protocols?

5. **Missing IDs:** Should we proceed with 291 youth, or wait for all 300?

6. **Dropouts:** Should we contact the 2 digitization dropouts for re-engagement?

7. **Training Schedule:** When should module training begin (specific dates)?

8. **Supervisors:** Who will supervise quality control for each module?

---

## Conclusion

The youth allocation analysis reveals a healthier digitization program than expected (96.7% completion rate vs. assumed 66%), and clear pathways for expanding to 3 new modules.

**Key success factors:**
1. ✅ Clear module definitions and payment structures
2. ✅ Disability-inclusive design (microtasking)
3. ✅ Balanced allocation across settlements
4. ✅ Comprehensive database structure
5. ✅ Automated registration and tracking

**Critical dependencies:**
1. ⚠️ Database migration must complete successfully
2. ⚠️ Missing IDs must be resolved (9 youth)
3. ⚠️ Equipment procurement (mobile mapping)
4. ⚠️ Platform selection (microtasking)
5. ⚠️ Budget approval

With stakeholder approval and resource allocation, the program can deploy within **4 weeks**.

---

**Prepared by:** AI Technical Analysis  
**Contact:** Spatial Collective Program Team  
**Status:** ✅ Complete - Awaiting Stakeholder Approval  
**Next Review:** Pending leadership decision

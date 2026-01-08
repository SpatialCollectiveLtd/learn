# Youth Module Allocation - Quick Reference Checklist

## 📊 Summary Stats

- **Total Youth:** 300
- **Allocated:** 291 (97%)
- **Missing IDs:** 9 (3%)

### Module Breakdown:
- ✅ **Digitization:** 45 youth (existing, trained)
- 🆕 **Microtasking:** 63 youth (disabilities)
- 🆕 **Mobile Mapping:** 91 youth
- 🆕 **Household Survey:** 92 youth

### Settlement Distribution:
- **Kayole Soweto:** 169 youth (56%)
- **Kariobangi:** 66 youth (22%)
- **Mji wa Huruma:** 56 youth (19%)

---

## 🎯 Key Findings

1. ✅ **Only 2 dropouts** from digitization (not 20!)
   - KAR405DM - Denis Musau
   - KAYTEST001ES - Test account
   - **Completion rate: 96.7%**

2. 👥 **63 youth with disabilities** → Microtasking module
   - Accessible, remote work
   - Flexible targets

3. ⚠️ **9 youth need ID assignment**
   - 5 from Kariobangi
   - 4 from Mji wa Huruma

---

## 📋 Implementation Checklist

### Phase 1: Database Setup
- [ ] Review `YOUTH_ALLOCATION_SUMMARY.md`
- [ ] Review `YOUTH_MODULE_ALLOCATION_PLAN.md`
- [ ] Backup database
- [ ] Run `database/migrations/add-module-expansion.sql`
- [ ] Verify migration success

### Phase 2: Missing IDs
- [ ] Contact 9 youth for ID verification
- [ ] Assign Youth IDs (format: KAR###XX or HUR###XX)
- [ ] Update `youth-analysis-*.json` files

### Phase 3: Registration
- [ ] Review allocation JSON files
- [ ] Run `node scripts/register-300-youth.js`
- [ ] Verify database records
- [ ] Check module counts

### Phase 4: Credentials
- [ ] Generate passwords (default: `DPW2025` + youth_id)
- [ ] Prepare SMS messages
- [ ] Send credentials to all 300 youth

### Phase 5: Module Setup

#### Microtasking:
- [ ] Select platform (Appen, Toloka, or custom)
- [ ] Create accounts for 63 youth
- [ ] Test accessibility features
- [ ] Prepare task batches

#### Mobile Mapping:
- [ ] Survey phone ownership
- [ ] Procure/loan smartphones
- [ ] Install apps (OpenMapKit, ODK, KoBoCollect)
- [ ] Assign mapping areas

#### Household Survey:
- [ ] Design survey instruments
- [ ] Print ID badges and forms
- [ ] Create data privacy protocols
- [ ] Assign survey areas

### Phase 6: Training
- [ ] Schedule training sessions by module
- [ ] Prepare training materials
- [ ] Conduct orientations
- [ ] Test workflows with pilot groups

### Phase 7: Launch
- [ ] Start pilot (5 youth per new module)
- [ ] Monitor daily stats
- [ ] Collect feedback
- [ ] Full deployment
- [ ] Process first payments

---

## 💰 Budget Quick Reference

### Daily Targets & Pay:
| Module | Target | Rate | Pay/Day |
|--------|--------|------|---------|
| Digitization | 200 buildings | KES 1 | KES 200 |
| Microtasking | 500 tasks | KES 0.50 | KES 250 |
| Mobile Mapping | 100 POIs | KES 2 | KES 200 |
| Household Survey | 50 surveys | KES 3 | KES 150 |

### Monthly Budget (22 days):
- **Digitization:** KES 198,000 (45 youth)
- **Microtasking:** KES 346,500 (63 youth)
- **Mobile Mapping:** KES 400,400 (91 youth)
- **Household Survey:** KES 303,600 (92 youth)
- **TOTAL:** KES 1,248,500/month

---

## 📁 Files Delivered

### Analysis (JSON):
1. `youth-analysis-missing-ids.json` (9)
2. `youth-analysis-dropouts.json` (2)
3. `youth-analysis-digitization.json` (45)
4. `youth-analysis-microtasking.json` (63)
5. `youth-analysis-mobile-mapping.json` (91)
6. `youth-analysis-household-survey.json` (92)

### Documentation:
7. `YOUTH_MODULE_ALLOCATION_PLAN.md` (detailed plan)
8. `YOUTH_ALLOCATION_SUMMARY.md` (executive summary)
9. `YOUTH_ALLOCATION_CHECKLIST.md` (this file)

### Scripts:
10. `scripts/analyze-youth-allocation.js` (✅ already run)
11. `scripts/register-300-youth.js` (⏳ ready to run)

### Database:
12. `database/migrations/add-module-expansion.sql` (⏳ ready to run)

---

## ⚠️ Critical Actions Required

1. **ASSIGN MISSING IDs** (9 youth) - Cannot proceed without these
2. **APPROVE BUDGET** - KES 1.25M/month
3. **RUN DATABASE MIGRATION** - Must happen before registration
4. **SELECT MICROTASKING PLATFORM** - Impacts 63 youth
5. **PROCURE EQUIPMENT** - Mobile mapping needs ~45 phones

---

## 🚨 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing IDs | 9 youth can't register | Manual follow-up (1 week) |
| No smartphones | Mobile mapping blocked | Loan program, budget KES 500K |
| No platform | Microtasking blocked | Use existing (Appen/Toloka) |
| Quality issues | Payment disputes | QA tools, spot checks |
| Different pay rates | Dissatisfaction | Clear communication |

---

## 📞 Questions for Stakeholders

1. Budget approval for KES 1.25M/month?
2. Smartphone policy: provide or BYOD?
3. Microtasking: build or use existing platform?
4. Missing IDs: proceed with 291 or wait for 300?
5. Training dates: when should we start?
6. Supervisors: who handles QA for each module?

---

## ✅ Success Metrics

### Targets (First 3 Months):
- **Participation:** 90%+ daily login
- **Target achievement:** 80%+ youth meeting targets
- **Quality:** 95%+ accuracy
- **Retention:** 85%+ active after 3 months
- **Payment:** <7 days turnaround

---

## 🎉 Next Steps

1. **TODAY:** Review and approve plan
2. **Day 1:** Run database migration
3. **Day 2:** Assign missing IDs
4. **Day 3:** Run registration script
5. **Day 4:** Send credentials
6. **Week 2:** Training sessions
7. **Week 3:** Pilot programs
8. **Week 4:** Full deployment

---

**Status:** ✅ Analysis Complete - Ready for Implementation  
**Owner:** Spatial Collective Leadership  
**Timeline:** 4 weeks to full deployment  
**Budget:** KES 1.25M/month

---

*For detailed information, see:*
- *Full Plan: YOUTH_MODULE_ALLOCATION_PLAN.md*
- *Executive Summary: YOUTH_ALLOCATION_SUMMARY.md*

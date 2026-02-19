# Mobile Mapping Features - Action Checklist

**Created:** February 2, 2026  
**Owner:** SC Learning Platform Team  
**Priority:** HIGH

---

## ✅ Completed Tasks

- [x] Research and document mobile mapping system architecture
- [x] Analyze database schema and user distribution
- [x] Create comprehensive API request specification (40+ pages)
- [x] Design implementation plan with component architecture
- [x] Create archive script for inactive mobile mappers
- [x] Document current system in MOBILE_MAPPING_COMPREHENSIVE_ANALYSIS.md
- [x] Create development roadmap (5-week timeline)
- [x] Design UI/UX for payment, performance, resolve center, badges

---

## 🔴 Critical Next Steps (This Week)

### 1. Share API Request with DPW Manager Team
**File:** `docs/api/DPW_MOBILE_MAPPING_FEATURES_API_REQUEST.md`

**Action:**
```bash
# Send to DPW team via email
Subject: API Request - Mobile Mapping Features for Learning Platform
Attach: docs/api/DPW_MOBILE_MAPPING_FEATURES_API_REQUEST.md
```

**Key Points to Communicate:**
- 5 new endpoints needed (payment, performance, badges, queries)
- Detailed request/response schemas provided
- 2-week implementation timeline requested
- Testing data needed for staging environment

**Expected Response:**
- Timeline confirmation
- Staging API key
- Questions/clarifications

---

### 2. Archive Inactive Mobile Mappers
**File:** `scripts/archive-inactive-mobile-mappers.js`

**Step 1: Preview (Dry Run)**
```bash
cd c:\Users\primo\OneDrive\Desktop\learn
node scripts/archive-inactive-mobile-mappers.js --dry-run
```

**Expected Output:**
```
Found 28 mobile mappers without ODK setup:

Kayole Soweto (X users):
  1. KAY348RN - Regina Nzoka
  ...

Kariobangi Machakos (Y users):
  ...

Mji wa Huruma (Z users):
  ...

🔒 DRY RUN MODE - No changes will be made.
```

**Step 2: Execute Archiving**
```bash
# After reviewing dry-run output
node scripts/archive-inactive-mobile-mappers.js
```

**Expected Result:**
- 28 users set to `is_active = false`
- Backup created: `backups/inactive_mobile_mappers_backup_TIMESTAMP.json`
- Restoration script: `backups/restore_inactive_mobile_mappers_TIMESTAMP.sql`

**Verification:**
- Active mobile mappers with ODK: 153 ✅
- Active mobile mappers without ODK: 0 ✅
- Archived: 28

---

### 3. Set Up Staging Environment
**Action Items:**

**a) Request from DPW team:**
- [ ] Staging API URL (e.g., `https://test.app.spatialcollective.com`)
- [ ] Staging API key
- [ ] Test youth IDs with sample data

**b) Configure Vercel staging:**
```bash
# Add environment variables in Vercel dashboard
DPW_MANAGER_BASE_URL=https://test.app.spatialcollective.com
DPW_MANAGER_API_KEY=<staging_key>
```

**c) Test connectivity:**
```bash
# Create test script
node scripts/test-dpw-mobile-mapping-api.js
```

---

## 🟡 This Month (February 2026)

### Week 1 (Feb 3-9): Foundation
- [ ] Wait for DPW team timeline confirmation
- [ ] Set up staging environment
- [ ] Create API proxy routes:
  - [ ] `/api/youth/payment/breakdown/route.ts`
  - [ ] `/api/youth/performance/route.ts`
  - [ ] `/api/youth/badges/route.ts`
  - [ ] `/api/youth/queries/submit/route.ts`
  - [ ] `/api/youth/queries/route.ts`
- [ ] Test proxy routes with staging API
- [ ] Create `WorkDashboardTabs` component

### Week 2 (Feb 10-16): Payment Features
- [ ] Build `PaymentTab` component
- [ ] Build `TodayEarningsCard`
- [ ] Build `PeriodSummaryCard`
- [ ] Build `DailyBreakdownTable`
- [ ] Build `PaymentRulesInfo`
- [ ] Integrate with payment API
- [ ] Test with real DPW data

### Week 3 (Feb 17-23): Performance & Badges
- [ ] Build `PerformanceTab` component
- [ ] Build `PersonalMetricsCard`
- [ ] Build `RankingsCard`
- [ ] Build `LeaderboardTable`
- [ ] Build `BadgesShowcase`
- [ ] Build `BadgeCard` (earned/locked states)
- [ ] Integrate with performance + badges APIs

### Week 4 (Feb 24-Mar 1): Resolve Center
- [ ] Build `ResolveCenterTab` component
- [ ] Build `SubmitQueryForm`
- [ ] Build `QueryCard` component
- [ ] Build `ActiveQueriesList`
- [ ] Build `ResolvedQueriesList`
- [ ] Add floating action button (mobile)
- [ ] Integrate with queries API

---

## 🟢 March 2026: Testing & Launch

### Week 5 (Mar 2-8): Testing
- [ ] Unit tests for all components
- [ ] Integration tests for API routes
- [ ] User acceptance testing (5-10 youth)
- [ ] Mobile responsiveness testing
- [ ] Performance testing (load times)
- [ ] Bug fixing

### Week 6 (Mar 9-15): Soft Launch
- [ ] Deploy to staging
- [ ] Final QA
- [ ] Soft launch to 10 test users
- [ ] Monitor for errors
- [ ] Gather feedback

### Week 7 (Mar 16-22): Full Rollout
- [ ] Deploy to production
- [ ] Enable for all 153 active mobile mappers
- [ ] Announce via trainers/WhatsApp
- [ ] Monitor user adoption
- [ ] Provide support

---

## 📋 Supporting Tasks

### Documentation Updates
- [ ] Update `.github/copilot-instructions.md` with new features
- [ ] Add mobile mapping features to `docs/PLATFORM_DOCUMENTATION.md`
- [ ] Create user guide for youth: "How to Use Payment Dashboard"
- [ ] Create trainer guide: "Supporting Youth with Resolve Center"

### Monitoring & Analytics
- [ ] Set up error tracking for new API routes
- [ ] Create dashboard for feature adoption metrics
- [ ] Monitor DPW API response times
- [ ] Track query submission volume

### User Communication
- [ ] Prepare announcement message (WhatsApp/SMS)
- [ ] Create quick start guide (infographic)
- [ ] Schedule trainer briefing session
- [ ] Prepare FAQ document

---

## 🚨 Blockers & Dependencies

### Current Blockers
1. **DPW Manager API** - Not yet implemented
   - **Status:** Specification sent, awaiting timeline
   - **Impact:** Cannot start development until endpoints available
   - **Mitigation:** Use mock data for initial UI development

2. **Staging Environment** - Not configured
   - **Status:** Awaiting staging API key from DPW team
   - **Impact:** Cannot test integration
   - **Mitigation:** Set up once DPW team responds

### Dependencies
1. **DPW Team:** API implementation (2 weeks)
2. **Design Team:** Badge icons (if custom designs needed)
3. **Trainers:** User testing feedback
4. **Youth:** Beta testing participation

---

## 📊 Success Metrics Tracking

### Week 1 Post-Launch
- [ ] Measure: % of youth who viewed payment dashboard
- [ ] Target: 80%+
- [ ] Measure: % of youth who checked leaderboard
- [ ] Target: 50%+
- [ ] Measure: Support queries about new features
- [ ] Target: <5

### Month 1 Post-Launch
- [ ] Measure: Reduction in payment-related support queries
- [ ] Target: 30%
- [ ] Measure: Youth satisfaction score (survey)
- [ ] Target: 90%+
- [ ] Measure: Queries submitted through resolve center
- [ ] Target: 10+
- [ ] Measure: Increase in daily logins
- [ ] Target: 20%

---

## 📞 Key Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Learning Platform Dev | tech@spatialcollective.co.ke | Feature implementation |
| DPW Manager Dev | [TBD] | API implementation |
| Project Manager | [TBD] | Timeline coordination |
| Trainers Lead | [TBD] | User testing, feedback |

---

## 📁 Reference Documents

1. **API Specification:** `docs/api/DPW_MOBILE_MAPPING_FEATURES_API_REQUEST.md`
2. **Implementation Plan:** `MOBILE_MAPPING_IMPLEMENTATION_PLAN.md`
3. **System Analysis:** `MOBILE_MAPPING_COMPREHENSIVE_ANALYSIS.md`
4. **Archive Script:** `scripts/archive-inactive-mobile-mappers.js`
5. **Summary:** `MOBILE_MAPPING_FEATURES_SUMMARY.md`

---

## 🎯 Priority Order

### Must Do Now (This Week)
1. ⚡ Share API request doc with DPW team
2. ⚡ Run archive script (after dry-run review)
3. ⚡ Request staging environment access

### Can Start Soon (While Waiting for DPW API)
1. Build tab navigation UI
2. Create component scaffolding
3. Design with mock data
4. Write unit tests

### Do Later (After DPW API Ready)
1. API integration
2. End-to-end testing
3. User acceptance testing
4. Production deployment

---

**Status:** ✅ Planning Complete  
**Next Action:** Share API request doc with DPW Manager team  
**Timeline:** 5-7 weeks from API availability to full rollout

---

*Last Updated: February 2, 2026*

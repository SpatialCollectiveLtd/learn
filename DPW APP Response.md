# Learn Platform API - Research Findings & Clarification Questions

**Date:** February 2, 2026  
**Prepared By:** DPW Platform Team  
**To:** SC Learning Platform Team  

---

## 📊 Research Findings Summary

### ✅ What We Have (Ready to Build)

1. **Work_Ledger Data Structure**
   - ✅ Daily granular records for mobile mapping
   - ✅ All entries have: POI count (`volume_count`), quality score (0-1.0), base pay (760 KES)
   - ✅ Source references to ODK submissions
   - ✅ 100% data completeness for fields needed

2. **Quality Calculation**
   - ✅ **Correctly implemented:** Quality = answered_fields / total_fields
   - ✅ Matches your spec: "If 8/10 questions thats 80% quality"
   - ✅ Quality scores range from 0.0 to 1.0 (multiply by 100 for percentage)

3. **User Coverage**
   - ✅ 154 total users assigned to mobile_mapping
   - ✅ 80 users WITH work data (can show full payment breakdown)
   - ⚠️ 74 users WITHOUT work data yet (will show zero earnings)

4. **Payment Calculation Logic**
   - ✅ Base pay: 760 KES/day (constant across all platforms)
   - ✅ Quality bonus tiers: 90%+ (30%), 70-89% (20%), 60-69% (10%)
   - ✅ Settlement-specific quality configs (some in training mode, some active)

### ❌ What We DON'T Have (Needs Discussion/Build)

1. **Settlement Work Calendars** (for work day sequencing)
   - ❌ NO active `Settlement_Work_Calendars` entries for mobile_mapping
   - ❌ Cannot derive "Work Day 1, 2, 3..." from existing data
   - 🔧 **Action Required:** Create calendars or alternative sequencing method

2. **Module_Configs Entry**
   - ❌ NO `Module_Configs` entry for `mobile_mapping` module
   - 🔧 **Action Required:** Create config entry

3. **Badge System**
   - ❌ NO badge tables, no badge logic, no badge icons
   - 📝 **Deferred to Learn Platform** (as discussed)

4. **Ticketing/Query System**
   - ❌ NO tables for queries, disputes, or ticket management
   - 🔧 **Action Required:** Build from scratch (3-4 days estimated)

### 🐛 Critical Bug Discovered

**Quality Bonus Bug:**
- ✅ Quality scores correctly calculated (averaging 93.1%)
- ❌ **NO bonuses being paid** (all entries show `bonus_pay = 0`)
- ❌ Even Kayole users with quality bonuses ENABLED receive 0 bonus
- 💰 **Impact:** Users owed ~228 KES/day in quality bonuses not being paid

**Example:**
- User: Denis Gitahi (KAY2544DG)
- Quality: 97.3% (Excellent tier)
- Current Pay: 760 KES (base only)
- **Expected Pay:** 988 KES (760 + 228 bonus)
- **Loss:** 228 KES per day

**Cause:** Quality bonus calculation exists in code but NOT being applied during Work_Ledger sync.

---

## 🚨 Critical Clarification Questions

### ✅ Q1: Payment Structure Discrepancy (ANSWERED)

**Your Spec Says:**
- Base pay: **500 KES/day**
- Quality pay max: **200 KES/day**
- Performance bonus: **100-200 KES** for exceeding POI thresholds

**Our Production System:**
- Base pay: **760 KES/day**
- Quality bonus: **0-228 KES/day** (30% of base pay)
- NO performance bonuses (we use quality tiers only)

**✅ DECISION:**
- API will return **760 KES base pay** (our actual production structure)
- The 500 KES in your spec was an example, not a requirement
- All platforms use 760 KES consistently
- We'll include `performance_bonus: 0` field for consistency, but explain it's not used
- Payment formula will explain our actual quality tier system (30%/20%/10%)

**Action Items for Learn Platform:**
- Update your dashboard mockups to show 760 KES base pay
- Adjust quality pay maximum to 228 KES (30% of 760)
- UI should explain performance bonuses are not applicable for mobile mapping

---

### ✅ Q2: Work Day Numbering (ANSWERED)

**Your Spec Requires:**
```json
{
  "daily_breakdown": [
    { "work_day": 1, "date": "2026-01-15", ... },
    { "work_day": 2, "date": "2026-01-16", ... },
    { "work_day": 3, "date": "2026-01-18", ... }
  ]
}
```

**✅ SOLUTION:**
- **Use Learn API attendance data** - Learn platform tracks attendance and knows which days users came
- DPW can query Learn API to get attendance history per user
- Attendance data maps to work days (attendance day 1, 2, 3... = work day 1, 2, 3...)
- **Alternative:** DPW can propose our own format for easier integration

**Implementation Options:**
1. **Option A (Using Learn Data):** Query Learn API for attendance days, match with Work_Ledger dates
2. **Option B (DPW Format):** Return dates only or chronological numbering, Learn platform maps to their attendance system

**Questions for Learn Platform:**
1. Should we query YOUR attendance API to get work day numbers?
2. OR can we return chronological order (1, 2, 3...) and you map it on your side?
3. What's the endpoint for fetching attendance history per user from Learn API?

**Recommendation:**
Let Learn platform clarify which approach is simpler. If we query their API, we need endpoint details.

---

### Q3: "Today's Stats" Real-Time Data

**Your Spec Requires:**
```json
{
  "today_stats": {
    "date": "2026-02-02",
    "pois_submitted": 12,
    "quality_score": 95.5,
    "estimated_earnings": 750.00
  }
}
```

**Our Challenge:**
- Work_Ledger is synced periodically (not real-time)
- ODK submissions come in throughout the day
- Quality score calculated AFTER all day's submissions

**Questions:**
1. Do you need **real-time** today's stats (query ODK directly)?
2. OR is **last sync** data acceptable (may be hours old)?
3. Should "estimated_earnings" be marked as "pending" until day ends?

**Our Recommendation:**
Use Work_Ledger data (last sync), add `last_updated` timestamp to show data freshness.

---

### Q4: Users Without Work Data (74 users)

**Your Spec Shows:**
- Zero earnings
- Empty daily_breakdown
- Message: "No payment data available yet"

**Our Question:**
Should these users still see:
1. Their settlement and module assignment? ✅
2. The payment rules and targets? ✅
3. A message encouraging them to start working? ✅
4. Current leaderboard (even if they're not on it)? ❓

**Our Recommendation:**
Show encouraging message + payment rules + settlement leaderboard (so they see peers).

---

### Q5: Performance API - Ranking Calculation

**Your Spec Says:**
```
overall_score = (quality_score × 0.7) + (attendance_rate × 0.3)
```

**Our Questions:**
1. Attendance from Learn platform API or our Work_Ledger?
2. If youth hasn't started yet (0 work days), is attendance 0% or excluded?
3. Should ranking exclude users with <3 days of work (not enough data)?
4. Tiebreaker logic: You said `total_pois_submitted` - should we use that?

**Our Recommendation:**
- Use Work_Ledger days count for attendance (not Learn API, avoid dependency)
- Exclude users with 0 work days from rankings
- Tiebreaker: 1) overall_score, 2) total_pois, 3) earliest_submission_date

---

### ✅ Q6: Badge System - Scope Confirmation (ANSWERED)

**Your Spec Includes:**
- 12 badges with Bronze/Silver/Gold/Platinum tiers
- Progress tracking
- Icon URLs
- Unlock logic

**✅ DECISION:**
- Learn platform will build the badge system on their side
- DPW will **skip** the `/api/v1/youth/{youth_id}/badges` endpoint
- Learn platform will calculate badge unlocks from Performance API data

**Action Items for Learn Platform:**
- **IMPORTANT:** We are NOT implementing the Badge API endpoint
- You will need to build badge logic using data from:
  - Performance Metrics API (quality scores, attendance, rankings)
  - Payment Breakdown API (POI counts, work days)
- Please confirm you can derive all badge criteria from these two APIs
- Let us know if you need additional fields in Performance API to support badge calculations

**Qu✅ Q7: Query/Ticketing System - Admin Workflow (PARTIALLY ANSWERED)

**Your Spec Shows:**
- Queries submitted by youth
- Admin responses with resolution notes
- Status tracking (pending → in_progress → resolved)

**✅ DECISION:**
- **DPW Managers** will respond to queries (not Learn platform admins)

**Remaining Questions for Learn Platform:**
1. **Email notifications?** Should DPW Managers get email alerts when youth submit queries?
2. **Attachment storage?** Where should we store uploaded screenshots?
   - Option A: Google Drive (we have existing integration)
   - Option B: Base64 in database (simpler but larger DB)
3. **Response interface?** Will DPW Managers respond via:
   - Option A: DPW Manager dashboard (we build admin UI)
   - Option B: Learn platform forwards responses (you build UI)
4. **Query categories routing?**
   - Payment disputes → DPW Managers
   - ODK technical issues → Who handles these?
   - General questions → Who handles these?

**Recommendation:**
- Store attachments in Google Drive (we already have this for OSM files)
- Email alerts to DPW Manager team email (tech@spatialcollective.co.ke)
- Build simple admin UI in DPW Manager for responding to queries
- All categories handled by DPW Managers initially (can split later)) vs payment issues - different handlers?

**Our Recommendation:**
- DPW Managers respond to payment/work disputes
- Learn Platform admins respond to ODK technical issues
- Email alerts for both systems
- Store attachments in Google Drive (we have existing integration)
- Shared query_id for cross-platform tracking

---

### Q8: API Rate Limiting

**Your Spec Says:**
- Payment API: 100 requests/minute
- Performance API: 50 requests/minute
- Query Submit: 10 requests/minute per youth

**Our Questions:**
1. Is this rate limit **per API key** (Learn platform has 1 key)?
2. OR **per youth user** (181 users × limits)?
3. Do you expect parallel requests or sequential?
✅ Q9: Timeline Confirmation (ANSWERED)

**Your Deadline:**
- Implementation: Feb 15, 2026 (13 days from now)
- Testing: Feb 16-20, 2026
- Go-live: Feb 21, 2026

**✅ DECISION: Phased Delivery Approved**

**Phase 1 (Feb 3-10):** Core Features
- Fix quality bonus bug (Feb 3)
- Payment Breakdown API (Feb 4-6)
- Performance Metrics API (Feb 7-9)
- Initial testing (Feb 10)
- **Deliverable:** Youth can view payments and performance

**Phase 2 (Feb 11-17):** Ticketing System
- Query Submission API (Feb 11-13)
- Query List API (Feb 14)
- Admin response UI (Feb 15)
- Attachment handling (Feb 16)
- Integration testing (Feb 17)
- **Deliverable:** Youth can submit disputes/questions

**Phase 3 (Feb 18-21):** Launch
- Production deployment (Feb 18-19)
- Monitoring and fixes (Feb 20)
- Go-live (Feb 21)

**Minimum Viable Product (MVP) for Feb 21:**
- ✅ Payment Breakdown API (MUST HAVE)
- ✅ Performance Metrics API (MUST HAVE)
- ✅ Query Submission API (MUST HAVE)
- ✅ Query List API (MUST HAVE)
- ⚠️ Admin response UI (NICE TO HAVE - can be manual initially)

**Risk Mitigation:**
- Testing happens in parallel with Phase 2 development
- Phase 1 features tested while building Phase 2
- Production-only environment requires extra caution
1. Can we **phase the delivery**?
   - Phase 1 (Feb 10): Payment + Performance APIs (core features)
   - Phase 2 (Feb 17): Query/Ticketing system (if critical)
2. What's the **minimum viable** feature set for Feb 21 launch?
3. Can testing happen in **parallel** with Phase 2 development?

**Our Recommendation:**
Phased delivery to reduce risk. Core payment/performance features first, ticketing system week 2.

---

## 📋 Proposed Implementation Plan

### Phase 1: Critical Bug Fix (Feb 3, 1 day)
- [ ] Fix quality bonus calculation in Work_Ledger sync
- [ ] Backfill bonuses for Kayole users (historical data)
- [ ] Test with sample users

### Phase 2: Core APIs (Feb 4-8, 5 days)
- [ ] Create Module_Configs entry for mobile_mapping
- [ ] Implement work day sequencing (chronological)
- [ ] Build Payment Breakdown API
- [ ] Build Performance Metrics API
- [ ] Build Query List API (read-only)

### Phase 3: Ticketing System (Feb 9-13, 5 days)
- [ ] Design query/ticket database tables
- [ ] Build Query Submission API
- [ ] Add attachment upload (Google Drive)
- [ ] Email notification system
- [ ] Admin response interface

### Phase 4: Testing (Feb 14-17, 4 days)
- [ ] Test with 10 sample youth across settlements
- [ ] Load testing (181 concurrent users)
- [ ] Edge case Status

### ✅ Answered by DPW Manager (Internal)

1. ✅ **Payment Structure:** 760 KES base pay (our standard across all platforms)
2. ✅ **Badge System:** Skip Badge API endpoint (Learn builds on their side)
3. ✅ **Query System Admin:** DPW Managers respond to queries
4. ✅ **Timeline:** Phased delivery approved (Core APIs → Ticketing)

### ❓ Pending Learn Platform Response

1. **Work Day Numbering:** 
   - Should we query Learn API for attendance days? OR
   - Can we return chronological numbering and you map it?
   - If querying Learn API, what's the endpoint?

### For Learn Platform Team

**Immediate Actions (by Feb 3 EOD):**
1. Review this updated document
2. Answer the 6 pending questions (see "Pending Learn Platform Response" section)
3. Confirm you understand the answers we've provided
4. Provide any missing technical details (e.g., Learn API attendance endpoint)

**Optional:**
- 30-minute call on Feb 3 to clarify questions and align on scope

### For DPW Platform Team

**Starting Feb 3 (Regardless of Learn Response):**
1. ✅ Fix quality bonus bug (Day 1)
2. ✅ Create Module_Configs entry for mobile_mapping (Day 1)
3. ✅ Test quality bonus calculation with sample users (Day 1)

**Starting Feb 4 (After Learn Response):**
4. Build Payment Breakdown API
5. Build Performance Metrics API
6. Build Query/Ticketing System

---

## 📋 Response Template for Learn Platform

Please copy this and fill in your answers:

```
LEARN PLATFORM RESPONSES (Feb 2, 2026)

Q1: Work Day Numbering
[ ] We will query DPW for attendance days (provide endpoint: _______)
[ ] DPW can return chronological numbering (1, 2, 3...) and we'll map it
[ ] Other solution: ___________

Q2: Badge System Integration
[ ] Yes, we can calculate all badges from Performance + Payment APIs
[ ] No, we need these additional fields: ___________

Q3: Today's Stats
[ ] Real-time data required (query ODK directly)
[ ] Last-sync data acceptable (add last_updated timestamp)

Q4: Users Without Work (74 users currently)
[ ] Show empty data (0 earnings, message: "No work yet")
[ ] Hide from API entirely (return 404)
[ ] Show empty data + payment rules + settlement leaderboard

Q5: Query System Email Notifications
[ ] Yes, email DPW Managers at: ___________
[ ] No, managers will check dashboard manually

Q6: Query Attachment Storage
[ ] Google Drive (preferred)
[ ] Database (base64)
[ ] Other: ___________

Q7: Query Response Interface
[ ] DPW builds admin UI in Manager dashboard
[ ] Learn platform builds UI and forwards responses
[ ] Other: ___________

Q8: Query Category Routing
Payment disputes → DPW Managers
ODK technical issues → ___________
General questions → ___________

Q9: API Rate Limiting
[ ] Per API key (shared across all 181 youth)
[ ] Per youth user (181 users × limits)

Additional Notes:
___________________________________________
```

---

**Prepared By:** DPW Platform Development Team  
**Contact:** tech@spatialcollective.co.ke  
**Date:** February 2, 2026  
**Updated:** February 2, 2026 (Clarifications from DPW Manager)**
   - Email notifications to DPW Managers on new queries?
   - Attachment storage: Google Drive or database?
   - Should we build admin response UI or you handle it?
   - Who handles ODK technical issues vs payment disputes?

6. **API Rate Limiting:**
   - Per API key or per youth user?
   - Expecting parallel or sequential requests
## 🎯 Decisions Needed from Learn Platform

Please confirm/clarify:

1. **Payment Structure:** 760 KES or 500 KES base pay in API response?
2. **Work Day Numbering:** Critical or can use dates only?
3. **Badge System:** Confirm we skip Badge API endpoint?
4. **Query System Admin:** Who responds to queries (DPW/Learn/both)?
5. **Timeline:** Accept phased delivery or need all features by Feb 15?
6. **Today's Stats:** Real-time or last-sync data acceptable?
7. **Users Without Work:** Show empty data or hide from API entirely?

---

## 📧 Next Steps

**Immediate Actions:**
1. Learn Platform team reviews this document
2. Answers questions via email/meeting (by Feb 3)
3. We start bug fix + Phase 1 implementation

**Meeting Request:**
30-minute call on Feb 3 to clarify questions and align on scope?

---

**Prepared By:** DPW Platform Development Team  
**Contact:** tech@spatialcollective.co.ke  
**Date:** February 2, 2026

# Learn Platform Response to DPW Team

**Date:** February 2, 2026  
**From:** SC Learning Platform Team  
**To:** DPW Platform Team  

---

## ✅ Confirmed Decisions - Proceed with These

### 1. Payment Structure: 760 KES Base Pay ✅
**APPROVED.** Use production values:
- Base pay: 760 KES/day
- Quality bonus: 0-228 KES/day (30% max)
- Performance bonus: 0 (not used for mobile mapping)
- We'll update our UI mockups to reflect 760 KES

### 2. Badge System: Learn Platform Builds It ✅
**CONFIRMED.** Skip the `/api/v1/youth/{youth_id}/badges` endpoint entirely.
- Learn Platform will calculate badges from Performance + Payment API data
- We can derive all badge criteria from these two endpoints
- **No additional fields needed** - current spec is sufficient

### 3. Query System Admin: DPW Managers Handle All ✅
**CONFIRMED.** DPW Managers respond to all query types initially:
- Payment disputes → DPW Managers
- ODK technical issues → DPW Managers  
- General questions → DPW Managers
- (Can split responsibilities later if needed)

### 4. Timeline: Phased Delivery Approved ✅
**CONFIRMED.** Go with phased approach:
- **Phase 1 (Feb 3-10):** Payment + Performance APIs - CRITICAL
- **Phase 2 (Feb 11-17):** Query/Ticketing - IMPORTANT
- **Go-live Feb 21:** All 3 features must work

---

## 📋 Answers to Pending Questions

### Q1: Work Day Numbering ✅

**ANSWER:** **DPW can use chronological numbering (Option B)** - Learn Platform will map it.

**Rationale:**
- Learn Platform tracks attendance separately in `attendance_records` table
- Learn Platform tracks work output in `youth_work_days` table
- These are independent systems tracking different metrics

**What We Need from DPW:**
```json
{
  "daily_breakdown": [
    { "date": "2026-01-15", "pois_submitted": 45, "quality_score": 95.5, "earnings": 988.00 },
    { "date": "2026-01-16", "pois_submitted": 38, "quality_score": 87.2, "earnings": 912.00 },
    { "date": "2026-01-18", "pois_submitted": 52, "quality_score": 93.1, "earnings": 988.00 }
  ]
}
```

**What Learn Platform Will Do:**
- Display work days in chronological order on payment dashboard
- Show dates (not "Work Day 1, 2, 3...")
- Youth see: "Jan 15", "Jan 16", "Jan 18"
- No need for work day numbering from DPW side

**Technical Detail:** Learn's `youth_work_days` table has no relationship to DPW's Work_Ledger. They track different things:
- DPW Work_Ledger: ODK submissions, quality scores, payment calculations
- Learn youth_work_days: OSM building counts, digitization work tracking (not mobile mapping)

**Action for DPW:** Return dates only, ordered chronologically. No work day numbering needed.

---

### Q2: Today's Stats - Real-Time vs Last Sync ✅

**ANSWER:** **Last-sync data is acceptable** (Option B)

**Requirements:**
1. Include `last_updated` timestamp in response
2. Show how fresh the data is (e.g., "Updated 2 hours ago")
3. If data is >6 hours old, show warning in UI

**Example Response:**
```json
{
  "today_stats": {
    "date": "2026-02-02",
    "pois_submitted": 12,
    "quality_score": 95.5,
    "estimated_earnings": 750.00,
    "last_updated": "2026-02-02T14:30:00Z",
    "sync_status": "synced"  // or "pending_sync" if hours old
  }
}
```

**Learn Platform Will:**
- Show timestamp: "Last updated at 2:30 PM"
- Add refresh button for youth to trigger manual sync (if needed)
- Display "pending sync" badge if data is stale

---

### Q3: Users Without Work Data (74 users) ✅

**ANSWER:** **Show empty data + payment rules + settlement leaderboard**

**What to Return:**
```json
{
  "youth_id": "KAY2999XX",
  "settlement": "Kayole Soweto",
  "total_earnings": 0.00,
  "work_days_completed": 0,
  "daily_breakdown": [],
  "payment_formula": {
    "base_pay": 760,
    "quality_bonus_tiers": { "excellent": 0.30, "good": 0.20, "fair": 0.10 },
    "daily_target_pois": 50
  },
  "message": "No payment data available yet. Submit ODK forms to start earning!"
}
```

**Learn Platform Will:**
- Show encouraging message: "Start working to see your earnings!"
- Display payment rules and targets
- Show settlement leaderboard (so they see peers)
- Highlight that they need to submit ODK data

**User Experience:** Youth see what they CAN earn, not just "0".

---

### Q4: Performance API - Ranking Calculation ✅

**ANSWER:** Use DPW's recommendation with clarifications

**Ranking Formula:**
```
overall_score = (quality_score × 0.7) + (attendance_rate × 0.3)
```

**Attendance Calculation:**
- Use Work_Ledger days count (NOT Learn Platform API)
- Attendance rate = `(work_days_completed / total_work_days_expected) × 100`
- Example: User worked 8 days, expected 10 days → 80% attendance

**Ranking Rules:**
1. **Exclude users with 0 work days** (haven't started yet)
2. **Minimum 3 days** to appear on leaderboard (prevents 1-day outliers)
3. **Tiebreaker logic:**
   - 1st: overall_score (higher is better)
   - 2nd: total_pois_submitted (higher is better)
   - 3rd: earliest_submission_date (earlier is better)

**Settlement-Specific Rankings:**
- Kayole users compete with Kayole users only
- Kariobangi users compete with Kariobangi users only
- Huruma users compete with Huruma users only
- **NO cross-settlement leaderboards**

**Example Response:**
```json
{
  "settlement_ranking": {
    "settlement": "Kayole Soweto",
    "total_participants": 95,
    "youth_rank": 12,
    "top_10": [
      {
        "rank": 1,
        "youth_id": "KAY1234XX",
        "overall_score": 95.8,
        "quality_score": 96.2,
        "attendance_rate": 95.0,
        "total_pois": 450
      }
    ]
  }
}
```

---

### Q5: Query System - Email Notifications ✅

**ANSWER:** **Yes, email DPW Managers**

**Email Configuration:**
- Recipient: `tech@spatialcollective.co.ke`
- Trigger: When youth submits new query
- Template: "[DPW Query] New submission from {youth_id} - {category}"

**Email Content:**
```
New Query Submitted

Youth: KAY2544DG (Denis Gitahi)
Settlement: Kayole Soweto
Category: Payment Dispute
Priority: High
Subject: Missing quality bonus for Jan 15

Message:
I mapped 52 POIs on Jan 15 with 97% quality score.
Expected earnings: 988 KES (760 + 228 bonus)
Actual shown: 760 KES
Please check my payment.

Attachments: 1 (screenshot)

View in DPW Manager: https://app.spatialcollective.com/queries/abc123
```

**Frequency:** Immediate (within 5 minutes of submission)

---

### Q6: Query Attachment Storage ✅

**ANSWER:** **Google Drive (preferred)**

**Implementation:**
- Store attachments in Google Drive folder: `DPW_Queries/YYYY/MM/`
- Save file URL in database (not base64)
- Return Google Drive shareable link in API response

**Example:**
```json
{
  "query_id": "abc123",
  "attachments": [
    {
      "filename": "payment_screenshot.jpg",
      "url": "https://drive.google.com/file/d/.../view",
      "uploaded_at": "2026-02-02T10:30:00Z"
    }
  ]
}
```

**Benefits:**
- Smaller database
- Easy viewing for DPW Managers
- Existing integration already in place

---

### Q7: Query Response Interface ✅

**ANSWER:** **DPW builds admin UI in Manager dashboard**

**Workflow:**
1. Youth submits query via Learn Platform → DPW API
2. Email sent to `tech@spatialcollective.co.ke`
3. DPW Manager opens DPW Manager dashboard
4. Reviews query, views attachments, writes response
5. Marks as resolved in DPW Manager
6. Learn Platform fetches updates via `/api/v1/youth/{youth_id}/queries` endpoint

**What Learn Platform Needs:**
- `/api/v1/youth/{youth_id}/queries` endpoint returns all queries with statuses
- Real-time updates (youth refreshes page to see new responses)
- Push notifications can come later

**Division of Responsibility:**
- Learn Platform: Youth-facing query submission + viewing
- DPW Manager: Admin-facing query management + responses

---

### Q8: API Rate Limiting ✅

**ANSWER:** **Per API key (shared across all youth)**

**Rationale:**
- Learn Platform has 1 API key for all requests
- Learn Platform backend makes requests on behalf of youth
- Youth don't directly call DPW API (goes through Learn proxy)

**Rate Limits - Adjust These:**
- Payment API: ~~100~~ **300 requests/minute** (higher for dashboard loads)
- Performance API: ~~50~~ **100 requests/minute** (leaderboard popular)
- Query Submit: **10 requests/minute per youth** (track by youth_id in request body)
- Query List: **100 requests/minute** (shared)

**Usage Pattern:**
- 153 active mobile mappers
- Peak time: 8-10 AM (morning check-ins)
- ~50 concurrent users opening payment dashboard
- Need burst capacity for simultaneous loads

**Request:** Can we get higher limits for Payment + Performance APIs?

---

## 🚨 Critical Bug - Priority #1

### Quality Bonus Bug - MUST FIX FIRST ✅

**Impact:** 228 KES/day × 80 users × ~10 days = **182,400 KES owed to youth** 💰

**User Example:**
- Denis Gitahi (KAY2544DG)
- Quality: 97.3% (Excellent tier)
- Expected: 988 KES/day (760 + 228 bonus)
- Actual: 760 KES/day
- **Loss: 228 KES/day**

**What We Need:**
1. Fix quality bonus calculation in Work_Ledger sync (Day 1)
2. **Backfill historical bonuses** for all affected days (Day 1-2)
3. Confirm fix with test users before API launch

**Questions:**
1. Will you backfill bonuses automatically, or do we need manual adjustment?
2. When backfilled, will API show corrected historical earnings?
3. Should youth be notified of corrected payments?

**Timeline Impact:** This MUST be fixed before Payment API launches (Feb 6). Youth cannot see incorrect payment data.

---

## 🎯 Priority Order for DPW Team

### Week 1 (Feb 3-9)

**Day 1 (Feb 3) - CRITICAL:**
- [ ] Fix quality bonus bug
- [ ] Backfill historical bonuses
- [ ] Test with 3 sample users (Kayole, Kariobangi, Huruma)
- [ ] Create Module_Configs entry for mobile_mapping

**Days 2-4 (Feb 4-6):**
- [ ] Build Payment Breakdown API (`/api/v1/youth/{youth_id}/payment`)
- [ ] Test with 10 users (different settlements, work patterns)
- [ ] Handle edge cases (0 days, partial weeks)

**Days 5-7 (Feb 7-9):**
- [ ] Build Performance Metrics API (`/api/v1/youth/{youth_id}/performance`)
- [ ] Implement settlement-specific leaderboards
- [ ] Test ranking calculations with sample data

### Week 2 (Feb 10-17)

**Days 8-10 (Feb 10-12):**
- [ ] Build Query Submission API (`/api/v1/youth/{youth_id}/queries/submit`)
- [ ] Implement Google Drive attachment upload
- [ ] Set up email notifications

**Days 11-13 (Feb 13-15):**
- [ ] Build Query List API (`/api/v1/youth/{youth_id}/queries`)
- [ ] Build DPW Manager admin response UI
- [ ] Test end-to-end query workflow

**Days 14-15 (Feb 16-17):**
- [ ] Integration testing with Learn Platform staging
- [ ] Load testing (153 concurrent users)
- [ ] Bug fixes and edge cases

### Week 3 (Feb 18-21)

**Days 16-17 (Feb 18-19):**
- [ ] Production deployment
- [ ] Smoke testing in production
- [ ] Monitor error rates

**Day 18 (Feb 20):**
- [ ] Final QA
- [ ] Performance monitoring
- [ ] Hotfix any critical issues

**Day 19 (Feb 21):**
- [ ] **🚀 GO-LIVE**
- [ ] Enable for all 153 active mobile mappers
- [ ] Monitor closely for 24 hours

---

## 📊 Learn Platform Timeline (Parallel Work)

### Week 1 (Feb 3-9)
- [ ] Update UI mockups to 760 KES base pay
- [ ] Build API proxy routes (5 endpoints)
- [ ] Create WorkDashboardTabs component
- [ ] Wait for DPW staging API

### Week 2 (Feb 10-17)
- [ ] Build PaymentTab component (integrate with DPW Payment API)
- [ ] Build PerformanceTab component (integrate with DPW Performance API)
- [ ] Build ResolveCenterTab component (integrate with DPW Query APIs)
- [ ] Build badge system (client-side logic)
- [ ] Integration testing with DPW staging

### Week 3 (Feb 18-21)
- [ ] Final QA and bug fixes
- [ ] Production deployment
- [ ] Go-live monitoring

---

## 🔧 Technical Details for DPW Team

### API Authentication
- **Header:** `X-API-Key: <DPW_MANAGER_API_KEY>`
- **Format:** Same as existing `/api/external/dpw-sync` endpoint
- **Learn Platform IP:** (will provide for whitelisting if needed)

### Error Handling
**Standard Error Response:**
```json
{
  "error": {
    "code": "YOUTH_NOT_FOUND",
    "message": "Youth KAY9999XX not found in system",
    "details": "This youth_id does not exist in Work_Ledger",
    "timestamp": "2026-02-02T15:00:00Z"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid youth_id format)
- `401` - Unauthorized (invalid API key)
- `404` - Youth not found
- `429` - Rate limit exceeded
- `500` - Server error

### Required Response Headers
```
Content-Type: application/json
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1675350000
```

---

## ✅ What Learn Platform Will Provide

### 1. Staging Environment (by Feb 4)
- Staging URL for DPW to test against
- Test youth IDs with known data states
- API key for DPW → Learn communication (if needed)

### 2. Integration Testing Data (by Feb 10)
- 10 test youth IDs across settlements
- Various work patterns (0 days, partial, full)
- Edge cases for testing

### 3. Production Monitoring (Feb 21+)
- Error rate tracking
- Response time monitoring
- User feedback collection

---

## 📞 Communication & Meetings

### Immediate Actions (Feb 3)
- [x] Learn Platform sends this response
- [ ] DPW confirms receipt and understanding
- [ ] DPW starts quality bonus bug fix

### Optional Sync Meeting (Feb 4)
- **Duration:** 30 minutes
- **Agenda:**
  - Confirm quality bonus fix complete
  - Review API specifications
  - Discuss any blockers
  - Align on testing approach

### Weekly Check-ins
- **Monday Feb 10:** Phase 1 review (Payment + Performance APIs)
- **Monday Feb 17:** Phase 2 review (Query system)
- **Thursday Feb 20:** Pre-launch checklist

---

## ❓ Outstanding Questions for DPW Team

### Critical (Need Answer by Feb 3 EOD)
1. **Quality Bonus Backfill:** Will historical bonuses be automatically backfilled?
2. **Staging API Key:** When can we get staging credentials?
3. **Rate Limits:** Can we increase to 300/min (Payment) and 100/min (Performance)?

### Nice to Have (Answer by Feb 5)
1. **Email Service:** Which email service will DPW use for query notifications?
2. **Google Drive Folder:** Need permissions for Learn Platform to upload attachments
3. **Monitoring:** Do you want read-only access to Learn Platform error logs?

---

## 🎯 Success Criteria

### Phase 1 Success (Feb 10)
- [ ] Quality bonus bug fixed and verified
- [ ] Payment API returns accurate earnings for 10 test users
- [ ] Performance API shows correct settlement rankings
- [ ] API response time <500ms (95th percentile)
- [ ] Zero 500 errors during testing

### Phase 2 Success (Feb 17)
- [ ] Youth can submit queries with attachments
- [ ] DPW Managers receive email notifications
- [ ] Queries visible in DPW Manager dashboard
- [ ] End-to-end workflow tested (submit → respond → resolve)

### Go-Live Success (Feb 21)
- [ ] All 153 active mobile mappers can view payment data
- [ ] Settlement leaderboards accurate
- [ ] Query system functional
- [ ] <1% error rate in first 24 hours
- [ ] Positive youth feedback (informal survey)

---

## 🚀 Ready to Start?

**Green Light:** DPW team can start development immediately on:
1. ✅ Quality bonus bug fix (Day 1 priority)
2. ✅ Payment Breakdown API (use 760 KES base pay)
3. ✅ Performance Metrics API (settlement-specific rankings)

**Pending:** Query system specs confirmed, proceed after Payment/Performance APIs tested

**Next Step:** DPW team confirms:
- [ ] This response addresses all questions
- [ ] Timeline is feasible
- [ ] Quality bonus fix can start immediately

---

**Prepared By:** SC Learning Platform Team  
**Contact:** [Your Contact]  
**Date:** February 2, 2026  
**Status:** APPROVED - Start Development ✅

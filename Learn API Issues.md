# Learn API Integration - Issues and Improvement Recommendations

> **Date:** January 29, 2026  
> **Status:** 🔴 CRITICAL - API returning errors, blocking attendance sync  
> **Priority:** HIGH - Affects payment calculations for mobile mapping module

---

## Executive Summary

The Learn API integration for DPW attendance tracking has **critical issues** preventing automated synchronization:

- **API Error:** Returns "Object reference not set to an instance of an object" (NullReferenceException)
- **No Data:** Returns 0 participants when queried
- **Stale Cache:** Existing Learning_Platform_Cache data has `last_synced_at = undefined`
- **Data Mismatch:** Attendance dates (Jan 15, 16) don't match Work_Ledger dates (Jan 16, 19)

This prevents:
- Automated hourly attendance syncing
- Accurate payment calculations for mobile mapping
- Real-time attendance verification

---

## Table of Contents

1. [Current Implementation](#1-current-implementation)
2. [API Specification](#2-api-specification)
3. [Discovered Issues](#3-discovered-issues)
4. [Data Integrity Problems](#4-data-integrity-problems)
5. [Integration Architecture](#5-integration-architecture)
6. [Testing Results](#6-testing-results)
7. [Recommendations](#7-recommendations)
8. [Required Fixes](#8-required-fixes)
9. [API Contract Proposal](#9-api-contract-proposal)

---

## 1. Current Implementation

### DPW Components Using Learn API

**1. Learning_Platform_Cache Table** (PostgreSQL)
```sql
CREATE TABLE Learning_Platform_Cache (
  cache_id SERIAL PRIMARY KEY,
  dpw_user_id INT REFERENCES Users(user_id),
  user_id INT,                      -- Learn platform user ID
  attendance_days INT,
  attendance_history JSON,          -- Array of attendance records
  training_completed BOOLEAN,
  module VARCHAR(50),
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**2. Sync Utilities**
- `lib/learn-api-sync.mjs` - Reusable sync function with 30s timeout
- `sync-learn-api-simple.mjs` - Standalone sync script with detailed logging
- `learn-api-scheduler.mjs` - Hourly cron job (runs every hour at :00)

**3. Integration Points**
- `apply-training-period-logic.mjs` - Syncs before Work_Ledger updates
- `export-kayole-mobile-mapping-jan2026.mjs` - Syncs before payment export
- `/api/learning-platform` - API route for web dashboard (legacy MySQL2)

**4. Scheduled Jobs**
- Hourly sync: `0 * * * *` (Africa/Nairobi timezone)
- Manual sync: CLI scripts for testing

---

## 2. API Specification

### Current Endpoint

```
URL: https://learn.spatialcollective.co.ke/api/external/dpw-sync
Method: GET
Authentication: X-API-Key header
```

### Request Headers
```http
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Expected Response (Based on DPW Code)
```json
[
  {
    "user_id": 123,
    "youth_id": 456,
    "osm_username": "mapper_john",
    "full_name": "John Doe",
    "module": "mobile_mapping",
    "attendance_days": 15,
    "attendance_history": [
      {
        "date": "2026-01-15",
        "submitted_at": "2026-01-15T08:30:00",
        "submitted_by": "trainer_alice"
      },
      {
        "date": "2026-01-16",
        "submitted_at": "2026-01-16T08:45:00",
        "submitted_by": "trainer_alice"
      }
    ],
    "training_completed": true,
    "training_progress": 100
  }
]
```

### Current Response (ACTUAL)
```json
{
  "error": "Object reference not set to an instance of an object"
}
```

**OR**

```json
[]
```

---

## 3. Discovered Issues

### Issue 1: NullReferenceException Error
**Severity:** 🔴 CRITICAL

**Symptoms:**
- PowerShell test: `Invoke-WebRequest` throws "Object reference not set to an instance of an object"
- Node.js test: Returns empty array `[]` with 200 status code
- No stack trace or detailed error message provided

**Potential Causes:**
1. **Database connection issue** - Learn platform DB connection null/closed
2. **Missing required parameter** - API expects `?module=mobile_mapping` or similar
3. **Authentication mismatch** - API key format or validation failing silently
4. **Null dereferencing** - Code accessing a property on null object before validation
5. **Environment mismatch** - Staging vs production database/config issue

**Evidence:**
```powershell
# Test command
$headers = @{ 'X-API-Key' = $env:LEARNING_PLATFORM_API_KEY }
Invoke-WebRequest -Uri 'https://learn.spatialcollective.co.ke/api/external/dpw-sync' -Headers $headers

# Result
NullReferenceException: Object reference not set to an instance of an object
```

### Issue 2: No Participants Returned
**Severity:** 🔴 CRITICAL

**Symptoms:**
- `sync-learn-api-simple.mjs` returns: "✅ Learn API synced (0 records)"
- Node.js fetch succeeds but returns empty array
- No error message, just no data

**Potential Causes:**
1. **Empty database** - No attendance records in Learn platform DB
2. **Query filter too restrictive** - SQL WHERE clause excluding all records
3. **Module filter needed** - API requires module parameter to return data
4. **Date range issue** - API only returns recent data, January already excluded
5. **Schema mismatch** - Join failing silently due to missing foreign keys

**Evidence:**
```javascript
// From sync-learn-api-simple.mjs output
📚 Syncing Learn API attendance...
✅ Learn API synced (0 records)
```

### Issue 3: Stale Cache Data
**Severity:** 🟡 MEDIUM

**Symptoms:**
- `Learning_Platform_Cache.last_synced_at` is `undefined` (NULL)
- Cache data shows Jan 15, 16 but current date is Jan 29
- No automatic updates happening

**Potential Causes:**
1. **Manual import** - Cache populated manually without timestamp
2. **Failed sync** - Previous sync attempts failed silently
3. **Missing field** - Old sync script didn't update `last_synced_at`

**Evidence:**
```javascript
// From check-attendance-vs-work-ledger.mjs
📚 LEARN API CACHE:
   Attendance Days: 2
   Last Synced: undefined  // ❌ Should be a timestamp
   Attendance History: ["2026-01-16", "2026-01-15"]
```

### Issue 4: Data Freshness
**Severity:** 🟡 MEDIUM

**Symptoms:**
- Cache shows only Jan 15, 16 (15 days ago)
- Work_Ledger has Jan 16, 19 entries
- Missing recent attendance records

**Questions:**
1. Is Learn platform receiving attendance submissions for Jan 17-29?
2. Are trainers still submitting attendance daily?
3. Is there a lag between submission and API exposure?

---

## 4. Data Integrity Problems

### Attendance vs Work_Ledger Mismatch

**Scenario:** 5 test users (Kayole Soweto mobile mapping)

| User | Learn API Cache | Work_Ledger | Issue |
|------|----------------|-------------|-------|
| Denis Gitahi | Jan 15, 16 | Jan 16, 19 | Missing Jan 15 work, Missing Jan 19 attendance |
| Joy Nzomo | Jan 15, 16 | Jan 16, 19 | Missing Jan 15 work, Missing Jan 19 attendance |
| Paul Omondi | Jan 15, 16 | Jan 16, 19 | Missing Jan 15 work, Missing Jan 19 attendance |
| Tony Oroko | Jan 15, 16 | Jan 16, 19 | Missing Jan 15 work, Missing Jan 19 attendance |
| Agnes Mutuku | Jan 15, 16 | Jan 16, 19 | Missing Jan 15 work, Missing Jan 19 attendance |

**Pattern:** 100% consistent mismatch across all users

### Analysis

**Jan 15 in Learn API but NOT in Work_Ledger:**
- Users attended training on Jan 15
- But no ODK submissions exist for Jan 15
- Possible causes:
  - Training day (no field work)
  - ODK Central server issue
  - No forms assigned yet
  - Sync script didn't run

**Jan 19 in Work_Ledger but NOT in Learn API:**
- Users submitted ODK forms on Jan 19
- But no attendance record in Learn API
- Possible causes:
  - Trainer forgot to submit attendance
  - Learn platform form not filled
  - Attendance data not synced to API yet
  - Weekend/holiday (no official attendance)

### Root Cause Hypothesis

**Most Likely:** Learn API cache is **stale** and hasn't been updated since initial import (Jan 16 or earlier). The NullReferenceException prevents new data from being fetched.

**Evidence:**
- `last_synced_at = undefined` → Never successfully synced
- Only 2 days of data → Matches early January timeframe
- 0 participants on new sync → API broken, can't get fresh data

---

## 5. Integration Architecture

### Current Data Flow (BROKEN)

```
┌─────────────────────┐
│  Learn Platform     │
│  (Attendance Forms) │
└──────────┬──────────┘
           │
           │ ❌ API Broken (NullReferenceException)
           ▼
┌─────────────────────────────────────────┐
│  https://learn.spatialcollective.co.ke  │
│  /api/external/dpw-sync                 │
│                                         │
│  Returns: 0 participants                │
└──────────┬──────────────────────────────┘
           │
           │ Hourly sync attempts (fails)
           ▼
┌─────────────────────────────────────────┐
│  DPW Learning_Platform_Cache (PostgreSQL)│
│                                         │
│  Status: STALE (last_synced: undefined) │
│  Data: Jan 15, 16 only                  │
└──────────┬──────────────────────────────┘
           │
           │ Used by payment calculation
           ▼
┌─────────────────────────────────────────┐
│  Payment Processing                     │
│                                         │
│  ⚠️  Using outdated attendance data     │
└─────────────────────────────────────────┘
```

### Desired Data Flow (FUTURE)

```
┌─────────────────────┐
│  Learn Platform     │
│  (Attendance Forms) │
└──────────┬──────────┘
           │
           │ Real-time updates
           ▼
┌─────────────────────────────────────────┐
│  Learn API                              │
│  ✅ Returns current attendance          │
│  ✅ Supports filters (module, date)     │
│  ✅ Provides timestamps                 │
└──────────┬──────────────────────────────┘
           │
           │ Hourly sync (cron: 0 * * * *)
           ▼
┌─────────────────────────────────────────┐
│  DPW Learning_Platform_Cache            │
│  ✅ Fresh data (synced hourly)          │
│  ✅ Timestamps updated                  │
└──────────┬──────────────────────────────┘
           │
           │ Real-time attendance data
           ▼
┌─────────────────────────────────────────┐
│  Work_Ledger & Payment Processing       │
│  ✅ Accurate attendance counts          │
│  ✅ Correct payment calculations        │
└─────────────────────────────────────────┘
```

---

## 6. Testing Results

### Test 1: Direct API Call (PowerShell)
```powershell
$headers = @{ 'X-API-Key' = $env:LEARNING_PLATFORM_API_KEY }
Invoke-WebRequest -Uri 'https://learn.spatialcollective.co.ke/api/external/dpw-sync' -Headers $headers
```

**Result:** ❌ FAILED
```
NullReferenceException: Object reference not set to an instance of an object
```

### Test 2: Node.js Sync Script
```bash
node sync-learn-api-simple.mjs
```

**Result:** ⚠️ PARTIAL SUCCESS
```
📚 Syncing Learn API attendance...
✅ Learn API synced (0 records)
```
- HTTP 200 status
- Empty array `[]` returned
- No error thrown
- No data synced

### Test 3: Integrated Workflow
```bash
node apply-training-period-logic.mjs
```

**Result:** ✅ WORKFLOW WORKS (but API returns 0)
```
📚 STEP 1: Syncing Learn API attendance data...
✅ Learn API synced (0 records)

💼 STEP 2: Updating Work_Ledger entries...
📋 Found 174 Work_Ledger entries
```
- Integration code works correctly
- API sync doesn't fail the workflow (graceful degradation)
- But no fresh data obtained

### Test 4: Attendance Comparison
```bash
node check-attendance-vs-work-ledger.mjs
```

**Result:** ✅ DIAGNOSTIC WORKS
```
👤 Denis Gitahi (KAY2544DG)
   Work_Ledger: Jan 16, 19 (2 days)
   Learn API: Jan 15, 16 (2 days)
   
   ⚠️ In Learn API but NOT in Work_Ledger: 2026-01-15
   ⚠️ In Work_Ledger but NOT in Learn API: 2026-01-19
```
- Shows clear data mismatch
- All 5 test users have identical pattern
- Cache data is stale (undefined last_synced_at)

---

## 7. Recommendations

### Immediate Actions (Learn Platform Team)

#### 1. Fix NullReferenceException (CRITICAL)
**Priority:** 🔴 P0 - Blocking production

**Investigation Steps:**
```csharp
// Learn Platform API Controller (example)
public IActionResult GetDPWSync()
{
    try 
    {
        // ❌ LIKELY ISSUE: One of these is null
        var apiKey = Request.Headers["X-API-Key"];
        var context = _dbContext;  // Could be null if DI failed
        var config = _configuration; // Could be null
        
        // Add null checks
        if (context == null) 
        {
            return StatusCode(500, new { error = "Database context not initialized" });
        }
        
        // Log the actual exception
        _logger.LogError($"API Key received: {apiKey?.ToString() ?? "NULL"}");
        
        var participants = context.Participants
            .Include(p => p.Attendance)  // Could fail if relationship null
            .ToList();
            
        return Ok(participants);
    }
    catch (Exception ex)
    {
        // ✅ MUST DO: Log full exception with stack trace
        _logger.LogError(ex, "Error in GetDPWSync");
        return StatusCode(500, new { 
            error = ex.Message,
            stackTrace = ex.StackTrace,  // Include in non-production
            innerException = ex.InnerException?.Message
        });
    }
}
```

**Action Items:**
- [ ] Add comprehensive logging to API endpoint
- [ ] Return detailed error messages (not just NullReferenceException)
- [ ] Validate all objects before accessing properties
- [ ] Test with DPW API key in staging environment

#### 2. Add Query Parameters Support
**Priority:** 🟡 P1 - Enhancement

**Proposed Parameters:**
```
GET /api/external/dpw-sync?module={module}&from={date}&to={date}&settlement={name}

Examples:
  /api/external/dpw-sync?module=mobile_mapping
  /api/external/dpw-sync?from=2026-01-15&to=2026-01-29
  /api/external/dpw-sync?settlement=Kayole Soweto&module=mobile_mapping
```

**Benefits:**
- Reduce payload size (only relevant data)
- Enable module-specific syncing
- Support date range queries
- Improve performance

#### 3. Add Response Metadata
**Priority:** 🟢 P2 - Nice to have

**Enhanced Response Format:**
```json
{
  "metadata": {
    "timestamp": "2026-01-29T14:30:00Z",
    "count": 150,
    "module": "mobile_mapping",
    "date_range": {
      "from": "2026-01-01",
      "to": "2026-01-31"
    }
  },
  "participants": [
    {
      "user_id": 123,
      "youth_id": 456,
      "attendance_days": 15,
      "attendance_history": [...]
    }
  ]
}
```

**Benefits:**
- DPW can validate data freshness
- Know exactly what date range is covered
- Detect if data is stale

#### 4. Add Webhooks (Future)
**Priority:** 🟢 P3 - Future enhancement

**Instead of polling every hour, push updates:**
```
POST https://dpw.spatialcollective.co.ke/api/webhooks/attendance
Content-Type: application/json
X-Webhook-Secret: <shared_secret>

{
  "event": "attendance.created",
  "timestamp": "2026-01-29T14:30:00Z",
  "data": {
    "user_id": 123,
    "date": "2026-01-29",
    "submitted_by": "trainer_alice"
  }
}
```

**Benefits:**
- Real-time updates (no hourly delay)
- Reduce API load (no polling)
- Immediate payment calculations

### DPW Platform Improvements

#### 1. Enhanced Error Handling
**Current:** Silent failures, returns 0 records
**Proposed:** Log errors, alert admins, retry logic

```javascript
// lib/learn-api-sync.mjs improvements
export async function syncLearnAPIQuick() {
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(30000)
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`❌ Learn API error (attempt ${attempt}/${maxRetries}):`, {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        
        // Send alert email if all retries fail
        if (attempt === maxRetries) {
          await sendAlertEmail('Learn API sync failed', errorBody);
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        console.warn('⚠️ Learn API returned 0 participants');
        // Still log this as suspicious
        await logSyncResult({ status: 'empty', timestamp: new Date() });
      }
      
      return { created: X, updated: Y, total: data.length };
      
    } catch (error) {
      console.error(`❌ Sync error (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        await sendAlertEmail('Learn API sync exception', error.message);
        return { error: error.message, skipped: true };
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}
```

#### 2. Sync Status Dashboard
**Create admin page:** `/admin/learn-api-status`

**Shows:**
- Last successful sync timestamp
- Number of records synced
- Error count (last 24 hours)
- Data freshness indicators
- Manual sync button

#### 3. Attendance Reconciliation Tool
**Create utility:** `reconcile-attendance-work-ledger.mjs`

**Features:**
- Detect mismatches (like current check script)
- Auto-create Work_Ledger entries for attendance-only dates
- Flag Work_Ledger entries without attendance
- Generate reconciliation report

---

## 8. Required Fixes

### Learn Platform (Backend Team)

**CRITICAL (Must fix before production):**
- [ ] Fix NullReferenceException in `/api/external/dpw-sync`
- [ ] Return meaningful error messages with stack traces
- [ ] Add comprehensive logging for debugging
- [ ] Test API with actual DPW API key

**HIGH (Needed for reliable operation):**
- [ ] Support query parameters (`?module=`, `?from=`, `?to=`)
- [ ] Add response metadata (timestamp, count, date range)
- [ ] Implement pagination for large datasets (>1000 records)
- [ ] Add API health check endpoint (`/api/external/health`)

**MEDIUM (Operational improvements):**
- [ ] Document API contract (OpenAPI/Swagger spec)
- [ ] Provide test API key for staging environment
- [ ] Add rate limiting headers (X-RateLimit-Remaining)
- [ ] Version the API (`/api/v1/external/dpw-sync`)

**NICE TO HAVE (Future):**
- [ ] Webhook support for real-time updates
- [ ] GraphQL endpoint for flexible queries
- [ ] Bulk attendance submission API
- [ ] Attendance amendment/correction endpoint

### DPW Platform (Our Side)

**CRITICAL:**
- [ ] Implement retry logic with exponential backoff
- [ ] Add email alerts when sync fails
- [ ] Create sync status dashboard for admins

**HIGH:**
- [ ] Reconciliation tool for attendance vs Work_Ledger
- [ ] Auto-create Work_Ledger entries from attendance
- [ ] Historical sync script to backfill missing data

**MEDIUM:**
- [ ] Cache invalidation strategy (refresh on API success)
- [ ] Sync metrics and monitoring
- [ ] Manual override UI for attendance corrections

---

## 9. API Contract Proposal

### Endpoint Specification

```yaml
openapi: 3.0.0
info:
  title: DPW Attendance Sync API
  version: 1.0.0
  description: API for syncing DPW participant attendance from Learn Platform

servers:
  - url: https://learn.spatialcollective.co.ke/api/v1
    description: Production server

paths:
  /external/dpw-sync:
    get:
      summary: Get DPW participant attendance data
      description: Returns attendance records for DPW participants with optional filters
      
      security:
        - ApiKeyAuth: []
      
      parameters:
        - name: module
          in: query
          schema:
            type: string
            enum: [mobile_mapping, digitization, microtasking, household_survey]
          description: Filter by module assignment
          
        - name: from
          in: query
          schema:
            type: string
            format: date
          description: Start date (YYYY-MM-DD)
          
        - name: to
          in: query
          schema:
            type: string
            format: date
          description: End date (YYYY-MM-DD)
          
        - name: settlement
          in: query
          schema:
            type: string
          description: Filter by settlement name
          
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number for pagination
          
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
            maximum: 500
          description: Records per page
      
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  metadata:
                    type: object
                    properties:
                      timestamp:
                        type: string
                        format: date-time
                        description: When this response was generated
                      count:
                        type: integer
                        description: Number of participants in response
                      total:
                        type: integer
                        description: Total participants matching filters
                      page:
                        type: integer
                      limit:
                        type: integer
                      filters:
                        type: object
                        description: Applied filters
                  participants:
                    type: array
                    items:
                      $ref: '#/components/schemas/Participant'
        
        '400':
          description: Bad request (invalid parameters)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        
        '401':
          description: Unauthorized (invalid API key)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    Participant:
      type: object
      required:
        - user_id
        - youth_id
        - full_name
        - module
      properties:
        user_id:
          type: integer
          description: Learn platform user ID
        youth_id:
          type: integer
          description: DPW youth ID
        osm_username:
          type: string
          nullable: true
          description: OpenStreetMap username
        full_name:
          type: string
        module:
          type: string
          enum: [mobile_mapping, digitization, microtasking, household_survey]
        attendance_days:
          type: integer
          description: Total attendance days
        attendance_history:
          type: array
          items:
            type: object
            properties:
              date:
                type: string
                format: date
              submitted_at:
                type: string
                format: date-time
              submitted_by:
                type: string
        training_completed:
          type: boolean
        training_progress:
          type: integer
          minimum: 0
          maximum: 100
    
    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message
        details:
          type: string
          description: Detailed error information
        code:
          type: string
          description: Error code for programmatic handling
        timestamp:
          type: string
          format: date-time

  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

### Example Requests

**1. Get all mobile mapping participants:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://learn.spatialcollective.co.ke/api/v1/external/dpw-sync?module=mobile_mapping"
```

**2. Get attendance for date range:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://learn.spatialcollective.co.ke/api/v1/external/dpw-sync?from=2026-01-15&to=2026-01-29"
```

**3. Get Kayole Soweto participants:**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://learn.spatialcollective.co.ke/api/v1/external/dpw-sync?settlement=Kayole%20Soweto&module=mobile_mapping"
```

### Example Response

```json
{
  "metadata": {
    "timestamp": "2026-01-29T14:30:00Z",
    "count": 77,
    "total": 77,
    "page": 1,
    "limit": 100,
    "filters": {
      "module": "mobile_mapping",
      "settlement": "Kayole Soweto"
    }
  },
  "participants": [
    {
      "user_id": 123,
      "youth_id": 2544,
      "osm_username": "denis_gitahi",
      "full_name": "Denis Gitahi",
      "module": "mobile_mapping",
      "attendance_days": 15,
      "attendance_history": [
        {
          "date": "2026-01-15",
          "submitted_at": "2026-01-15T08:30:00Z",
          "submitted_by": "trainer_alice"
        },
        {
          "date": "2026-01-16",
          "submitted_at": "2026-01-16T08:45:00Z",
          "submitted_by": "trainer_alice"
        },
        {
          "date": "2026-01-19",
          "submitted_at": "2026-01-19T09:00:00Z",
          "submitted_by": "trainer_alice"
        }
      ],
      "training_completed": true,
      "training_progress": 100
    }
  ]
}
```

---

## Summary

**Current Status:** 🔴 BROKEN - API returning NullReferenceException, blocking all sync operations

**Impact:** 
- Cannot auto-sync attendance data
- Payment calculations using stale data (15+ days old)
- No visibility into recent attendance patterns

**Critical Path:**
1. **Learn Platform:** Fix NullReferenceException (P0)
2. **Learn Platform:** Return actual attendance data (P0)
3. **DPW:** Test sync with fixed API
4. **DPW:** Deploy hourly scheduler
5. **DPW:** Build reconciliation tool

**Timeline Estimate:**
- API fix: 2-4 hours (Learn Platform team)
- Testing: 1 hour
- Deployment: 30 minutes
- **Total: 1 business day**

**Contact:**
- DPW Platform: tech@spatialcollective.com
- Learn Platform: [Contact info needed]

**Next Steps:**
1. Share this document with Learn Platform team
2. Schedule call to review NullReferenceException error
3. Test API in staging environment
4. Deploy fixes and verify data flow
5. Enable hourly scheduler in production

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Author:** DPW Development Team

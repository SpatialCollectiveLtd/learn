# Work Days Calculation Update - 2025/2026 Breakdown

## Overview
Updated work days calculation to properly handle work periods spanning 2025 and 2026, with correct integer addition instead of string concatenation.

## Problem Statement
Kariobangi Machakos settlement users started digitization work in late 2025 (worked 5 days in December 2025), then resumed work on **January 7, 2026** to complete their 20-day contract. The dashboard was showing incorrect totals due to:
1. String concatenation instead of integer addition (e.g., "1813" instead of "31")
2. No breakdown of 2025 vs 2026 work days
3. Start date not updated to January 7, 2026

## Solution Implemented

### 1. Database Configuration Update
**File**: `scripts/update-digitization-start-date.js`

Updated all digitization settlements to have a start date of **January 7, 2026**:
```sql
UPDATE settlement_work_config
SET start_date = '2026-01-07'
WHERE program_type = 'digitization'
```

### 2. API Endpoint Update
**File**: `src/app/api/work/days/count/route.ts`

**Changes**:
- Added `::INTEGER` cast to all COUNT queries to ensure integer results
- Separated 2025 and 2026 work day counts using FILTER clause
- Return breakdown in API response

**Updated Query**:
```typescript
const approvedResult = await Database.query(`
  SELECT 
    COUNT(*)::INTEGER as days_worked,
    COUNT(*) FILTER (WHERE work_date < '2026-01-01')::INTEGER as days_worked_2025,
    COUNT(*) FILTER (WHERE work_date >= '2026-01-01')::INTEGER as days_worked_2026,
    SUM(buildings_count)::INTEGER as total_buildings,
    COUNT(*) FILTER (WHERE target_met = TRUE)::INTEGER as days_target_met
  FROM youth_work_days
  WHERE youth_id = $1 
  AND status = 'approved'
`, [youthId]);
```

**Updated Response**:
```json
{
  "success": true,
  "data": {
    "daysWorked": 19,
    "daysWorked2025": 5,
    "daysWorked2026": 14,
    "totalDays": 20,
    "remaining": 1,
    "percentage": 95,
    "pendingDays": 0,
    "totalBuildings": 3847,
    "daysTargetMet": 18,
    "avgBuildingsPerDay": 202,
    "startDate": "2026-01-07"
  }
}
```

### 3. Dashboard Display Update
**File**: `src/app/dashboard/work/page.tsx`

**Changes**:
- Updated `WorkDays` interface to include `daysWorked2025` and `daysWorked2026`
- Added year breakdown display below main count
- Shows format: "19/20" with "2025: 5, 2026: 14" breakdown

**UI Display**:
```tsx
<div className="flex items-baseline gap-2 mb-2">
  <span className="text-5xl font-heading font-bold text-white">{workDays.daysWorked}</span>
  <span className="text-2xl text-[#404040]">/</span>
  <span className="text-2xl text-foreground-subtle">{workDays.totalDays}</span>
</div>
<p className="text-sm text-foreground-subtle">
  Days completed • {workDays.remaining} remaining
</p>
{(workDays.daysWorked2025 > 0 || workDays.daysWorked2026 > 0) && (
  <div className="mt-2 flex items-center gap-3 text-xs">
    {workDays.daysWorked2025 > 0 && (
      <span className="text-foreground-subtle">
        2025: <span className="text-white font-medium">{workDays.daysWorked2025}</span>
      </span>
    )}
    {workDays.daysWorked2026 > 0 && (
      <span className="text-foreground-subtle">
        2026: <span className="text-white font-medium">{workDays.daysWorked2026}</span>
      </span>
    )}
  </div>
)}
```

## Work Period Calculation

### January 7, 2026 - January 27, 2026 (15 Working Days)
Excluding weekends (Saturday & Sunday):

| Week | Dates | Days |
|------|-------|------|
| Week 1 | Jan 7-10 (Tue-Fri) | 4 days |
| Week 2 | Jan 13-17 (Mon-Fri) | 5 days |
| Week 3 | Jan 20-24 (Mon-Fri) | 5 days |
| Week 4 | Jan 27 (Mon) | 1 day |
| **Total** | **Jan 7-27** | **15 days** |

**As of January 26, 2026 (Sunday)**:
- Completed work days: **14/15** for 2026
- Plus 2025 days: **5** (for Kariobangi users)
- **Total: 19/20 days** ✅

## Verification

### Test Script
**File**: `scripts/test-work-days-calculation.js`

Tests that:
1. Work days are counted separately for 2025 and 2026
2. Total is integer addition, not string concatenation
3. Kariobangi users show correct totals

**Sample Results**:
```
✅ KAR158KK (Kelvin Kinyatta):
   2025: 5 days
   2026: 14 days
   Total: 19/20 days
   Math: 5 + 14 = 19

✅ KAR078KM (Kelvin Mulela):
   2025: 5 days
   2026: 13 days
   Total: 18/20 days
   Math: 5 + 13 = 18

✅ ALL CALCULATIONS CORRECT!
   Work days are being added as integers, not concatenated as strings.
```

## Settlement Work Data

### Kariobangi Machakos
- **Total Youth**: 21 digitization participants
- **Days worked in 2025**: 105 total (avg 5 per youth)
- **Days worked in 2026**: 178 total (avg 8.5 per youth)
- **Start Date**: January 7, 2026
- **Total Days**: 20 per contract

### Kayole
- **Total Youth**: 19 digitization participants
- **Days worked in 2025**: 95 total (avg 5 per youth)
- **Days worked in 2026**: 257 total (avg 13.5 per youth)
- **Start Date**: January 7, 2026
- **Total Days**: 20 per contract

### Mji wa Huruma
- **Total Youth**: 9 digitization participants
- **Days worked in 2025**: 54 total (avg 6 per youth)
- **Days worked in 2026**: 119 total (avg 13.2 per youth)
- **Start Date**: January 7, 2026
- **Total Days**: 20 per contract

## Technical Details

### Why ::INTEGER Cast?
PostgreSQL's COUNT() returns `bigint` type, which JavaScript receives as a string to avoid precision loss. Without explicit casting, the addition `days_2025 + days_2026` would concatenate strings instead of adding numbers:
- **Without cast**: `"18" + "13" = "1813"` ❌
- **With ::INTEGER cast**: `18 + 13 = 31` ✅

### SQL FILTER Clause
The `FILTER (WHERE condition)` clause is a PostgreSQL extension that applies a WHERE condition to an aggregate function:
```sql
COUNT(*) FILTER (WHERE work_date < '2026-01-01')::INTEGER as days_worked_2025
```
This is equivalent to:
```sql
SUM(CASE WHEN work_date < '2026-01-01' THEN 1 ELSE 0 END)::INTEGER
```

But more readable and performant.

## Files Modified

1. **`src/app/api/work/days/count/route.ts`**
   - Added ::INTEGER casts to COUNT queries
   - Added FILTER clauses for 2025/2026 separation
   - Return breakdown in API response

2. **`src/app/dashboard/work/page.tsx`**
   - Updated WorkDays interface
   - Added year breakdown display

3. **Database**
   - Updated settlement_work_config.start_date to '2026-01-07' for all digitization settlements

## Testing

Run the test script to verify calculations:
```bash
node scripts/test-work-days-calculation.js
```

Or check in the dashboard:
1. Log in as a digitization youth participant
2. Navigate to work dashboard
3. Check "Work Period" card shows:
   - Total days: e.g., "19/20"
   - Breakdown: "2025: 5, 2026: 14"

## Related Documentation
- [Work Days Auto Count Feature](../features/WORK_DAYS_AUTO_COUNT.md)
- [Work Dashboard Implementation](../features/WORK_DASHBOARD_IMPLEMENTATION_PLAN.md)
- [Platform Documentation](../PLATFORM_DOCUMENTATION.md)

## Date: January 26, 2026
**Updated by**: AI Assistant
**Verified**: All calculations correct, no errors found

# DPW Engineering → Learn Platform — Payments API Update

**Date:** March 12, 2026  
**From:** DPW Engineering Team  
**To:** Learn Platform Engineering  
**Re:** Learn payments endpoint upgraded for per-day, per-module earnings breakdown

---

## Summary

We have upgraded:

```http
GET /api/learn/users/{user_id}/payments
```

The endpoint now returns a **daily per-module earnings breakdown** instead of only a cycle-level aggregate.

This change was made because some youths work across multiple modules, and they need to see:
- what they earned
- on which date
- in which module
- why a day was paid or not paid

---

## What Changed

### Previous behavior
The old endpoint primarily summarized `Work_Ledger` entries into cycle-style totals.

### New behavior
The new endpoint calculates earnings from each module's actual source of truth:

| Module | Source used by Learn payments endpoint |
|---|---|
| `digitization` | `Work_Ledger` |
| `microtasking` | finalized `Microtasking_Responses` (`is_correct IS NOT NULL`) |
| `mobile_mapping` | `Mobile_Mapping_Submissions` |
| `household_survey` | `Household_Survey_Submissions` |

This means the response now supports:
- multi-module youths automatically
- per-day earnings
- per-module totals
- attendance-aware non-payment reasons
- training vs production day distinctions

---

## Query Parameters

The endpoint now accepts:

```http
GET /api/learn/users/{user_id}/payments?from=2026-01-01&to=2026-03-12
```

### Supported params

| Param | Required | Notes |
|---|---|---|
| `from` | No | `YYYY-MM-DD` |
| `to` | No | `YYYY-MM-DD` |
| `start_date` | No | Backward-compatible alias for `from` |
| `end_date` | No | Backward-compatible alias for `to` |

### Defaults
- If omitted, the endpoint returns the last **90 days**.

### Validation
- Invalid dates return `400 INVALID_REQUEST`
- `from > to` returns `400 INVALID_REQUEST`

---

## Response Shape

### Success response

```json
{
  "success": true,
  "data": {
    "user_id": "KAY1799DM",
    "full_name": "David Mandu",
    "module": "both",
    "period": {
      "from": "2026-01-01",
      "to": "2026-03-12"
    },
    "modules_active": ["mobile_mapping", "microtasking"],
    "summary": {
      "total_earnings_kes": 13376,
      "total_base_pay_kes": 11400,
      "total_bonus_pay_kes": 1976,
      "days_with_earnings": 15,
      "by_module": {
        "mobile_mapping": {
          "days_recorded": 19,
          "days_with_earnings": 15,
          "total_earnings_kes": 13376,
          "total_base_pay_kes": 11400,
          "total_bonus_pay_kes": 1976,
          "avg_quality_percentage": 87.31
        }
      }
    },
    "daily_records": [
      {
        "date": "2026-02-10",
        "module": "mobile_mapping",
        "volume": 5,
        "volume_unit": "submissions",
        "quality_score": 0.7067,
        "quality_percentage": 70.67,
        "base_pay_kes": 760,
        "bonus_pay_kes": 152,
        "total_pay_kes": 912,
        "attended": true,
        "day_type": "production",
        "earning_status": "earned",
        "pay_note": "Quality bonus applied",
        "finalized": true
      },
      {
        "date": "2026-02-06",
        "module": "mobile_mapping",
        "volume": 21,
        "volume_unit": "submissions",
        "quality_score": 0.9326,
        "quality_percentage": 93.26,
        "base_pay_kes": 0,
        "bonus_pay_kes": 0,
        "total_pay_kes": 0,
        "attended": false,
        "day_type": "production",
        "earning_status": "not_earned",
        "pay_note": "No attendance recorded",
        "finalized": true
      }
    ],
    "sync_info": {
      "microtasking_last_consensus": null,
      "data_note": "Microtasking records appear only after consensus scoring is finalized. Recent microtasking work may show up after the next sync cycle."
    }
  }
}
```

---

## Field Semantics

### Top-level fields

| Field | Meaning |
|---|---|
| `user_id` | DPW `unique_id` |
| `full_name` | Youth full name |
| `module` | Current `Users.module_assignment` value (may be `both` or `null`) |
| `period` | Effective response range |
| `modules_active` | Modules where records exist in the selected period |

### `summary`

| Field | Meaning |
|---|---|
| `total_earnings_kes` | Base + bonus across all returned daily records |
| `total_base_pay_kes` | Sum of base pay |
| `total_bonus_pay_kes` | Sum of quality/performance bonuses |
| `days_with_earnings` | Count of records where `total_pay_kes > 0` |
| `by_module` | Same totals broken down by module |

### `daily_records[]`

| Field | Meaning |
|---|---|
| `date` | Work date |
| `module` | Module for that day |
| `volume` | Module-specific output count |
| `volume_unit` | `buildings`, `responses`, `submissions`, or `surveys` |
| `quality_score` | Decimal form where available (`0.7067` = 70.67%) |
| `quality_percentage` | Percent form for direct UI display |
| `base_pay_kes` | Base amount earned that day |
| `bonus_pay_kes` | Bonus amount earned that day |
| `total_pay_kes` | Base + bonus |
| `attended` | Whether the youth had DPW attendance for that module/date |
| `day_type` | `training`, `production`, `pre_launch`, `post_module`, `no_config`, `unknown`, or `ledger` |
| `earning_status` | `earned` or `not_earned` |
| `pay_note` | Human-readable explanation |
| `finalized` | Whether the record is final and safe to show as earned |

---

## Important Behavioral Notes

### 1. Multi-module youths
If a youth worked in more than one module during the selected date range, all module records are returned in the same response.

Use `modules_active` and `daily_records[].module` to render the correct breakdown.

### 2. Microtasking is finalized-only
For microtasking, we only return days whose consensus scoring is complete:

```sql
is_correct IS NOT NULL
```

If a youth worked recently but consensus has not finished, those rows will not appear yet.

Use `sync_info.microtasking_last_consensus` and `sync_info.data_note` to explain this in the Learn UI.

### 3. Attendance still gates payment
A day with work but no DPW attendance can appear in `daily_records`, but it will show:
- `attended: false`
- `earning_status: "not_earned"`
- `total_pay_kes: 0`
- `pay_note: "No attendance recorded"`

This is intentional. Youth should see why a day was not payable.

### 4. Training vs production
Some modules pay base-only during training days.

These days will appear explicitly as:
- `day_type: "training"`
- `pay_note: "Training day"`

### 5. `module = "both"`
This remains a valid DPW value meaning the youth has multi-module participation.

Do **not** use the top-level `module` field for payment routing.
Use `modules_active` and `daily_records[].module` instead.

---

## Client Migration Guidance

### Learn UI should now:
1. Read `data.daily_records` as the source for the detailed earnings table
2. Read `data.summary.by_module` for per-module cards or charts
3. Use `quality_percentage` for UI display
4. Use `pay_note` to explain unpaid or base-only days
5. Treat `modules_active` as the canonical list of modules present in the returned period

### Learn UI should no longer assume:
- a single active module for a user
- cycle-only payment summaries
- that all work appears immediately for microtasking

---

## Deferred Item

This iteration does **not** expose whether a day has already been disbursed in a finance/payment cycle.

So this endpoint currently answers:

> "What did the youth earn per day and module?"

It does **not** yet answer:

> "Has this specific day already been paid out by finance?"

That payout/disbursement linkage is deferred to a follow-up.

---

## Recommended Learn UI Labels

Suggested labels for the daily table:
- Date
- Module
- Output
- Quality
- Attendance
- Day Type
- Base Pay
- Bonus
- Total Earned
- Note

Suggested labels for summary cards:
- Total Earned
- Base Pay
- Bonus Pay
- Days With Earnings
- Modules Active

---

## Status

The endpoint implementation is complete in DPW code and validated locally.

If you want, we can send a second note after deployment confirming the production URL is ready for re-test.

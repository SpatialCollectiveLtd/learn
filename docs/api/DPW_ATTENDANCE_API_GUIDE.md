# DPW Attendance API Guide: Reading Mobile Mapping Data

**API version:** `2.1-program-transfer-fix`  
**Endpoint:** `https://learn.spatialcollective.co.ke/api/external/dpw-sync`  
**Last updated:** February 2026

---

## Why You See 74 vs 100 Mobile Mapping Participants

This is the most important thing to understand about the API.

Some youth worked as **mobile mappers first, then transferred to microtasking** partway through the project. Their current profile says `microtasking`, but their attendance from before the transfer is correctly recorded as `mobile_mapping`.

| Query | What it returns | Why |
|-------|----------------|-----|
| No filter (all participants) — `statistics` section | **74** mobile mapping | Groups by **current** program type |
| `?module=mobile_mapping` — `participants` list | **100** mobile mapping | Includes anyone who **ever attended** as a mobile mapper |

**For payment purposes, always use `?module=mobile_mapping`.** This is the correct query that shows everyone who did mobile mapping work, regardless of what program they are currently in.

---

## The Feb 9–20 Attendance Explained

The "2-day Kayole run" you observed is correct for Kayole Soweto — their mapping cycle ended Feb 9–10. Huruma and Kariobangi did **not** map in that window; they mapped earlier and transferred to microtasking before Feb 9.

Here is the full breakdown of mobile mapping attendance by settlement:

| Settlement | Active Dates | Youth Count | Notes |
|-----------|-------------|-------------|-------|
| Kayole Soweto | Jan 13 – Feb 9 | 60 youth | Still active in mobile_mapping |
| Mji wa Huruma | Jan 21 – Feb 12 | 15 youth | Transferred to microtasking after Feb 12 |
| Kariobangi Machakos | Jan 25 – Feb 15 | 25 youth | Transferred to microtasking after Feb 15 |

So the picture for Feb 9–20 is:
- **Feb 9–10**: Kayole Soweto (53–54 youth per day) ✅
- **Feb 10–12**: Mji wa Huruma (13 youth per day) ✅
- **Feb 10–15**: Kariobangi Machakos (23 youth per day) ✅

These are all visible in the API when you query `?module=mobile_mapping`.

---

## How to Query Attendance Data

### 1. All mobile mapping participants and their attendance history

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping"
```

Each participant in the response includes an `attendance_history` array. Filter it on your side for whichever date range you need:

```json
{
  "youth_id": "HUR792SW",
  "full_name": "Susan Wanja",
  "module": "microtasking",
  "settlement": "Mji wa Huruma",
  "attendance_days": 14,
  "attendance_history": [
    { "date": "2026-02-12", "program_type": "mobile_mapping", "day_of_week": 4 },
    { "date": "2026-02-11", "program_type": "mobile_mapping", "day_of_week": 3 },
    { "date": "2026-02-10", "program_type": "mobile_mapping", "day_of_week": 2 },
    { "date": "2026-02-09", "program_type": "mobile_mapping", "day_of_week": 1 },
    "..."
  ]
}
```

> **Note:** `module` shows the youth's **current** program type (`microtasking`). All entries in `attendance_history` will be `mobile_mapping` because the `?module=mobile_mapping` filter scopes the history to mobile mapping days only.

### 2. Individual youth lookup

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://learn.spatialcollective.co.ke/api/external/dpw-sync?youth_id=HUR792SW"
```

This returns all attendance across all program types, with each record showing its `program_type`:

```json
"attendance_history": [
  { "date": "2026-02-17", "program_type": "microtasking" },
  { "date": "2026-02-16", "program_type": "microtasking" },
  { "date": "2026-02-15", "program_type": "microtasking" },
  { "date": "2026-02-12", "program_type": "mobile_mapping" },
  { "date": "2026-02-11", "program_type": "mobile_mapping" }
]
```

This lets you see exactly when a youth switched programs — the date boundary between `mobile_mapping` and `microtasking` rows is the transfer date.

### 3. Counting attendance days per module for payment

The `attendance_days` field in each participant record already gives you the count scoped to your query:

```bash
# When queried with ?module=mobile_mapping:
# attendance_days = number of days they attended AS a mobile mapper

# When queried with ?youth_id=HUR792SW (no module filter):
# attendance_days = ALL attendance days across all programs
```

Use `attendance_days` from `?module=mobile_mapping` for mobile mapping payment calculations.

---

## Checking Payment Data

Each participant has a `payment_data` object:

```json
"payment_data": {
  "work_days": 14,
  "buildings_mapped": 0,
  "data_source": "attendance_records",
  "payment_eligible_days": 14,
  "total_earnings_potential": 7000
}
```

| Field | Meaning |
|-------|---------|
| `data_source: "youth_work_days"` | Formal work records exist — use `payment_eligible_days` |
| `data_source: "attendance_records"` | No formal work record; attendance used as proxy |
| `payment_eligible_days` | Days eligible for payment |
| `total_earnings_potential` | Days × rate (KES 500/day for mobile mapping) |

> **Important:** `total_earnings_potential` in the `payment_data` object uses the youth's **current** program rate, not their historical rate. For transferred youth queried via `?module=mobile_mapping`, multiply `payment_eligible_days` × **500** (mobile mapping rate) manually.

The `payment_system_health` array in the response summary shows gaps at a glance:

```json
"payment_system_health": [
  {
    "module": "mobile_mapping",
    "total_youth": 74,
    "payment_eligible": 0,
    "payment_gap": 74,
    "gap_percentage": 100,
    "total_earnings_potential": "KES 463,500",
    "status": "🚨 PAYMENT GAPS DETECTED"
  }
]
```

> **Note:** `payment_system_health` reflects the 74 youth currently assigned to mobile_mapping. The 26 transferred youth appear separately under `microtasking` in this summary. Use the `participants` list from `?module=mobile_mapping` for the full 100-youth payment calculation.

---

## Quick Reference

| What you want | Query |
|--------------|-------|
| All mobile mapping attendance (including transferred youth) | `?module=mobile_mapping` |
| All microtasking attendance | `?module=microtasking` |
| All digitization attendance | `?module=digitization` |
| One person's full history across all modules | `?youth_id=KAR040JK` |
| One person's mobile mapping history only | `?youth_id=KAR040JK&module=mobile_mapping` |

---

## Settlement Breakdown for Mobile Mapping (Full Cycle)

To get attendance counts per settlement, filter `participants` by `settlement` on your side after calling `?module=mobile_mapping`:

```
Kayole Soweto        →  60 youth,  945 attendance-days  (Jan 13 – Feb 9)
Kariobangi Machakos  →  25 youth,  330 attendance-days  (Jan 25 – Feb 15)
Mji wa Huruma        →  15 youth,  180 attendance-days  (Jan 21 – Feb 12)
─────────────────────────────────────────────────────────
TOTAL                → 100 youth, 1455 attendance-days
```

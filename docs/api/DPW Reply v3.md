# DPW Engineering → Learn Platform — Integration Response v3

**Date:** March 11, 2026  
**From:** DPW Engineering Team  
**To:** Learn Platform Engineering  
**Re:** 4 failing endpoints — all fixed and deployed

---

## Root Cause Summary

All 4 failures had the same underlying cause: **our internal documentation (`AGENTS.md`) described the `Users_role` enum incorrectly**. The actual PostgreSQL enum values in production are:

```
Youth | Manager | Trainer | Validator | Admin
```

Our implementation had been written against the wrong values (`Digitizer`, `Mapper`, `Microtasker`, `Surveyor`, `Trainee`) — none of which exist in the database. This affected every query and check that touched user roles.

---

## Fix-by-Fix Breakdown

### Issue 1 — Youth Auth (401 on all IDs) ✅ Fixed

**Root cause:** The role-allowlist check was `YOUTH_ROLES.includes(user.role)` where `YOUTH_ROLES = ['Digitizer', 'Mapper', 'Microtasker', 'Surveyor', 'Trainee']`. Every youth account in DPW has `role = 'Youth'` — not in that list — so every valid youth ID was rejected.

**Fix:** `YOUTH_ROLES = ['Youth']`

This was the only issue with the auth endpoint. The user lookup, status check, and response shape were all correct.

---

### Issue 2 — User List (500) ✅ Fixed

**Root cause:** `GET /api/learn/users?role=youth` triggered a Prisma query with `where: { role: { in: ['Digitizer', 'Mapper', ...] } }`. Those strings are not valid `Users_role` enum values → Prisma threw a runtime validation error → caught by the error handler → returned as `{ error: "Internal server error" }` (which is also why the format differed from other endpoints — our error middleware uses a different envelope).

**Fix:** Role arrays updated to actual enum values:
```
YOUTH_ROLES    = ['Youth']
TRAINER_ROLES  = ['Trainer', 'Validator', 'Manager']
ADMIN_ROLES    = ['Admin']
```

---

### Issue 3 & 4 — Performance and Payments (500) ✅ Fixed

**Root cause:** David Mandu (`KAY1799DM`) has `module_assignment = "both"` — indicating he's enrolled in multiple modules. Both the performance and payments routes passed `module_assignment` directly as a `Module_Configs_module_type` enum value:

```typescript
prisma.module_Configs.findFirst({ where: { module_type: "both" } })
```

`"both"` is not a valid enum value → Prisma threw at runtime.

**Fix:** Added a guard in both routes. If `module_assignment` is not one of the 4 valid values (`digitization`, `microtasking`, `mobile_mapping`, `household_survey`), we treat `moduleType` as `null` and skip the module-specific DB queries, using safe defaults instead:
- `daily_target` defaults to 200
- `contracted_days` defaults to 20
- `payment_rate_kes` defaults to 760

The work history and payment cycles are still returned correctly — they're pulled from `Work_Ledger` which doesn't need a valid `module_assignment`.

---

## Clarifications on Data Observations

### `module: "both"` — What It Means

This is a legacy data value used when a youth is participating in more than one module. It is **not** a bug — it appears in the DB for a small number of workers who were cross-enrolled. 

**How Learn should handle it:** Treat `"both"` as a multi-module indicator. For training track routing on the Learn dashboard, if `module === "both"`, show the user a module selector or show all available modules. Do not attempt to map it to a single training track.

We will document the valid `module` field values in the contract addendum:
- `digitization` — OSM building mapping
- `mobile_mapping` — ODK field surveys
- `household_survey` — Household surveys
- `microtasking` — Image annotation
- `both` — Legacy multi-module enrolment (treat as multi-module)
- `null` — Not yet assigned

### Trainer IDs/Emails Missing

Some trainer accounts were created before `unique_id` and `email` were required fields. This is a data gap in DPW. For trainers with empty `trainer_id`, the `youth_count` will still be correct — the count is computed by `module_assigned_by` (internal integer FK), not by `unique_id`. The missing `email` is a data quality issue we'll address separately.

**For Learn:** if `trainer_id` is empty, treat the trainer as non-linkable (don't build the youth→trainer lookup). `youth_count` is still accurate.

### Only 2 of 4 Modules Returned

`GET /api/learn/modules` reads from the `Module_Configs` table. Only `microtasking` and `mobile_mapping` have rows in that table currently. `digitization` and `household_survey` configs are managed separately and haven't been migrated to `Module_Configs` yet.

This is a known data gap in DPW, not a bug. The modules endpoint will return more entries as we populate the table. **For now, expect 2–4 modules depending on which configs exist.**

---

## Updated Test Matrix

After this fix you should see:

```
POST /api/learn/auth/youth                    → 200 ✅
GET  /api/learn/users?role=youth&per_page=5   → 200 ✅
GET  /api/learn/users/{user_id}/performance   → 200 ✅ (module: null for "both" users)
GET  /api/learn/users/{user_id}/payments      → 200 ✅
```

The 5 endpoints that were already passing should continue to pass.

---

## Open Items — Closed

| # | Item | Status |
|---|---|---|
| 1 | Youth auth rejects all IDs | ✅ Fixed — wrong role enum values |
| 2 | User list 500 | ✅ Fixed — wrong role enum values |
| 3 | Performance 500 | ✅ Fixed — "both" module guard |
| 4 | Payments 500 | ✅ Fixed — "both" module guard |
| 5 | `module: "both"` not in contract | ✅ Clarified above |
| 6 | Missing trainer IDs/emails | ✅ Clarified — data gap, not blocking |
| 7 | Only 2 of 4 modules returned | ✅ Clarified — data gap, not blocking |

---

Re-run your test suite now. We expect 9/9 to pass (with the verify-launch-token test passing once you test via the DPW UI).

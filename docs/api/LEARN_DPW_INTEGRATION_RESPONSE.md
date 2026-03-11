# Learn Platform → DPW Engineering — Integration Response v2

**Date:** March 11, 2026  
**From:** Learn Platform Engineering  
**To:** DPW Engineering Team  
**Re:** DPW ↔ Learn Platform — Integration Handoff + DPW Response (March 11, 2026)

---

## 1. Actions Completed on Learn Side

| Item | Status |
|---|---|
| Secrets stored in env config (`DPW_API_URL`, `DPW_API_SECRET`, `DPW_LAUNCH_TOKEN_SECRET`) | ✅ Done |
| `dpw-client.ts` updated with new base URL + secret | ✅ Done |
| Exponential backoff on 429 responses (3 retries, `Retry-After` header respect) | ✅ Implemented |
| Reference data caching (60s TTL for settlements, modules, trainers) | ✅ Already in place |
| Training completion webhook (Option B) to `POST /api/webhooks/learn/training-complete` | ✅ Implemented |
| Old endpoints decommissioned (`/api/external/*`) | ✅ Already removed |
| `superadmin` role removed from all type definitions and role checks | ✅ Done |
| Integration test script updated | ✅ Ready |

---

## 2. Integration Test Results — March 11, 2026 (Post-Deployment)

After DPW's deployment, we re-ran our test suite. **5 of 9 endpoints pass. 4 have issues that need attention from DPW.**

```
DPW Base URL: https://app.spatialcollective.com
Secret: 12f4b053...cedb
Test Youth ID: KAY1799DM

──────────────────────────────────────────────────────────
PASS: GET  /api/learn/users/KAY1799DM              → 200 (David Mandu, Kayole Soweto)
PASS: GET  /api/learn/users/.../attendance          → 200 (16 days attended, 16 records)
PASS: GET  /api/learn/settlements                   → 200 (7 settlements)
PASS: GET  /api/learn/modules                       → 200 (2 modules: Microtasking, Mobile Mapping)
PASS: GET  /api/learn/trainers                      → 200 (11 trainers)
FAIL: POST /api/learn/auth/youth                    → 401 "Youth ID not recognized"
FAIL: GET  /api/learn/users?role=youth&per_page=5   → 500 Internal server error
FAIL: GET  /api/learn/users/.../performance         → 500 Internal server error
FAIL: GET  /api/learn/users/.../payments            → 500 Internal server error
SKIP: POST /api/learn/auth/verify-launch-token      → needs fresh token from DPW UI
──────────────────────────────────────────────────────────
Results: 5 passed, 4 failed, 1 skipped
```

### Issue Details

#### Issue 1: Youth Auth Rejects All IDs (401)

`POST /api/learn/auth/youth` returns `{"code":"INVALID_CREDENTIALS","message":"Youth ID not recognized"}` for every ID we tested — including `KAY1799DM`, which `GET /api/learn/users/KAY1799DM` returns successfully with `is_active: true`.

We tested: `KAY1799DM`, `KAR0042JK`, `HUR0217AM`, `KAY0001DM`, `KAY0100DM` — all 401.

**Question:** Is there an additional condition on the auth endpoint beyond `unique_id` lookup? (e.g., user must have a specific status like `In_Training` or `Active`, or there's a separate "auth-eligible" flag?)

**This is a blocker for youth login.**

#### Issue 2: User List Returns 500

`GET /api/learn/users?role=youth&per_page=5` returns `{"error":"Internal server error"}` (note: different error format than the other endpoints — not wrapped in `success/error` envelope).

#### Issue 3: Performance & Payments Return 500

Both `GET /api/learn/users/KAY1799DM/performance` and `GET /api/learn/users/KAY1799DM/payments` return `{"success":false,"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred"}}`.

These may be related to the user's `module: "both"` value (see Section 3 below).

---

## 3. Data Quality Observations

### Module Value: `"both"` Not in Contract

The user profile for `KAY1799DM` returns:
```json
{
  "module": "both",
  "module_assignment": "both"
}
```

The handoff document (Section 6) specifies these valid module values: `digitization`, `mobile_mapping`, `household_survey`, `microtasking`.

`"both"` is not in this list. Learn uses the `module` field to route youth to the correct training track. **An unexpected value will break training routing on our dashboard.**

**Question:** Is `"both"` a valid module indicating the user is enrolled in multiple programs? If so, how should Learn handle routing? Or is this test data that needs cleanup?

### Trainer IDs Missing

Some trainers returned by `GET /api/learn/trainers` have empty `trainer_id` and `email` fields:
```json
{
  "trainer_id": "",
  "full_name": "Alex Okumu",
  "email": "",
  "settlement": "Kariobangi Machakos"
}
```

This won't break anything on Learn, but if `trainer_id` is meant to be a stable reference (e.g., for linking to `trainer_name` on user profiles), empty values could cause issues downstream.

### Modules: Only 2 Returned

`GET /api/learn/modules` returns only `microtasking` and `mobile_mapping`. The handoff (Section 6) lists 4 modules including `digitization` and `household_survey`. Are those active in DPW or not yet?

---

## 4. Training Completion Webhook — Confirmed

We confirm:
- Payload structure matches (we saw your validated fields list — good)
- We fire the webhook on the **final step** of any training module
- Fire-and-forget — we log failures but don't block the youth's training response
- We handle the idempotent behavior (`status_updated: false` on duplicate) gracefully

No changes needed on our side. The webhook is ready to fire as soon as youth can actually log in and complete training.

---

## 5. Superadmin — Removed

Per your confirmation, we have:
- Removed `superadmin` from all TypeScript type definitions (`UserRole`, `LearnTokenPayload`, `UserProfile`, `AdminProfile`)
- Removed `superadmin` from all role check calls (`hasRole()`)
- Deleted orphaned `StaffAdminPanel.tsx` component
- `admin` is now the highest privilege level in Learn

Build passes cleanly.

---

## 6. Open Items — Updated

| # | Item | Owner | Status | Priority |
|---|---|---|---|---|
| 1 | Youth auth rejects all IDs | DPW | **Blocker** | Critical |
| 2 | User list endpoint 500 | DPW | Open | High |
| 3 | Performance endpoint 500 | DPW | Open | High |
| 4 | Payments endpoint 500 | DPW | Open | High |
| 5 | `module: "both"` not in contract spec | DPW | Needs clarification | Medium |
| 6 | Missing trainer IDs/emails | DPW | Needs clarification | Low |
| 7 | Only 2 of 4 modules returned | DPW | Needs clarification | Low |
| 8 | Test youth ID for auth | DPW | Waiting (DM channel) | High |

---

## 7. What's Working End-to-End

| Flow | Status |
|---|---|
| User profile lookup | ✅ Working |
| Attendance data | ✅ Working |
| Settlements reference data | ✅ Working |
| Modules reference data | ✅ Working (2 of 4) |
| Trainers reference data | ✅ Working |
| Youth login | ❌ Blocked (auth 401) |
| Admin launch token | ⏳ Untested (need DPW UI session) |
| Performance dashboard | ❌ Blocked (500 error) |
| Payments dashboard | ❌ Blocked (500 error) |
| User management list | ❌ Blocked (500 error) |
| Training webhook → DPW | ✅ Endpoint confirmed live |

---

## 8. Next Steps

Once DPW resolves the 4 failing endpoints, we can:
1. Re-run `node scripts/test-dpw-integration.js` to confirm all green
2. Test the full Launch Learn flow from DPW UI
3. Deploy Learn v2 to production
4. Run end-to-end training → webhook → DPW status graduation test

Ready to iterate. We can re-test immediately after DPW pushes fixes.

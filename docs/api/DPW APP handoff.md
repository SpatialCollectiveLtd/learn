# DPW ↔ Learn Platform — Integration Handoff

**Date:** March 11, 2026  
**From:** DPW Engineering Team  
**To:** Learn Platform Engineering  
**Status:** Ready for integration testing

---

## 1. Implementation Status

All 10 endpoints defined in the API contract (v1.0, March 2026) are **fully implemented and live on the DPW App**.

| Endpoint | Status |
|---|---|
| `POST /api/learn/auth/youth` | ✅ Live |
| `POST /api/learn/auth/verify-launch-token` | ✅ Live |
| `GET /api/learn/users` | ✅ Live |
| `GET /api/learn/users/{user_id}` | ✅ Live |
| `GET /api/learn/users/{user_id}/attendance` | ✅ Live |
| `GET /api/learn/users/{user_id}/performance` | ✅ Live |
| `GET /api/learn/users/{user_id}/payments` | ✅ Live |
| `GET /api/learn/settlements` | ✅ Live |
| `GET /api/learn/modules` | ✅ Live |
| `GET /api/learn/trainers` | ✅ Live |

**Base URL:** `https://app.spatialcollective.com`

---

## 2. Credentials & Secrets

Share these values with your infrastructure team. Add them to Learn's environment variables.

> **IMPORTANT:** These secrets must be stored securely (e.g., Vercel Environment Variables, AWS Secrets Manager). Never commit them to source control.

### Shared Secret (S2S Auth)

Used by Learn to authenticate all server-to-server requests to DPW.  
Store this in Learn's environment as `DPW_API_SECRET`.

```
DPW_API_SECRET=12f4b0537b5e580679ca896e43ab38260f10ef0a2d2652af5563325b0c90cedb
```

Usage — add this header to every Learn → DPW API call:
```
Authorization: Bearer 12f4b0537b5e580679ca896e43ab38260f10ef0a2d2652af5563325b0c90cedb
```

### Launch Token Secret

Used by DPW to sign one-time launch tokens and by Learn to verify them.  
Both DPW and Learn must share **the exact same value** for token verification to work.  
Add to Learn's environment as `DPW_LAUNCH_TOKEN_SECRET`.

```
DPW_LAUNCH_TOKEN_SECRET=dfa1295174a1f8b1dcda837ff79229ce2fc36f3c786e23d8759f21bbc6a02f68
```

### DPW `.env` additions (DPW team action)

```env
LEARN_DPW_SHARED_SECRET=12f4b0537b5e580679ca896e43ab38260f10ef0a2d2652af5563325b0c90cedb
DPW_LAUNCH_TOKEN_SECRET=dfa1295174a1f8b1dcda837ff79229ce2fc36f3c786e23d8759f21bbc6a02f68
LEARN_APP_URL=https://learn.spatialcollective.co.ke
```

---

## 3. Launch Token — Technical Notes

### Token Format

Launch tokens are **not standard JWTs**. They use a custom format:

```
base64url(JSON_PAYLOAD).base64url(HMAC-SHA256_SIGNATURE)
```

The signature is computed using `HMAC-SHA256(DPW_LAUNCH_TOKEN_SECRET, JSON_PAYLOAD)`.  
The JSON payload looks like this:

```json
{
  "user_id": "STEA8103SA",
  "role": "admin",
  "email": "james@spatialcollective.com",
  "full_name": "James Admin",
  "settlement": null,
  "iat": 1741694400,
  "jti": "a3c9b2f1-4e87-4c3d-9e5b-1f2a3b4c5d6e"
}
```

### Verification Rules

When Learn calls `POST /api/learn/auth/verify-launch-token`, DPW:
1. Splits the token on `.`
2. Decodes the base64url payload
3. Recomputes HMAC-SHA256 and compares in constant time
4. Rejects if the token is > 60 seconds old (`iat` check)
5. Rejects if the `jti` (JWT ID) has already been used (single-use enforcement)

**Do not attempt to verify the token on Learn's side directly.** Always call the DPW endpoint — this ensures single-use is enforced correctly.

### Launch Flow

```
1. DPW staff clicks "Launch Learn" in DPW sidebar
2. DPW App calls POST /api/learn/generate-launch-token (internal, session-auth)
3. DPW returns { redirect_url: "https://learn.spatialcollective.co.ke/auth/launch?token=<token>" }
4. DPW UI opens redirect_url in a new tab
5. Learn's /auth/launch route calls POST /api/learn/auth/verify-launch-token with the token
6. DPW validates and returns the admin/trainer profile
7. Learn signs its own session JWT and logs in the user
```

---

## 4. User ID Format

All users in DPW are identified by their `unique_id` — a prefix-based string:

| Settlement | Prefix | Example |
|---|---|---|
| Kayole Soweto | `KAY` | `KAY1799DM` |
| Kariobangi Machakos | `KAR` | `KAR0042JK` |
| Mji wa Huruma | `HUR` | `HUR0217AM` |

Staff/admin IDs use a different prefix format (e.g., `STEA8103SA`).

**Use `unique_id` everywhere.** This is the `user_id` field in all Learn API responses. Do not use the internal numeric `id` field — it is not exposed in these endpoints.

---

## 5. Role Mapping

DPW roles map to Learn roles as follows:

| DPW Role | Learn Role |
|---|---|
| `Digitizer` | `youth` |
| `Mapper` | `youth` |
| `Microtasker` | `youth` |
| `Surveyor` | `youth` |
| `Trainee` | `youth` |
| `Validator` | `trainer` |
| `Manager` | `trainer` |
| `Admin` | `admin` |

---

## 6. Module Names

The `module` field in user profiles will be one of:

| Value | Description |
|---|---|
| `digitization` | Building footprint digitization |
| `mobile_mapping` | Field POI surveys using ODK Collect |
| `household_survey` | Household surveys using ODK Collect |
| `microtasking` | Image annotation via Bridge API |

---

## 7. Attendance Data

Attendance is recorded in DPW via the in-house **DPW Attendance System** — not the previous Learn API. Key points for Learn:

- Absence records are **not stored**. A worker who was absent simply has no record for that date.
- All records returned by `GET /api/learn/users/{user_id}/attendance` have `status: "present"`.
- Attendance is required for payment in all modules — this is enforced in DPW's payment calculations.

---

## 8. Pending Decision — Training Status Notification (Section 7 of Contract)

The contract described two options for notifying DPW when a youth completes training on Learn:

**Option A (DPW polls Learn):** DPW calls a Learn API to check training completion status on demand.

**Option B (Learn webhooks DPW):** Learn sends a `POST` to a DPW webhook endpoint when a youth completes training.

**Our recommendation: Option B.** DPW can implement a webhook endpoint `POST /api/webhooks/learn/training-complete` and update the user's status in DPW when a training completion event arrives.

Please confirm which option you prefer and share the webhook payload structure if you choose Option B. DPW will implement the endpoint accordingly.

---

## 9. Endpoints to Decommission on Learn Side

Per the contract (Section 1), the following Learn endpoints can now be removed:

- `GET /api/external/dpw-sync` — DPW no longer pulls from Learn. Remove this.
- `GET /api/external/osm-mappings` — OSM workflow replaced by QGIS. Remove this.

Please confirm once decommissioned so DPW can remove any outbound calls (if any remain).

---

## 10. Rate Limiting

We have not yet implemented rate limiting on the `/api/learn/*` namespace. It is on our roadmap. Please implement exponential backoff with `429` respect on Learn's side from day one — this will protect both platforms as traffic scales.

Expected volumes (from contract):
- Auth calls: ~200–220/day
- Data calls: ~800/day
- Reference data: ~50/day (cache these on Learn side for at least 60 seconds)

---

## 11. What to Test First

Suggested integration test sequence:

1. **Youth auth** — `POST /api/learn/auth/youth` with a known `unique_id` (e.g., ask us for a test ID)
2. **User profile** — `GET /api/learn/users/{user_id}` for the same ID
3. **Attendance** — `GET /api/learn/users/{user_id}/attendance?from=2026-01-01&to=2026-03-11`
4. **Admin launch** — Click "Launch Learn" from a DPW admin account, paste the generated URL into curl, verify token decode
5. **User list** — `GET /api/learn/users?settlement=Kayole&role=youth&per_page=10`

If any endpoint returns unexpected data or an error, share the full request (headers + body) and response with us and we'll investigate.

---

## 12. Contact

For integration support, reach out to the DPW Engineering team directly. Do not open production traffic until you have confirmed the shared secrets are correctly set on both sides.

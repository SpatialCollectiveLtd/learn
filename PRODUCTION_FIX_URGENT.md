# 🔥 URGENT: Production API Fix

**Issue:** Mobile mapper dashboard APIs returning 404/500 errors in production

**Root Cause:** Missing environment variable `DPW_MANAGER_BASE_URL` in Vercel

---

## Immediate Fix Required

### Step 1: Add Environment Variable to Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add this variable:

```
Variable Name: DPW_MANAGER_BASE_URL
Value: https://digital-chi-six.vercel.app/api/v1
Environment: Production, Preview, Development
```

### Step 2: Redeploy

After adding the environment variable:
1. Go to Deployments tab
2. Find the latest deployment
3. Click "..." → "Redeploy"
4. Or push a new commit to trigger auto-deploy

---

## Expected Behavior After Fix

Once the environment variable is set, these APIs should work:

- ✅ `/api/youth/payment/breakdown` - Returns payment data (may be empty if no work submitted)
- ✅ `/api/youth/performance` - Returns performance metrics
- ✅ `/api/youth/badges` - Returns badge calculations
- ✅ `/api/youth/queries` - Returns query list

---

## Testing After Fix

```bash
# 1. Check if APIs are accessible
curl https://learn.spatialcollective.co.ke/api/health

# 2. Login as mobile mapper and check browser console
# Should see successful API calls (200 status) instead of 404
```

---

## Why This Happened

The code has a fallback URL:
```typescript
const DPW_BASE_URL = process.env.DPW_MANAGER_BASE_URL || 'https://digital-chi-six.vercel.app/api/v1';
```

However, in production, if the variable isn't set and the fallback DPW API isn't running yet, you'll get 404 errors.

---

## Alternative: Mock Data for Testing

If DPW Manager staging isn't ready yet, users will see empty data (0 KES earnings, no rankings, etc.) which is expected behavior until they:
1. Submit ODK forms
2. DPW Manager processes the data
3. Data syncs back to Learn Platform

This is **NOT a bug** - it's the expected flow for new users.

---

**Priority:** HIGH  
**Impact:** Mobile mappers can't see dashboard data  
**Fix Time:** 2 minutes (add env var + redeploy)

# QUICK FIX: Stop 429 Errors in JOSM

**For Trainers/Supervisors - Print & Distribute**

---

## ⚠️ STOP UPLOADS IMMEDIATELY

If mappers are getting 429 errors, PAUSE all mapping until this is fixed.

---

## 3-Step Fix (5 minutes per mapper)

### STEP 1: Enable OAuth

1. Open JOSM, press `F12`
2. Click "Connection Settings"  
3. Select **"Use OAuth"**
4. Click **"Authorize now"**
5. Login to OpenStreetMap in browser
6. Click "Grant Access"
7. Return to JOSM, click OK

✅ **Check**: You should see "OAuth Access Token: xxxxx"

---

### STEP 2: Set Upload Limit

1. Press `F12` in JOSM
2. Click "Upload" tab
3. ✅ Check "Upload in chunks"
4. Set chunk size: **500**
5. Click OK

✅ **Check**: Should now upload in smaller batches

---

### STEP 3: Use Correct Comment

When uploading, ALWAYS use this format:

```
DPW2025: [Kayole/Huruma/Kariobangi] - HOTOSM Task #[number] - Partial
Source: Bing Aerial Imagery
Hashtag: #DPW2025
```

Example:
```
DPW2025: Kayole - HOTOSM Task #12345 - Partial (daily limit)
Source: Bing Aerial Imagery
```

---

## If You Still Get 429:

1. **WAIT 5 MINUTES** (don't retry immediately!)
2. Check if others are uploading → wait your turn
3. Try again
4. If fails again → **Report to supervisor**

---

## Upload Schedule (Prevent Conflicts)

- **Kayole**: Upload at :00, :15, :30, :45 past the hour
- **Huruma**: Upload at :05, :20, :35, :50 past the hour  
- **Kariobangi**: Upload at :10, :25, :40, :55 past the hour

---

## Verification: Is OAuth Working?

In JOSM:
1. Press `F12`
2. Connection Settings
3. Look for: **"OAuth Access Token"**
4. If you see it → ✅ Working
5. If you DON'T see it → ❌ Not configured, repeat Step 1

---

## Common Mistakes

❌ Using "Basic Authentication" instead of OAuth  
❌ Uploading without waiting after 429 error  
❌ Multiple mappers uploading at same time  
❌ Missing #DPW2025 hashtag  
❌ Uploading more than 200 buildings at once

---

**Priority**: Fix OAuth FIRST. This solves 90% of 429 errors.

---

**Questions?** Contact project technical lead immediately.

**Updated**: January 9, 2026

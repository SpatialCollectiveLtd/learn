# JOSM Setup Guide - Preventing 429 Rate Limit Errors

**Date:** January 9, 2026  
**Issue:** Youth mappers experiencing "429 Too Many Requests" errors when uploading in JOSM  
**Critical:** Follow ALL steps to prevent account blocks

---

## ⚠️ CRITICAL: Stop All Uploads Immediately

**DO NOT upload until you complete the setup below.** Repeated 429 errors can lead to:
- Temporary IP blocks
- Account suspension
- Project flagged by OSM Data Working Group

---

## Understanding 429 Errors

**What it means:** OpenStreetMap API is rate-limiting your uploads because:
1. ❌ Not using OAuth authentication (anonymous/basic auth is heavily rate-limited)
2. ❌ Uploading too many changes too quickly
3. ❌ Multiple mappers from same IP uploading simultaneously
4. ❌ Changeset comments not descriptive enough
5. ❌ User-Agent not properly configured

---

## SOLUTION 1: Configure OAuth in JOSM (REQUIRED)

OAuth gives you much higher rate limits and identifies you properly to OSM.

### Step-by-Step OAuth Setup:

1. **Open JOSM Preferences**
   - Click `Edit` → `Preferences` (or press `F12`)

2. **Go to Connection Settings**
   - Click the ![Connection icon](🔌) **Connection Settings** tab on the left
   - Scroll down to **OSM Server** section

3. **Select OAuth Authentication**
   - Find "Authentication Method"
   - ✅ Select **"Use OAuth"** (NOT "Use Basic Authentication")
   - Click **"Authorize now"** button

4. **Authorize JOSM**
   - A browser window will open to OpenStreetMap.org
   - **Log in** with your OSM username and password
   - Click **"Grant Access"** to authorize JOSM
   - Browser will show: "You have successfully authorized JOSM"
   - Return to JOSM

5. **Verify OAuth Setup**
   - You should see: "OAuth Access Token: [token preview]"
   - If you see this, OAuth is configured ✅
   - Click **"OK"** to save

6. **Test Upload**
   - Make a small test edit (add 1-2 buildings)
   - Upload with proper changeset comment
   - Should work without 429 error

---

## SOLUTION 2: Configure Proper User-Agent (REQUIRED)

OSM needs to identify your JOSM client properly.

### Setup Custom User-Agent:

1. **Open JOSM Preferences** (`F12`)

2. **Go to Advanced Preferences**
   - Click ![Advanced](⚙️) **Expert mode** at bottom
   - Or click **Advanced Preferences** tab

3. **Set Custom User-Agent**
   - Search for: `http.agent`
   - Change value to:
     ```
     JOSM/1.5 (DPW2025 Nairobi Mapping; contact@spatialcollective.co.ke)
     ```
   - Click **OK**

4. **Alternative: Edit JOSM Config File**
   - Close JOSM
   - Find JOSM preferences file:
     - **Windows**: `%APPDATA%\JOSM\preferences.xml`
     - **Mac**: `~/Library/JOSM/preferences.xml`
     - **Linux**: `~/.config/JOSM/preferences.xml`
   - Add this line inside `<preferences>`:
     ```xml
     <tag key="http.agent" value="JOSM/1.5 (DPW2025 Nairobi; contact@spatialcollective.co.ke)"/>
     ```

---

## SOLUTION 3: Optimize Upload Batch Size

Upload in smaller batches to avoid triggering rate limits.

### Configure Upload Settings:

1. **Open JOSM Preferences** (`F12`)

2. **Go to Upload Settings**
   - Click ![Upload](⬆️) **Upload** tab

3. **Set Batch Size Limits**
   - ✅ Enable: "Upload in chunks"
   - Set **chunk size** to: **500 objects** (default 10,000 is too large)
   - ✅ Enable: "Close changeset after upload"

4. **Configure Changeset Settings**
   - **Max changeset size**: 200 buildings (our project limit)
   - ✅ Enable: "Create new changeset for each upload"
   - This prevents hitting OSM's 10,000 object limit per changeset

---

## SOLUTION 4: Proper Changeset Comments (REQUIRED)

Descriptive comments prevent DWG scrutiny and rate limiting.

### Changeset Comment Template:

**REQUIRED FORMAT:**
```
DPW2025: [Settlement Name] - HOTOSM Task #[number] - [status]
Source: Bing Aerial Imagery
Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements
```

**Examples:**
```
DPW2025: Kayole - HOTOSM Task #12345 - Partial (daily limit)
Source: Bing Aerial Imagery
Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements
```

```
DPW2025: Huruma - HOTOSM Task #12346 - Complete
Source: Maxar Premium Imagery via HOTOSM
Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements
```

### How to Set in JOSM:

1. **Before uploading**, click the **Upload button** (green arrow)
2. In the upload dialog, fill in:
   - **Comment**: Use template above
   - **Source**: `Bing Aerial Imagery` or `Maxar Premium Imagery`
   - ✅ Check "Add hashtag": `#DPW2025`
3. Click **Upload**

---

## SOLUTION 5: Coordinate Upload Schedule

Avoid multiple mappers uploading simultaneously from same location.

### Upload Coordination Protocol:

1. **Check Upload Queue**
   - Before uploading, check if others from your settlement are uploading
   - If someone is uploading, wait 5 minutes

2. **Stagger Uploads**
   - **Kayole mappers**: Upload at :00, :15, :30, :45 minutes
   - **Huruma mappers**: Upload at :05, :20, :35, :50 minutes
   - **Kariobangi mappers**: Upload at :10, :25, :40, :55 minutes

3. **Use WiFi, Not Mobile Data**
   - If possible, use different WiFi networks
   - Mobile data often shares IP addresses → more rate limiting

4. **Upload During Off-Peak Hours**
   - Best times: 6:00-9:00 AM EAT, 2:00-5:00 PM EAT
   - Avoid: 10:00 AM - 2:00 PM EAT (global peak)

---

## SOLUTION 6: Handle 429 Errors Gracefully

If you still get a 429 error despite OAuth:

### Immediate Actions:

1. **DO NOT retry immediately** - this makes it worse
2. **Wait 5 minutes** before retrying
3. **Check error message** for guidance
4. **Reduce upload size** - try uploading fewer buildings

### JOSM Error Messages:

**"429 Too Many Requests - Please slow down"**
- ⏱️ Wait: 5-10 minutes
- Action: Enable OAuth if not already done
- Reduce batch size to 200-300 objects

**"429 - Rate limit exceeded"**
- ⏱️ Wait: 10-15 minutes
- Action: Check if multiple mappers uploading from same IP
- Coordinate with teammates

**"Your changeset has been blocked"**
- 🚨 STOP: Contact project lead immediately
- Possible DWG review in progress
- DO NOT create new changesets until resolved

---

## SOLUTION 7: Exponential Backoff Strategy

If you encounter repeated 429 errors:

1. **First 429**: Wait 5 minutes
2. **Second 429**: Wait 10 minutes
3. **Third 429**: Wait 20 minutes
4. **Fourth 429**: Stop and contact project lead

**Formula**: Wait time = 5 minutes × 2^(attempt - 1)

---

## For Project Administrators

### Server-Side Configuration

If rate limiting persists, implement these server-side solutions:

1. **Request Proxy/Load Balancer**
   - Route requests through multiple IPs
   - Implement request queuing

2. **Changeset Upload Queue**
   - Backend service that queues uploads
   - Uploads at controlled rate (1 per 10 seconds)
   - Automatically retries with exponential backoff

3. **OAuth Proxy Service**
   - Central OAuth token management
   - Rotates between multiple authenticated sessions
   - Monitors rate limit headers

4. **Contact OSM Operations**
   - Email: operations@openstreetmap.org
   - Explain: Large organized editing project
   - Request: Whitelisting or guidance for educational project

---

## Verification Checklist

Before allowing mappers to resume uploads, verify:

- [ ] All mappers have OAuth configured in JOSM
- [ ] Custom User-Agent is set in JOSM
- [ ] Upload chunk size set to 500 objects
- [ ] Changeset comment template is understood
- [ ] Upload coordination schedule is established
- [ ] Mappers know how to handle 429 errors
- [ ] Project wiki page is published (reduces DWG scrutiny)
- [ ] All mappers understand the 200 building/day limit

---

## Training Script for Mappers

Use this script when training mappers:

```
"Before you upload today, let's check three things:

1. OAUTH: Press F12 in JOSM. Go to Connection Settings. 
   Do you see 'OAuth Access Token'? 
   If NO: Click 'Authorize now' and log in to OSM.

2. CHANGESET COMMENT: When you upload, use this format:
   'DPW2025: [YourSettlement] - HOTOSM Task #[number] - Partial'
   Source: Bing Aerial Imagery
   
3. TIMING: Check if anyone else is uploading right now.
   If yes, wait 5 minutes.

If you get a '429 error', STOP. Wait 5 minutes. Try again.
If it happens twice, tell the supervisor."
```

---

## Emergency Contact

If mappers continue experiencing 429 errors after OAuth setup:

1. **Immediate**: Pause all uploads
2. **Contact**: Project technical lead
3. **Check**: OSM status page - https://status.openstreetmap.org
4. **Report**: Number of affected mappers, settlement, time of errors

---

## Technical Details: OSM Rate Limits

For reference (as of January 2026):

| Auth Method | Rate Limit | Changeset Limit |
|-------------|------------|-----------------|
| **Anonymous** | 10 requests/hour | ❌ Not allowed |
| **Basic Auth** | 100 requests/hour | 5,000 objects |
| **OAuth** | 10,000 requests/hour | 10,000 objects |
| **Whitelisted** | Unlimited | 50,000 objects |

**Our project needs**: OAuth minimum (we upload 200 buildings/mapper/day)

---

## Additional Resources

- **JOSM OAuth Guide**: https://josm.openstreetmap.de/wiki/Help/Preferences/Connection#OAuth
- **OSM API Usage Policy**: https://operations.osmfoundation.org/policies/api/
- **Rate Limiting Best Practices**: https://wiki.openstreetmap.org/wiki/API_v0.6#Uploading
- **DPW2025 Wiki**: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements

---

## Summary: Critical Actions

### For Mappers (DO THIS NOW):

1. ✅ Configure OAuth in JOSM
2. ✅ Set custom User-Agent
3. ✅ Use proper changeset comments
4. ✅ Upload in batches of 500 objects max
5. ✅ Wait if you get 429 error

### For Project Lead (DO THIS NOW):

1. ✅ Publish OSM Wiki page (if not done)
2. ✅ Train all mappers on OAuth setup
3. ✅ Implement upload coordination schedule
4. ✅ Monitor for 429 errors
5. ✅ Contact OSM operations if issues persist

---

**Last Updated**: January 9, 2026  
**Status**: CRITICAL - Implement immediately to resume mapping

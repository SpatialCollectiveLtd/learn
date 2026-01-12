# URGENT: OSM Server Migration - Action Required

## 📢 IMPORTANT ANNOUNCEMENT

**Effective Immediately**: Our mapping platform has switched to a **private OpenStreetMap server**.

### What This Means for You

**OLD Server** ❌: `openstreetmap.org`  
**NEW Server** ✅: `osm.spatialcollective.co.ke`

### 🚨 IMMEDIATE ACTION REQUIRED

All 61 mappers must reconfigure their JOSM software to connect to the new server.

---

## For Mappers: Quick Start Guide

### Step 1: Run the Configuration Script

**Windows Users**:
1. Download: `configure-josm-private-server.bat`
2. Double-click to run
3. Follow on-screen instructions

**Mac/Linux Users**:
1. Download: `configure-josm-private-server.sh`
2. Open Terminal
3. Run: `chmod +x configure-josm-private-server.sh`
4. Run: `./configure-josm-private-server.sh`

### Step 2: Complete OAuth Authorization

After running the script:

1. **Restart JOSM**
2. Open JOSM → **Edit** → **Preferences**
3. Go to **Connection Settings** tab
4. Click **OAuth 2** tab
5. Click **"Authorize now"** button
6. Your browser will open → **Login to osm.spatialcollective.co.ke**
7. Click **"Grant Access"** to allow JOSM
8. Return to JOSM → You should see ✅ **"Authorized"**

### Step 3: Test Your Connection

1. Download a small area in your settlement
2. Add or edit 1-2 buildings
3. Upload with changeset comment: `#DPW2025 test upload`
4. ✅ Should upload **without 429 errors**

---

## What's Changed?

### Your OSM Account
- **NEW URL**: https://osm.spatialcollective.co.ke
- **Same username and password** (if you had an account)
- If you don't have an account on the new server, you'll need to create one

### Your Work Dashboard
- ✅ **NO CHANGES** - Work stats tracking remains the same
- ✅ Building counts will continue to update automatically
- ✅ Timezone handling (EAT) still works correctly

### JOSM Configuration
- ✅ Server URL updated automatically by script
- ✅ OAuth2 authentication configured
- ✅ Chunked uploads enabled (prevents errors)
- ✅ #DPW2025 hashtag pre-filled

---

## Troubleshooting

### "Cannot connect to OSM server"
- ✅ Check: Did you run the configuration script?
- ✅ Check: Did you restart JOSM after running script?
- ✅ Check: Can you access https://osm.spatialcollective.co.ke in your browser?

### "OAuth authorization failed"
- ✅ Make sure you're logging into **osm.spatialcollective.co.ke**, not openstreetmap.org
- ✅ If you don't have an account, create one first at osm.spatialcollective.co.ke
- ✅ Try the authorization process again (JOSM Preferences → OAuth 2 → Authorize now)

### "Still getting 429 errors"
- ✅ Verify OAuth shows "Authorized" in JOSM preferences
- ✅ Check chunked uploads are enabled (should be automatic)
- ✅ Contact your trainer for help

### "My stats aren't updating"
- ✅ Make sure you're uploading with the #DPW2025 hashtag
- ✅ Check that your OSM username in the platform matches your login
- ✅ Stats update may take a few minutes - try refreshing

---

## Need Help?

**Contact your trainer immediately if:**
- ❌ You cannot complete OAuth authorization
- ❌ JOSM won't connect to the server
- ❌ You're still seeing 429 rate limit errors
- ❌ Your work stats aren't updating after 30 minutes

**Trainer Contact**: Available during work hours for urgent support

---

## Technical Details (For Trainers)

### Server Configuration
- **Server**: https://osm.spatialcollective.co.ke
- **API Endpoint**: https://osm.spatialcollective.co.ke/api/0.6
- **OAuth2 Authorization**: https://osm.spatialcollective.co.ke/oauth2/authorize
- **OAuth2 Token**: https://osm.spatialcollective.co.ke/oauth2/token

### Code Changes Deployed
- ✅ src/lib/osm-service.ts - API base URL updated
- ✅ src/app/api/osm/verify-username/route.ts - Username verification
- ✅ All UI components - Links and instructions updated
- ✅ Timezone handling - No changes (still EAT UTC+3)

### Environment Variables Set
```bash
NEXT_PUBLIC_OSM_SERVER_URL=https://osm.spatialcollective.co.ke
NEXT_PUBLIC_OSM_OAUTH_AUTHORIZE_URL=https://osm.spatialcollective.co.ke/oauth2/authorize
NEXT_PUBLIC_OSM_OAUTH_TOKEN_URL=https://osm.spatialcollective.co.ke/oauth2/token
```

### Deployment Status
- ✅ Code changes: Completed
- ✅ Environment variables: Ready to deploy
- ✅ JOSM scripts: Generated
- ⏳ Mapper reconfiguration: In progress
- ⏳ Production testing: Pending

---

## Migration Timeline

**Now** - Code deployed to production  
**Today** - All mappers notified  
**Within 24 hours** - All mappers reconfigured  
**Ongoing** - Monitor for issues and provide support

---

**Last Updated**: January 2025  
**Migration Status**: 🔄 Active - Mappers being reconfigured

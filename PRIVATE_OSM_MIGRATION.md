# Private OSM Server Migration Guide

## Overview
The platform has been migrated from public OpenStreetMap (openstreetmap.org) to a private OSM server at **osm.spatialcollective.co.ke**.

## What Changed

### 1. **API Endpoints**
- **Old**: `https://api.openstreetmap.org/api/0.6`
- **New**: `https://osm.spatialcollective.co.ke/api/0.6`

### 2. **OAuth2 Configuration**
- **Authorization URL**: `https://osm.spatialcollective.co.ke/oauth2/authorize`
- **Token URL**: `https://osm.spatialcollective.co.ke/oauth2/token`

### 3. **User Profiles**
- **Old**: `https://www.openstreetmap.org/user/{username}`
- **New**: `https://osm.spatialcollective.co.ke/user/{username}`

## Files Updated

### Core API Integration
1. ✅ **src/lib/osm-service.ts** - OSM API base URL updated
2. ✅ **src/app/api/osm/verify-username/route.ts** - Username verification endpoint

### UI Components
3. ✅ **src/components/notifications/OsmUsernameNotification.tsx** - Help text updated
4. ✅ **src/app/digitization/mapper/[stepId]/page.tsx** - Instructions and links updated
5. ✅ **src/app/dashboard/trainer/reviews/page.tsx** - Changeset URLs updated
6. ✅ **src/data/mapper-training.ts** - Training data updated

## Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_OSM_SERVER_URL=https://osm.spatialcollective.co.ke
NEXT_PUBLIC_OSM_OAUTH_AUTHORIZE_URL=https://osm.spatialcollective.co.ke/oauth2/authorize
NEXT_PUBLIC_OSM_OAUTH_TOKEN_URL=https://osm.spatialcollective.co.ke/oauth2/token
```

## JOSM Configuration Required

**ALL 61 MAPPERS MUST RECONFIGURE JOSM** to connect to the private server.

### Update Required in JOSM:
1. Open JOSM
2. Go to **Edit → Preferences**
3. Under **Connection Settings**:
   - Set OSM Server URL: `https://osm.spatialcollective.co.ke`
4. Under **OAuth**:
   - Re-authorize with new OAuth endpoints
   - Authorization URL: `https://osm.spatialcollective.co.ke/oauth2/authorize`
   - Access Token URL: `https://osm.spatialcollective.co.ke/oauth2/token`

### Deployment Scripts
Updated JOSM configuration scripts will be created in:
- **Windows**: `configure-josm-private-server.bat`
- **Linux/Mac**: `configure-josm-private-server.sh`

## Testing Checklist

- [ ] Verify changeset fetching works (check work dashboard)
- [ ] Test building counting accuracy
- [ ] Verify username verification API works
- [ ] Test mapper onboarding flow
- [ ] Check OAuth authentication for JOSM users
- [ ] Monitor for 429 rate limiting errors
- [ ] Verify timezone handling still works (EAT UTC+3)

## Rollout Plan

1. **Deploy Code Changes**: Push to production immediately
2. **Update Environment Variables**: Add OSM server URLs to Vercel
3. **Create JOSM Scripts**: Generate new configuration scripts
4. **Notify Mappers**: Send instructions for JOSM reconfiguration
5. **Monitor**: Watch for errors in work dashboards
6. **Support**: Help mappers troubleshoot connection issues

## Support

If mappers encounter issues:
- **Cannot connect to OSM**: Verify they're using osm.spatialcollective.co.ke
- **429 errors**: Ensure OAuth is configured in JOSM
- **Stats not updating**: Check timezone handling (should use EAT)

## Documentation Updates Needed

The following files contain references to public OSM and may need updates:
- `OSM_WIKI_PAGE.mediawiki` - Mapper profile links
- `DIGITIZERS_LIST.md` - User profile URLs
- `OSM_COMMUNITY_RESPONSE_PLAN.md` - Community links
- All JOSM configuration guides

---

**Migration Status**: ✅ Code updated, ready for deployment
**Last Updated**: January 2025

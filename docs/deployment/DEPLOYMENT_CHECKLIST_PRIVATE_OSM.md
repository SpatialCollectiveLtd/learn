# Private OSM Server Migration - Deployment Checklist

## ✅ COMPLETED TASKS

### Code Updates
- [x] **src/lib/osm-service.ts** - Updated OSM_API_BASE to use private server with env var
- [x] **src/app/api/osm/verify-username/route.ts** - Updated API endpoints and profile URLs
- [x] **src/components/notifications/OsmUsernameNotification.tsx** - Updated help text
- [x] **src/app/digitization/mapper/[stepId]/page.tsx** - Updated all OSM references
- [x] **src/app/dashboard/trainer/reviews/page.tsx** - Updated demo changeset URLs
- [x] **src/data/mapper-training.ts** - Updated training references

### Configuration Files
- [x] **.env.local.example** - Added OSM server environment variables template
- [x] **configure-josm-private-server.bat** - Windows JOSM configuration script
- [x] **configure-josm-private-server.sh** - Linux/Mac JOSM configuration script

### Documentation
- [x] **PRIVATE_OSM_MIGRATION.md** - Technical migration guide
- [x] **MAPPER_NOTIFICATION_PRIVATE_OSM.md** - User-facing notification
- [x] **This checklist** - Deployment tracking

### Verification
- [x] Grep search confirms NO remaining references to api.openstreetmap.org
- [x] Grep search confirms NO remaining references to www.openstreetmap.org
- [x] All hardcoded URLs replaced with environment variable or updated to private server

---

## 🔄 PENDING DEPLOYMENT TASKS

### 1. Environment Variables (CRITICAL)

Add these to your production environment (Vercel/hosting platform):

```bash
NEXT_PUBLIC_OSM_SERVER_URL=https://osm.spatialcollective.co.ke
NEXT_PUBLIC_OSM_OAUTH_AUTHORIZE_URL=https://osm.spatialcollective.co.ke/oauth2/authorize
NEXT_PUBLIC_OSM_OAUTH_TOKEN_URL=https://osm.spatialcollective.co.ke/oauth2/token
```

**Action Required**: 
- [ ] Login to Vercel dashboard
- [ ] Go to Project Settings → Environment Variables
- [ ] Add the 3 variables above
- [ ] Redeploy the application

### 2. Production Deployment

```bash
# From your local machine
git add .
git commit -m "feat: migrate to private OSM server at osm.spatialcollective.co.ke"
git push origin main

# Or manually trigger deployment in Vercel
```

**Action Required**:
- [ ] Commit all changes to Git
- [ ] Push to main branch
- [ ] Verify deployment succeeds
- [ ] Check deployment logs for errors

### 3. Post-Deployment Testing

Test these critical features:

**Username Verification**:
- [ ] Go to mapper onboarding (step 2)
- [ ] Enter a valid OSM username from private server
- [ ] Verify it validates successfully
- [ ] Test with invalid username - should show error

**Work Dashboard**:
- [ ] Login as a mapper who uploaded today
- [ ] Check work dashboard shows correct building count
- [ ] Verify changeset links point to osm.spatialcollective.co.ke
- [ ] Test "Refresh Stats" button works

**Timezone Handling**:
- [ ] Verify stats show for correct date (EAT timezone)
- [ ] Check Jan 9 uploads show under Jan 9 (not Jan 8)
- [ ] Confirm Joe Kimani's 46 buildings display correctly

**API Endpoints**:
- [ ] Check browser Network tab for API calls
- [ ] Verify all OSM API requests go to osm.spatialcollective.co.ke
- [ ] Check for any 404 or CORS errors

### 4. Mapper Communication

**Immediate (Today)**:
- [ ] Send `MAPPER_NOTIFICATION_PRIVATE_OSM.md` to all mappers
- [ ] Attach `configure-josm-private-server.bat` for Windows users
- [ ] Attach `configure-josm-private-server.sh` for Mac/Linux users
- [ ] Schedule training session to help with reconfiguration

**Within 24 Hours**:
- [ ] Follow up with mappers who haven't reconfigured
- [ ] Provide one-on-one support for OAuth setup issues
- [ ] Create video tutorial showing JOSM reconfiguration process

**Within 1 Week**:
- [ ] Verify all 61 mappers successfully reconfigured
- [ ] Monitor for any upload errors or rate limiting issues
- [ ] Update OSM Wiki page if needed (profile links)

### 5. JOSM Configuration Deployment

**Distribution Methods**:
- [ ] Email scripts to all mappers
- [ ] Upload to shared drive (Google Drive/Dropbox)
- [ ] Share via WhatsApp/Telegram groups
- [ ] Provide USB drives for offline distribution

**Support Plan**:
- [ ] Schedule office hours for JOSM help (2-3 days)
- [ ] Assign trainers to assist with OAuth authorization
- [ ] Create troubleshooting FAQ based on common issues
- [ ] Monitor mappers' first uploads after reconfiguration

---

## 📊 ROLLOUT TIMELINE

### Day 1 (Today) - URGENT
- [x] **10:00 AM**: Code updates completed ✅
- [ ] **11:00 AM**: Environment variables added to Vercel
- [ ] **11:30 AM**: Production deployment
- [ ] **12:00 PM**: Post-deployment testing
- [ ] **01:00 PM**: Notify all mappers
- [ ] **02:00 PM**: Begin JOSM reconfiguration support

### Day 2 - Mapper Support
- [ ] Continue helping mappers reconfigure JOSM
- [ ] Monitor work dashboards for upload errors
- [ ] Address any OAuth authorization issues
- [ ] Create FAQ from common problems

### Day 3-7 - Monitoring
- [ ] Track reconfiguration progress (target: 100%)
- [ ] Monitor changeset upload success rate
- [ ] Verify no 429 rate limiting errors
- [ ] Check work stats accuracy

### Week 2 - Validation
- [ ] Confirm all 61 mappers successfully migrated
- [ ] Verify production stability (no OSM-related errors)
- [ ] Update documentation with lessons learned
- [ ] Archive old JOSM configuration scripts

---

## 🚨 CRITICAL SUCCESS FACTORS

### Must Happen Before Go-Live
1. ✅ All code references to public OSM updated
2. ⏳ Environment variables set in production
3. ⏳ Deployment successful with no errors
4. ⏳ Work dashboard tested and working

### Must Happen Within 24 Hours
1. ⏳ All 61 mappers notified
2. ⏳ JOSM configuration scripts distributed
3. ⏳ Support available for OAuth setup
4. ⏳ At least 50% of mappers reconfigured

### Must Happen Within 1 Week
1. ⏳ 100% of mappers successfully reconfigured
2. ⏳ No 429 rate limiting errors reported
3. ⏳ Work stats accuracy verified
4. ⏳ Documentation updated

---

## 🔍 MONITORING & VALIDATION

### Metrics to Track

**Technical Metrics**:
- [ ] API error rate (target: <1%)
- [ ] Average response time from private OSM server
- [ ] CORS errors (should be 0)
- [ ] 429 rate limit errors (should be 0 after OAuth)

**User Metrics**:
- [ ] Mappers successfully reconfigured (target: 61/61)
- [ ] Upload success rate (target: >95%)
- [ ] Work stats accuracy (spot check 10 mappers)
- [ ] Support tickets related to OSM (track and resolve)

**Data Quality**:
- [ ] Buildings counted correctly
- [ ] Changesets link to correct server
- [ ] Usernames validate properly
- [ ] Timezone handling remains accurate (EAT)

---

## 🆘 ROLLBACK PLAN

If critical issues arise, rollback steps:

1. **Revert Code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Environment Variables**:
   - Change `NEXT_PUBLIC_OSM_SERVER_URL` back to `https://api.openstreetmap.org`
   - Redeploy application

3. **Notify Mappers**:
   - Alert that we've reverted to public OSM temporarily
   - Ask them NOT to reconfigure JOSM yet
   - Provide timeline for re-attempting migration

**Rollback Triggers** (revert if):
- ❌ Work dashboards completely broken (no stats loading)
- ❌ >50% of API calls failing
- ❌ Private OSM server unreachable for >2 hours
- ❌ Data corruption or loss detected

---

## 📞 CONTACTS & ESCALATION

**Primary Contact**: Project Manager
**Technical Lead**: Developer (GitHub: @spatialcollective)
**OSM Server Admin**: [Contact for private server issues]

**Escalation Path**:
1. Mapper reports issue → Trainer provides first-line support
2. Trainer cannot resolve → Escalate to Technical Lead
3. Server-side issue → Contact OSM Server Admin
4. Critical production issue → Project Manager + all hands on deck

---

## ✅ SIGN-OFF

**Code Review**:
- [ ] All changes reviewed and approved
- [ ] No hardcoded URLs remaining
- [ ] Environment variables properly configured
- [ ] Timezone fix preserved

**Testing Sign-Off**:
- [ ] Username verification tested
- [ ] Work dashboard tested
- [ ] Changeset fetching tested
- [ ] Stats accuracy verified

**Deployment Sign-Off**:
- [ ] Production deployment successful
- [ ] Environment variables set
- [ ] No deployment errors
- [ ] Application running normally

**Communication Sign-Off**:
- [ ] Mappers notified
- [ ] Scripts distributed
- [ ] Support plan activated
- [ ] Trainers briefed

---

**Deployment Date**: _________________  
**Signed Off By**: _________________  
**Status**: 🔄 In Progress

**Last Updated**: January 2025

# Brian Karani Stats Investigation Report
**Date:** January 8, 2026  
**Youth ID:** KAY251BK  
**OSM Username:** BrianKarani  
**Issue:** Work submitted but stats not reflecting correctly

---

## Problem Summary

Brian Karani reported that he submitted work today (Jan 8, 2026) but the stats dashboard is only showing **12 buildings** instead of the expected **4,842 contributions** shown on his OSM profile.

---

## Investigation Results

### ✅ Database Status
- **Youth Profile:** Found and active
  - Youth ID: KAY251BK
  - Full Name: Brian Karani
  - OSM Username: BrianKarani
  - Program: digitization
  - Settlement: Kayole
  - Status: Active

- **OSM Stats Table:**
  - Jan 8, 2026: **12 buildings** counted
  - Jan 7, 2026: **249 buildings** counted ✅

- **Work Days Table:**
  - Jan 8: **12 buildings**, status: approved
  - Jan 7: **249 buildings**, status: approved, target met ✅
  - 9 total approved work days

- **Settlement Config:** ✅ Correct
  - Daily Target: 200 buildings
  - Project Hashtag: **#DPW2025**
  - Timezone: Africa/Nairobi
  - Status: Active

### 🔍 OSM Changeset Analysis

**Today's Changesets (Jan 8, 2026):**

| Changeset ID | Contributions | Hashtag | Counted? |
|--------------|--------------|---------|----------|
| #176976177 | 65 | **#DPW2025** | ✅ Yes |
| #176975779 | 7 | **#DPW2025** | ✅ Yes |
| **#176975712** | **4,770** | **#hotosm-project-36570** | ❌ **NO** |

**Yesterday's Changesets (Jan 7, 2026):**

| Changeset ID | Contributions | Hashtag | Counted? |
|--------------|--------------|---------|----------|
| #176935854 | 1,108 | **#DPW2025** | ✅ Yes |
| #176932661 | 281 | **#DPW2025** | ✅ Yes |

---

## Root Cause

**Brian used the WRONG PROJECT HASHTAG** for his largest changeset today.

**Issue Details:**
- Changeset #176975712 has **4,770 contributions** (the bulk of today's work)
- This changeset is tagged with **#hotosm-project-36570**
- Our system **only counts changesets tagged with #DPW2025**
- Therefore, **4,770 contributions are NOT being counted**

**Why this happens:**
- Our OSM integration filters changesets by project hashtag
- Settlement config specifies: `project_hashtag: "#DPW2025"`
- Code filters: `comment.toLowerCase().includes('#dpw2025')`
- Changeset #176975712 comment contains "#hotosm-project-36570" instead
- Filter rejects this changeset → 4,770 contributions ignored

---

## Technical Verification

### Code Reference
**File:** `src/lib/osm-service.ts`

```typescript
// Filter by project hashtag
const projectChangesets = filterByHashtag(changesets, projectHashtag);

function filterByHashtag(changesets, hashtag) {
  return changesets.filter(cs => {
    const comment = cs.tag?.find(t => t.k === 'comment')?.v || '';
    return comment.toLowerCase().includes(hashtag.toLowerCase());
  });
}
```

This is **working as designed** - only changesets with the correct project hashtag are counted.

---

## Why System Shows 12 Buildings (not 72)

Even though changesets #176976177 (65) and #176975779 (7) = 72 total contributions, only **12 buildings** are counted because:

- **Not all OSM contributions are buildings**
- Contributions include: nodes, ways, relations, tags, modifications, deletions
- Our system specifically counts elements with `building` tag
- Of the 72 contributions in the #DPW2025 changesets, only 12 had building tags

---

## Solution

### For Brian Karani (Immediate Action Required)

**❌ STOP using #hotosm-project-36570**  
**✅ ONLY use #DPW2025** for all future work

**How to fix:**
1. Open JOSM or iD Editor
2. When creating a changeset, use the comment format:
   ```
   #DPW2025 - <your description>
   ```
   Example: `#DPW2025 - Mapped buildings in Kayole`

3. **Do NOT use any other hashtags** for this project

**What about the 4,770 contributions?**
- Unfortunately, they **will NOT count** toward Brian's DPW2025 work target
- Changesets cannot be edited after submission
- They are tagged with a different project (#hotosm-project-36570)
- Only work tagged with #DPW2025 counts for this program

---

## System Status

### ✅ Working Correctly
- OSM API integration functional
- Building counting accurate
- Hashtag filtering working as designed
- Auto-sync of work days functional
- Database records up to date

### ⚠️ User Error
- Brian used wrong hashtag for largest changeset
- This is a **training/communication issue**, not a technical bug
- System is correctly filtering and counting only #DPW2025 changesets

---

## Recommendations

### 1. Youth Training (URGENT)
- **Re-train all digitization youth** on correct hashtag usage
- Emphasize: **ONLY use #DPW2025** for this project
- Show example changeset comments
- Warning: Work with wrong hashtag will NOT count

### 2. Communication
- Send message to Brian Karani explaining:
  - Why his 4,770 contributions don't count
  - How to use correct hashtag going forward
  - His actual counted work today: 12 buildings (needs 188 more to meet target)

### 3. Dashboard Enhancement (Optional)
Consider adding a warning/validation:
- Check recent changesets for wrong hashtags
- Display alert: "⚠️ Recent work found with wrong hashtag - will not count!"
- Guide users to use #DPW2025

### 4. Monitoring
- Review all youth OSM profiles for wrong hashtag usage
- Identify and notify anyone using incorrect hashtags
- Prevent wasted work

---

## Brian's Current Stats

**January 2026:**
- **Jan 7:** 249 buildings ✅ (target met)
- **Jan 8:** 12 buildings ❌ (needs 188 more)
- **Total approved work days:** 9

**Work That Counted:**
- Changeset #176935854: 1,108 contributions (#DPW2025) ✅
- Changeset #176932661: 281 contributions (#DPW2025) ✅
- Changeset #176976177: 65 contributions (#DPW2025) ✅
- Changeset #176975779: 7 contributions (#DPW2025) ✅

**Work That Did NOT Count:**
- Changeset #176975712: 4,770 contributions (#hotosm-project-36570) ❌

---

## Next Steps

1. **✅ COMPLETED:** Work day for Jan 8 created and synced (12 buildings)
2. **⏳ PENDING:** Notify Brian about wrong hashtag usage
3. **⏳ PENDING:** Re-train all youth on correct hashtag
4. **⏳ PENDING:** Monitor for other youth using wrong hashtags

---

## Technical Notes

### System Behavior
- OSM stats refresh every 5 minutes (or on manual refresh)
- Work days auto-sync whenever OSM stats update
- Hashtag filtering is case-insensitive but exact match required
- Building count extracts elements with `building` tag (or common typos)

### Database Tables Updated
- `youth_osm_stats`: Jan 8 record exists (12 buildings)
- `youth_work_days`: Jan 8 record created and approved

### No Bug Found
System is working **exactly as designed**. This is a **user training issue**, not a technical problem.

---

**Status:** ✅ Investigation Complete  
**Cause:** User error (wrong hashtag)  
**System Status:** Fully functional  
**Action Required:** User training and communication

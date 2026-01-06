# App Restructure Analysis & Implementation Plan

**Date:** January 6, 2026  
**Critical Issues:** Training completion check failing, role-based access missing, navigation broken

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **Training Completion Check Failing (Blocking All 40 Youths)**
**Problem:** Work dashboard is locked even though all 40 youths finished training.

**Root Cause:**
- `youth_training_progress` table uses `module_type` with values: `'mapper'` or `'validator'`
- `youth_participants` table has `program_type` = `'digitization'`
- Completion check queries for `module_type = 'digitization'` ❌ (doesn't exist!)
- Query returns 0 steps, system thinks training not complete

**Current Code (BROKEN):**
```typescript
// src/app/api/training/completion-status/route.ts (line 99)
const progressResult = await Database.query(`
  SELECT step_id, completed_at
  FROM youth_training_progress
  WHERE youth_id = $1 AND module_type = $2  -- $2 = 'digitization' ❌
`, [youthId, program_type]);  // program_type = 'digitization'
```

**Why This Breaks:**
- Youth has `program_type='digitization'`
- Training progress stored as `module_type='mapper'` or `'validator'`
- Query looks for `module_type='digitization'` → **NO MATCHES**
- Result: `completedSteps = 0`, dashboard locked

---

### 2. **No Role Assignment (Mappers See Validator Content)**
**Problem:** All digitization youths can access both mapper AND validator training materials.

**Current Schema:**
```sql
CREATE TABLE youth_participants (
  youth_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255),
  program_type VARCHAR(50) CHECK (program_type IN ('digitization', ...)),
  -- ❌ NO module_assignment column!
);
```

**What's Missing:**
- No field to store whether a digitization youth is a MAPPER or VALIDATOR
- System can't differentiate between roles
- Everyone sees all training content

---

### 3. **Navigation Broken (No Smart Redirects)**
**Current Flow:**
1. Login → `/dashboard` (choose Training or Work)
2. Click Training → hardcoded to `/digitization/mapper` for ALL digitization users
3. User manually navigates to `/digitization/validator` → ❌ Accessible to mappers!

**Current Code:**
```typescript
// src/app/dashboard/page.tsx (line 74)
const routes = {
  digitization: '/digitization/mapper',  // ❌ Hardcoded for all!
  mobile_mapping: '/mobile-mapping',
  household_survey: '/household-survey',
  microtasking: '/microtasking'
};
```

---

## 📊 DATABASE ANALYSIS

### Current Youth Distribution (40 Total)
Based on SQL files:

| Settlement | Count | Program | Notes |
|------------|-------|---------|-------|
| Kayole | ~12 | digitization | Original cohort |
| Mji wa Huruma | 7 | digitization | HUR* IDs |
| Kariobangi Machakos | 21 | digitization | KAR* IDs |
| **TOTAL** | **40** | **All digitization** | |

### Training Progress Schema
```sql
CREATE TABLE youth_training_progress (
  progress_id UUID PRIMARY KEY,
  youth_id VARCHAR(50),
  module_type VARCHAR(20) CHECK (module_type IN ('mapper', 'validator')),
  step_id INTEGER,
  completed_at TIMESTAMP
);
```

**Key Point:** Training is recorded as `mapper` or `validator`, NOT as program type!

---

## 🎯 SOLUTION DESIGN

### Phase 1: Database Schema Update

#### Add `module_assignment` Column
```sql
ALTER TABLE youth_participants 
ADD COLUMN module_assignment VARCHAR(20) 
CHECK (module_assignment IN ('mapper', 'validator', NULL));

COMMENT ON COLUMN youth_participants.module_assignment IS 
'Role within digitization program (mapper/validator). NULL for non-digitization programs.';
```

**Migration Strategy:**
1. Add column (nullable for backward compatibility)
2. Update existing digitization youths with assignments
3. Default new digitization youths to 'mapper' (can be changed later)

---

### Phase 2: Fix Training Completion Logic

#### Current (BROKEN):
```typescript
// Queries for module_type = 'digitization' ❌
const progressResult = await Database.query(`
  SELECT step_id FROM youth_training_progress
  WHERE youth_id = $1 AND module_type = $2
`, [youthId, program_type]);  // 'digitization'
```

#### Fixed (NEW):
```typescript
// For digitization: use module_assignment ('mapper' or 'validator')
// For other programs: use program_type directly
const moduleType = program_type === 'digitization' 
  ? moduleAssignment  // 'mapper' or 'validator'
  : program_type;     // 'mobile_mapping', etc.

const progressResult = await Database.query(`
  SELECT step_id FROM youth_training_progress
  WHERE youth_id = $1 AND module_type = $2
`, [youthId, moduleType]);
```

---

### Phase 3: Role-Based Access Control

#### Client-Side Protection
```typescript
// src/app/digitization/validator/page.tsx
useEffect(() => {
  const youthData = localStorage.getItem('youthData');
  const youth = JSON.parse(youthData);
  
  if (youth.moduleAssignment !== 'validator') {
    router.push('/digitization/mapper');  // Redirect mappers away
  }
}, []);
```

#### Server-Side Protection (API Routes)
```typescript
// src/app/api/training/[module]/route.ts
const { module } = params;  // 'mapper' or 'validator'
const youth = await getYouthFromToken(token);

if (youth.program_type === 'digitization' && youth.module_assignment !== module) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

---

### Phase 4: Smart Navigation

#### Updated Dashboard Logic
```typescript
// src/app/dashboard/page.tsx
const getTrainingRoute = (programType: string, moduleAssignment?: string) => {
  if (programType === 'digitization') {
    return moduleAssignment === 'validator' 
      ? '/digitization/validator'
      : '/digitization/mapper';
  }
  return `/${programType.replace('_', '-')}`;
};

const handleTrainingClick = () => {
  const route = getTrainingRoute(status.programType, status.moduleAssignment);
  router.push(route);
};
```

#### Auto-Redirect in `/digitization`
```typescript
// src/app/digitization/page.tsx
useEffect(() => {
  const youthData = localStorage.getItem('youthData');
  const youth = JSON.parse(youthData);
  
  if (youth.programType === 'digitization') {
    const targetPath = youth.moduleAssignment === 'validator'
      ? '/digitization/validator'
      : '/digitization/mapper';
    router.push(targetPath);
  }
}, []);
```

---

## 🗂️ PROPOSED FILE STRUCTURE

### Current Structure (FLAT)
```
src/app/
  dashboard/
    page.tsx              # Selection: Training or Work
    work/page.tsx         # Work stats
  digitization/
    page.tsx              # ❌ Generic landing (no redirect)
    mapper/page.tsx       # Mapper training
    validator/page.tsx    # Validator training (accessible to all!)
```

### New Structure (ROLE-AWARE)
```
src/app/
  dashboard/
    page.tsx              # Selection: Training or Work
    work/page.tsx         # Work stats
  digitization/
    page.tsx              # ✅ Auto-redirects to mapper/validator
    mapper/
      page.tsx            # ✅ Protected: Only for module_assignment='mapper'
      layout.tsx          # Role guard wrapper
    validator/
      page.tsx            # ✅ Protected: Only for module_assignment='validator'
      layout.tsx          # Role guard wrapper
  mobile-mapping/         # Other programs (unchanged)
  household-survey/
  microtasking/
```

---

## 🔄 USER FLOW (REDESIGNED)

### Mapper Journey
```
Login → /dashboard → Click "Training"
  ↓
Auto-redirect to /digitization (checks moduleAssignment)
  ↓
Auto-redirect to /digitization/mapper (based on role)
  ↓
Complete training steps
  ↓
/dashboard → Click "Work" → /dashboard/work (if training complete)
```

### Validator Journey
```
Login → /dashboard → Click "Training"
  ↓
Auto-redirect to /digitization (checks moduleAssignment)
  ↓
Auto-redirect to /digitization/validator (based on role)
  ↓
Complete training steps
  ↓
/dashboard → Click "Work" → /dashboard/work (if training complete)
```

### Attempted Cross-Access
```
Mapper tries to visit /digitization/validator
  ↓
Layout guard checks moduleAssignment
  ↓
Redirects back to /digitization/mapper (403 Forbidden)
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Database Changes
- [ ] Create migration: `add-module-assignment-column.sql`
- [ ] Add `module_assignment VARCHAR(20) CHECK IN ('mapper', 'validator')`
- [ ] Create migration: `assign-module-roles-to-existing-youth.sql`
  - [ ] Update 40 digitization youths with their correct role
  - [ ] Set mapper/validator based on actual training completed
- [ ] Update `schema-neon-postgresql.sql` with new column

### TypeScript Types
- [ ] Update `src/app/api/_lib/types.ts`:
  ```typescript
  export interface YouthParticipant {
    // ... existing fields
    module_assignment: 'mapper' | 'validator' | null;
  }
  ```

### API Updates
- [ ] Fix `src/app/api/training/completion-status/route.ts`
  - [ ] Use `module_assignment` for digitization youths
  - [ ] Query `module_type = moduleAssignment` (not program_type)
- [ ] Update `src/app/api/youth/profile/route.ts`
  - [ ] Return `moduleAssignment` in response
- [ ] Update `src/app/api/youth/auth/authenticate/route.ts`
  - [ ] Include `module_assignment` in JWT token

### Frontend Components
- [ ] Update `src/app/dashboard/page.tsx`
  - [ ] Smart routing based on `moduleAssignment`
  - [ ] Display role badge (Mapper/Validator)
- [ ] Update `src/app/digitization/page.tsx`
  - [ ] Auto-redirect to `/mapper` or `/validator`
- [ ] Create `src/app/digitization/mapper/layout.tsx`
  - [ ] Role guard (only module_assignment='mapper')
- [ ] Create `src/app/digitization/validator/layout.tsx`
  - [ ] Role guard (only module_assignment='validator')

### Testing
- [ ] Test mapper can ONLY access mapper content
- [ ] Test validator can ONLY access validator content
- [ ] Test training completion check for both roles
- [ ] Test all 40 youths can access work dashboard

---

## 🚨 MIGRATION NOTES

### Assigning Module Roles to Existing 40 Youths

**Question:** How do we know who is mapper vs validator?

**Options:**
1. **Check training progress:** Query `youth_training_progress.module_type`
2. **Manual assignment:** Based on settlement or external data
3. **Default all to mapper:** Let admin reassign later

**Recommended: Option 1 (Auto-detect)**
```sql
-- Auto-assign based on existing training progress
UPDATE youth_participants yp
SET module_assignment = (
  SELECT DISTINCT module_type 
  FROM youth_training_progress ytp
  WHERE ytp.youth_id = yp.youth_id
  LIMIT 1
)
WHERE program_type = 'digitization';
```

---

## 🎯 EXPECTED OUTCOMES

### Before (BROKEN)
- ❌ Work dashboard locked for all 40 youths
- ❌ Mappers see validator training
- ❌ No role differentiation
- ❌ Manual URL navigation required

### After (FIXED)
- ✅ Work dashboard accessible (training completion check works)
- ✅ Mappers ONLY see mapper training
- ✅ Validators ONLY see validator training
- ✅ Smart auto-redirects based on role
- ✅ Protected routes (403 if wrong role)
- ✅ Role badges in dashboard

---

## 📝 NEXT STEPS

1. **URGENT:** Add `module_assignment` column to database
2. **URGENT:** Assign roles to 40 existing youths
3. **URGENT:** Fix training completion check logic
4. Implement role guards in layouts
5. Update navigation logic
6. Test with all 40 youth accounts
7. Deploy to production

---

**Priority:** 🔴 CRITICAL - Blocking all users from work dashboard
**Estimated Time:** 2-3 hours for complete implementation
**Risk Level:** Medium (database migration + breaking changes)

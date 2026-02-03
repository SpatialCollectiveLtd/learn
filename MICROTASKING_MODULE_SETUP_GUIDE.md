# Microtasking Module Setup Guide

**Created:** February 2, 2026  
**Purpose:** Comprehensive checklist for implementing the Microtasking training module

---

## Overview

Based on analysis of existing modules (Digitization and Mobile Mapping), this guide outlines all components needed to spin up the Microtasking module. The platform already has foundational support for microtasking in the database and API layers—what's missing is the frontend implementation and training content.

---

## ✅ Already Implemented (No Action Needed)

### Database Support
- ✅ `youth_participants.program_type` accepts `'microtasking'`
- ✅ `youth_training_progress.module_type` supports `'microtasking'`
- ✅ Training completion status API recognizes `microtasking` with 3 steps
- ✅ Dashboard routing includes microtasking case

### API Support
- ✅ [src/app/api/youth/training-progress/route.ts](src/app/api/youth/training-progress/route.ts#L126) validates `'microtasking'` module type
- ✅ [src/app/api/training/completion-status/route.ts](src/app/api/training/completion-status/route.ts#L27) defines 3 required steps: `[1, 2, 3]`
- ✅ Dashboard redirects to `/microtasking` for microtasking users

---

## 🔨 What You Need to Build

### 1. Training Content Data File

**File to Create:** `src/data/microtasking-training.ts`

**Reference:** [src/data/mobile-mapping-training.ts](src/data/mobile-mapping-training.ts) (simpler structure) or [src/data/mapper-training.ts](src/data/mapper-training.ts) (comprehensive)

**Required Structure:**
```typescript
export interface MicrotaskingStep {
  id: number;                    // 1, 2, 3
  title: string;                 // "Task Overview", "Completing Tasks", etc.
  shortTitle: string;            // "Overview", "Tasks", etc.
  estimatedTime: number;         // Minutes (e.g., 10, 15, 20)
  content: {
    introduction: string;        // Opening paragraph
    mainContent: Array<{
      type: 'text' | 'list' | 'warning' | 'tip' | 'image';
      content: string | string[];
      title?: string;
      imageAlt?: string;
      imagePath?: string;
    }>;
    keyTakeaways?: string[];     // Bullet points
  };
}

export const microtaskingSteps: MicrotaskingStep[] = [
  {
    id: 1,
    title: "Welcome to Microtasking",
    shortTitle: "Overview",
    estimatedTime: 10,
    content: {
      // ... Define training content
    }
  },
  // ... Steps 2 and 3
];
```

**Content to Define:**
- **Step 1**: Introduction to microtasking (what it is, why it matters, platform overview)
- **Step 2**: How to complete tasks (task selection, instructions, submission)
- **Step 3**: Quality standards and best practices

**Questions for You:**
1. What platform/tool will youth use for microtasking? (e.g., custom platform, Tasking Manager, etc.)
2. What types of tasks will they perform? (e.g., image classification, data validation, tagging)
3. Is there a specific workflow or tool URL they need to access?
4. Are there quality metrics or performance targets?

---

### 2. Frontend Pages

#### 2.1 Module Overview Page

**File to Create:** `src/app/microtasking/page.tsx`

**Reference:** [src/app/mobile-mapping/page.tsx](src/app/mobile-mapping/page.tsx) (simple) or [src/app/digitization/mapper/page.tsx](src/app/digitization/mapper/page.tsx) (with progress tracking)

**Components Needed:**
- Import `microtaskingSteps` from data file
- Display all 3 training steps with completion status
- Show progress: X/3 steps completed
- Link each step to `/microtasking/[stepId]`
- Calculate total training time
- Use existing UI components: `BackgroundBeams`, `FloatingHeader`, `CometCard`

**Key Features:**
```tsx
- Progress tracking via localStorage: 'microtasking-completed-steps'
- Check completion status from API: '/api/youth/training-progress?module=microtasking'
- Sequential step unlocking (must complete step N before N+1)
- Visual indicators: CheckCircle2 (completed), Circle (not started), Lock (locked)
```

#### 2.2 Individual Step Pages

**File to Create:** `src/app/microtasking/[stepId]/page.tsx`

**Reference:** [src/app/mobile-mapping/[stepId]/page.tsx](src/app/mobile-mapping/[stepId]/page.tsx)

**Components Needed:**
- Dynamic route parameter: `stepId` (1, 2, or 3)
- Fetch step content from `microtaskingSteps` array
- Render content based on type: text, list, warning, tip, image
- "Mark as Complete" button → POST to `/api/youth/training-progress`
  ```typescript
  await axios.post('/api/youth/training-progress', {
    moduleType: 'microtasking',
    stepId: currentStep
  });
  ```
- Navigation: Previous/Next step buttons
- Progress indicator: Step X of 3

**Content Rendering Pattern:**
```tsx
{step.content.mainContent.map((block, index) => {
  switch (block.type) {
    case 'text': return <p>{block.content}</p>;
    case 'list': return <ul>{block.content.map(item => <li>{item}</li>)}</ul>;
    case 'warning': return <div className="warning">{block.content}</div>;
    case 'tip': return <div className="tip">{block.content}</div>;
    case 'image': return <img src={block.imagePath} alt={block.imageAlt} />;
  }
})}
```

---

### 3. Work Dashboard (Optional)

**File to Create:** `src/app/microtasking/work/page.tsx` (if microtasking has work tracking)

**Reference:** [src/app/mobile-mapping/work/page.tsx](src/app/mobile-mapping/work) or [src/app/dashboard/work/page.tsx](src/app/dashboard/work/page.tsx)

**Questions for You:**
1. Does microtasking have a "work period" like digitization (20 days)?
2. How is work measured? (tasks completed, items validated, hours worked?)
3. Is there a daily target?
4. Do trainers approve work days?
5. Is work data auto-synced from an external platform or manually entered?

**If Work Tracking is Needed:**
- Create work dashboard showing daily progress
- Integrate with `youth_work_days` table
- Define `settlement_work_config` for microtasking:
  ```sql
  INSERT INTO settlement_work_config (settlement, program_type, daily_target, total_work_days)
  VALUES ('Kayole Soweto', 'microtasking', 50, 20);  -- Example: 50 tasks/day
  ```
- Update dashboard routing logic

---

### 4. Database Setup

#### 4.1 Settlement Work Configuration

**If microtasking has work tracking**, add config for each settlement:

```sql
-- Example: Configure microtasking work period for Kayole Soweto
INSERT INTO settlement_work_config (
  settlement,
  program_type,
  start_date,
  total_work_days,
  daily_target,
  project_hashtag,
  is_active
) VALUES (
  'Kayole Soweto',
  'microtasking',
  '2026-02-10',      -- Adjust to actual start date
  20,                -- 20-day work period
  50,                -- Example: 50 tasks per day
  '#Microtasking2026',
  TRUE
);

-- Repeat for other settlements
```

#### 4.2 Contract Template (Optional)

**If microtasking requires contracts**, create template:

```sql
INSERT INTO contract_templates (
  program_type,
  version,
  title,
  content,
  is_active
) VALUES (
  'microtasking',
  'v1.0',
  'Microtasking Program Agreement',
  '... contract content ...',
  TRUE
);
```

---

### 5. Dashboard Integration

#### 5.1 Update Dashboard Routing

**File:** [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx#L82)

The routing logic is **already implemented** ✅:
```tsx
const routes: Record<string, string> = {
  mobile_mapping: '/mobile-mapping',
  household_survey: '/household-survey',
  microtasking: '/microtasking',  // Already present!
};
```

#### 5.2 Update Work Dashboard Routing (if applicable)

**File:** [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx#L95)

If microtasking has a work dashboard, add routing:
```tsx
const handleWorkClick = () => {
  if (!status?.canAccessWorkDashboard) return;
  
  if (status.programType === 'mobile_mapping') {
    router.push('/mobile-mapping/work');
  } else if (status.programType === 'microtasking') {
    router.push('/microtasking/work');  // Add this
  } else {
    router.push('/dashboard/work');
  }
};
```

---

### 6. Testing Checklist

Once implemented, test the following:

#### 6.1 Training Flow
- [ ] Youth can access `/microtasking` page
- [ ] Step 1 is unlocked by default
- [ ] Steps 2-3 are locked until previous step completed
- [ ] Clicking step navigates to `/microtasking/[stepId]`
- [ ] Step content renders correctly (text, lists, tips, warnings)
- [ ] "Mark as Complete" button works
- [ ] Progress persists in localStorage and database
- [ ] Completion status API returns correct data: `GET /api/youth/training-progress?module=microtasking`

#### 6.2 Dashboard Integration
- [ ] Microtasking users see correct "Training" button on dashboard
- [ ] Dashboard redirects to `/microtasking` when clicked
- [ ] Training completion unlocks work dashboard (if applicable)
- [ ] `GET /api/training/completion-status` validates 3 steps completed

#### 6.3 Work Tracking (if implemented)
- [ ] Work dashboard displays correctly
- [ ] Daily targets and progress show accurate data
- [ ] Settlement work config is applied correctly
- [ ] Work days sync with database

#### 6.4 Scripts to Run
```bash
# Check training progress
node -e "require('dotenv').config({path:'.env.local'}); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); (async()=>{const res=await pool.query('SELECT * FROM youth_training_progress WHERE module_type=\\'microtasking\\''); console.log(res.rows); await pool.end();})();"

# Check microtasking users
node -e "require('dotenv').config({path:'.env.local'}); const {Pool}=require('pg'); const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); (async()=>{const res=await pool.query('SELECT youth_id, full_name, settlement FROM youth_participants WHERE program_type=\\'microtasking\\''); console.log(res.rows); await pool.end();})();"

# Test completion status API
node scripts/test-completion-status.js  # Create this script if needed
```

---

## 📋 Summary of Files to Create/Modify

### New Files to Create
1. ✅ **`src/data/microtasking-training.ts`** - Training content (3 steps)
2. ✅ **`src/app/microtasking/page.tsx`** - Module overview page
3. ✅ **`src/app/microtasking/[stepId]/page.tsx`** - Individual step pages
4. ⚠️ **`src/app/microtasking/work/page.tsx`** - Work dashboard (if needed)

### Files to Modify
- ⚠️ **`src/app/dashboard/page.tsx`** - Only if work dashboard routing needed (training routing already exists)
- ⚠️ **Database** - Add settlement work configs (if work tracking needed)
- ⚠️ **Database** - Add contract template (if contracts needed)

### No Changes Needed
- ✅ API routes (already support microtasking)
- ✅ Training progress tracking (already configured for 3 steps)
- ✅ Database schema (already has microtasking support)
- ✅ Dashboard training routing (already implemented)

---

## 🎯 Next Steps

### Critical Information Needed from You:

1. **Training Content**:
   - What should each of the 3 steps teach?
   - What platform/tools will youth use?
   - Are there external links or resources?
   - Any images/screenshots needed?

2. **Work Tracking**:
   - Does microtasking have a work period? (Yes/No)
   - If yes:
     - How is work measured? (tasks completed, items validated, etc.)
     - Daily target? (e.g., 50 tasks/day)
     - Work period duration? (20 days like digitization?)
     - Auto-sync from external platform or manual entry?

3. **Contracts**:
   - Do microtasking participants need to sign contracts? (Yes/No)
   - If yes, provide contract text

4. **Settlement Assignment**:
   - Which settlements offer microtasking?
   - All 3 (Kayole, Kariobangi, Huruma) or specific ones?

---

## 📚 Reference Documentation

- **Module Implementation Examples**:
  - Simple: [Mobile Mapping](src/app/mobile-mapping) - 4 steps, basic workflow
  - Complex: [Digitization](src/app/digitization) - Split into mapper/validator, 7 steps
  
- **Training Data Examples**:
  - Simple: [mobile-mapping-training.ts](src/data/mobile-mapping-training.ts)
  - Complex: [mapper-training.ts](src/data/mapper-training.ts)
  
- **API Documentation**:
  - Training Progress: [src/app/api/youth/training-progress/route.ts](src/app/api/youth/training-progress/route.ts)
  - Completion Status: [src/app/api/training/completion-status/route.ts](src/app/api/training/completion-status/route.ts)
  
- **Database Schema**: [docs/PLATFORM_DOCUMENTATION.md](docs/PLATFORM_DOCUMENTATION.md#41-core-tables)

---

## ⚡ Quick Start (Once You Provide Content)

Once you provide the training content and work tracking details:

1. **Create training data file** (~30 min)
2. **Create overview page** (~45 min)
3. **Create step pages** (~1 hour)
4. **Set up work dashboard** if needed (~2 hours)
5. **Configure database** (~15 min)
6. **Test full flow** (~1 hour)

**Total Estimated Time:** 4-6 hours of development work

---

**Ready to proceed?** Please provide the training content outline and work tracking requirements, and I'll help you build the components!

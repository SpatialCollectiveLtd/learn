# Mobile Mapping Users - Comprehensive Analysis

**Date:** February 2, 2026  
**Prepared for:** Full Stack Developer & UI Designer  
**Purpose:** Complete understanding of mobile mapping system architecture, users, and workflows

---

## 📊 MOBILE MAPPING USERS BY SETTLEMENT

### Total Mobile Mappers: **181 users**

| Settlement | Total Users | With ODK Setup | Percentage |
|------------|-------------|----------------|------------|
| **Kayole Soweto** | 100 | 95 | 95% |
| **Kariobangi Machakos** | 53 | 38 | 72% |
| **Mji wa Huruma** | 28 | 19 | 68% |

**Key Insights:**
- Kayole Soweto has the highest adoption with 95% ODK configuration
- 153 out of 181 (85%) total users have ODK configured
- 28 users (15%) still need ODK setup

---

## 🗄️ DATABASE SCHEMA

### `youth_participants` Table Structure

```sql
youth_id - character varying (PRIMARY KEY, e.g., KAY1278MK, KAR119BN, HUR728CM)
full_name - character varying
email - character varying
phone_number - character varying
program_type - character varying ('mobile_mapping', 'digitization', 'household_survey', 'microtasking')
is_active - boolean
created_at - timestamp with time zone
updated_at - timestamp with time zone
last_login - timestamp with time zone
osm_username - character varying
settlement - character varying ('Kayole Soweto', 'Kariobangi Machakos', 'Mji wa Huruma')
module_assignment - character varying (for digitization: 'mapper' or 'validator')
exception_hashtags - ARRAY
work_email - character varying
odk_token - text (QR code configuration token)
odk_actor_id - integer (ODK Central actor ID)
odk_configured_at - timestamp with time zone
```

### Related Tables

1. **`users` table** - Separate authentication system
   - `id` (integer) - Primary key
   - `email`, `name`, `role`, `is_active`, timestamps
   - **NOTE:** No direct `youth_id` foreign key - youth authenticate using `youth_id` directly

2. **`youth_training_progress` table**
   - `progress_id`, `youth_id`, `step_id`, `module_type`, `completed_at`, `updated_at`
   
3. **`youth_work_days` table**
   - Tracks daily work submissions for mobile mapping
   
4. **`youth_work_summary` table**
   - Aggregated work statistics

5. **`attendance_records` table**
   - Training attendance tracking

---

## 🔐 AUTHENTICATION FLOW

### Youth Login Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS YOUTH ID AT LOGIN PAGE                          │
│    Route: src/app/page.tsx                                      │
│    Input: Youth ID (e.g., KAY1278MK)                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST TO AUTHENTICATION API                                   │
│    API: POST /api/youth/auth/authenticate                       │
│    File: src/app/api/youth/auth/authenticate/route.ts          │
│                                                                  │
│    Validation:                                                   │
│    ✅ Normalize to uppercase (KAY1278MK)                        │
│    ✅ Regex pattern: /^(KAY|KAR|HUR)[A-Z0-9]+$/i               │
│    ✅ Rate limiting: max 5 failed attempts in 15 min           │
│    ✅ Check youth_participants.is_active = true                 │
│    ✅ Update last_login timestamp                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. JWT TOKEN GENERATION                                         │
│    Using: process.env.learn_STACK_SECRET_SERVER_KEY             │
│    Payload includes:                                             │
│    - youthId                                                     │
│    - fullName                                                    │
│    - email                                                       │
│    - programType (e.g., 'mobile_mapping')                       │
│    - moduleAssignment                                            │
│    - userType: 'youth'                                           │
│    Expiry: 24h (JWT_EXPIRES_IN)                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. STORE IN LOCALSTORAGE                                        │
│    localStorage.setItem('youthToken', token)                    │
│    localStorage.setItem('youthData', JSON.stringify(youth))     │
│    localStorage.setItem('userType', 'youth')                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. REDIRECT TO DASHBOARD SELECTION                              │
│    Route: /dashboard                                             │
│    File: src/app/dashboard/page.tsx                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 DASHBOARD ROUTING LOGIC

### How System Decides Which Dashboard to Serve

```
┌──────────────────────────────────────────────────────────────────┐
│ USER LANDS ON: /dashboard                                        │
│ File: src/app/dashboard/page.tsx                                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ FETCH TRAINING STATUS                                             │
│ API: GET /api/training/completion-status                          │
│ Auth: Bearer token from localStorage                              │
│                                                                    │
│ Response includes:                                                 │
│ - programType: 'mobile_mapping' | 'digitization' | etc.          │
│ - moduleAssignment: 'mapper' | 'validator' (for digitization)    │
│ - settlement: 'Kayole Soweto' | 'Kariobangi Machakos' | etc.    │
│ - trainingCompleted: boolean                                       │
│ - canAccessWorkDashboard: boolean                                 │
│ - progress: { total, completed, percentage, missingSteps }        │
│ - hasOsmUsername: boolean                                          │
│ - requiresOsmUsername: boolean                                     │
└───────────────────────┬──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ DISPLAY TWO MAIN OPTIONS                                          │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📚 TRAINING DASHBOARD (Always Available)                   │  │
│ │    Shows: Progress bar, remaining steps                    │  │
│ │    Routes based on programType:                            │  │
│ │                                                             │  │
│ │    IF programType === 'mobile_mapping'                     │  │
│ │       → /mobile-mapping                                    │  │
│ │                                                             │  │
│ │    IF programType === 'digitization'                       │  │
│ │       AND moduleAssignment === 'validator'                 │  │
│ │       → /digitization/validator                            │  │
│ │       ELSE → /digitization/mapper                          │  │
│ │                                                             │  │
│ │    IF programType === 'household_survey'                   │  │
│ │       → /household-survey                                  │  │
│ │                                                             │  │
│ │    IF programType === 'microtasking'                       │  │
│ │       → /microtasking                                      │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 💼 WORK DASHBOARD (Conditional Access)                     │  │
│ │    Enabled ONLY if:                                        │  │
│ │    ✅ trainingCompleted === true                           │  │
│ │    ✅ hasOsmUsername === true (if required)                │  │
│ │                                                             │  │
│ │    Routes based on programType:                            │  │
│ │                                                             │  │
│ │    IF programType === 'mobile_mapping'                     │  │
│ │       → /mobile-mapping/work                               │  │
│ │                                                             │  │
│ │    ELSE                                                     │  │
│ │       → /dashboard/work                                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📧 EMAIL DASHBOARD (Digitization only - Shows if           │  │
│ │    programType === 'digitization')                         │  │
│ │    → Opens email client with work_email                    │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📱 MOBILE MAPPING TRAINING PAGE

### Route: `/mobile-mapping`
**File:** `src/app/mobile-mapping/page.tsx`

### Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ MOBILE MAPPING TRAINING OVERVIEW                                 │
│                                                                   │
│ Header:                                                           │
│ - Settlement name: "Kayole Soweto Data Collection"              │
│ - Stats: X Steps | ~Y min | Z/X Done                            │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 ODK SETUP QR CODE (Prominent at top)                     │ │
│ │                                                              │ │
│ │ IF user has ODK configured:                                 │ │
│ │   ✅ Display name: "denis_gitahi - Kayole Soweto"          │ │
│ │   🔲 "Tap to Show QR Code" button                          │ │
│ │   → Shows QR code when clicked (250x250px)                 │ │
│ │   → Scanning instructions                                  │ │
│ │                                                              │ │
│ │ ELSE:                                                        │ │
│ │   ⚠️ "ODK Setup Required" message                          │ │
│ │   → Instructions to contact trainer                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ TRAINING STEPS LIST                                         │ │
│ │                                                              │ │
│ │ Step 1: Welcome to Mobile Mapping [3 min]                  │ │
│ │ Step 2: Install ODK Collect [5 min]                        │ │
│ │ Step 3: Setup ODK (QR Code) [5 min]                        │ │
│ │ Step 4: Understanding Forms [10 min]                       │ │
│ │ Step 5: Field Work Safety [8 min]                          │ │
│ │ Step 6: Completing Forms [15 min]                          │ │
│ │ Step 7: Submit & Track Work [5 min]                        │ │
│ │ Step 8: Troubleshooting [8 min]                            │ │
│ │                                                              │ │
│ │ Each card shows:                                            │ │
│ │ - Progress indicator (✓ if completed)                      │ │
│ │ - Estimated time                                            │ │
│ │ - Brief description                                         │ │
│ │ - "Start" or "Continue" button                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ FORMS GUIDE SECTION (Expandable)                           │ │
│ │                                                              │ │
│ │ Kayole Soweto Forms:                                        │ │
│ │ - Kayole Soweto OSM Buildings (v2.0) - 8 questions         │ │
│ │   → Expand to see detailed question breakdown              │ │
│ │   → Shows which questions are required                     │ │
│ │                                                              │ │
│ │ Kariobangi Machakos Forms:                                  │ │
│ │ - Kariobangi Machakos OSM Buildings (v3.0) - 8 questions   │ │
│ │                                                              │ │
│ │ Mji wa Huruma Forms:                                        │ │
│ │ - Huruma Buildings (v2.0) - 8 questions                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Training Data Structure

**File:** `src/data/mobile-mapping-training.ts`

- **Dynamic content** based on settlement name
- Function: `getMobileMappingSteps(settlementName)`
- Default: "Kayole Soweto"
- 8 steps total, ~60 minutes combined
- Each step has:
  - `id`, `title`, `shortTitle`, `estimatedTime`
  - `content`: { introduction, mainContent[], keyTakeaways[] }
  - Content types: text, list, warning, tip, image

### Individual Step Pages

**Route:** `/mobile-mapping/[stepId]`
**File:** `src/app/mobile-mapping/[stepId]/page.tsx`

- Displays full step content
- Progress tracking
- Previous/Next navigation
- Mark as complete button
- Stores completion in localStorage: `mobile-mapping-completed-steps`

---

## 💼 MOBILE MAPPING WORK DASHBOARD

### Route: `/mobile-mapping/work`
**File:** `src/app/mobile-mapping/work/page.tsx`

### Access Control

```javascript
// Checks before allowing access:
1. User must have valid JWT token
2. User must have programType === 'mobile_mapping'
3. Training must be completed (trainingCompleted === true)

// If any check fails:
→ Redirect to /dashboard or /mobile-mapping
```

### Dashboard Features

```
┌─────────────────────────────────────────────────────────────────┐
│ MOBILE MAPPING WORK DASHBOARD                                    │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ USER PROFILE CARD                                           │ │
│ │ - Full name                                                 │ │
│ │ - Youth ID                                                  │ │
│ │ - Settlement                                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CURRENT WORK DAY HIGHLIGHT                                  │ │
│ │                                                              │ │
│ │    Day  15  of 20                                           │ │
│ │    (Large, prominent display)                               │ │
│ │                                                              │ │
│ │ Calculation logic:                                          │ │
│ │ - Counts weekdays only (Mon-Fri)                           │ │
│ │ - From start_date in youth_work_days                       │ │
│ │ - Nairobi timezone (UTC+3)                                 │ │
│ │ - Max 20 work days total                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ WORK DAYS PROGRESS                                          │ │
│ │                                                              │ │
│ │ Days Completed: X / 20                                      │ │
│ │ Progress bar: XX%                                           │ │
│ │ Remaining: Y days                                           │ │
│ │                                                              │ │
│ │ Data from: GET /api/work/days/count?programType=mobile_mapping │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ TARGET INFORMATION                                          │ │
│ │                                                              │ │
│ │ Target per day: Based on settlement config                 │ │
│ │ Your average: X buildings/day                              │ │
│ │ Status: On track / Behind / Ahead                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Refresh button: Re-fetch data from API                           │
│ Back button: Return to /dashboard                                │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints Used

1. **GET `/api/training/completion-status`**
   - Check access permissions
   - Verify training completion

2. **GET `/api/youth/profile`**
   - Get youth details (name, ID, settlement)

3. **GET `/api/work/days/count?programType=mobile_mapping`**
   - Returns:
     ```json
     {
       "daysWorked": 15,
       "totalDays": 20,
       "remaining": 5,
       "percentage": 75,
       "startDate": "2026-01-15",
       "currentDay": 15
     }
     ```

---

## 🎨 UI/UX DESIGN PATTERNS

### Theme & Colors

```css
Primary: #dc2626 (Red) - Used for branding, CTAs, highlights
Background: #000000 (Black) - Main background
Background Card: #1F2121 - Card backgrounds
Border: #2a2a2a / #262626 - Subtle borders
Foreground: #ffffff (White) - Primary text
Foreground Muted: #a3a3a3 - Secondary text
Foreground Subtle: #737373 - Tertiary text
```

### Component Library

1. **BackgroundBeams** - Animated background effect
2. **CometCard** - Animated card with comet trail effect
3. **FloatingHeader** - Sticky header with back button
4. **QRCodeDisplay** - QR code generator component

### Icons

- Library: `lucide-react`
- Examples: `Smartphone`, `QrCode`, `CheckCircle2`, `BookOpen`, `Calendar`, `User`

### Typography

- Headings: `font-heading` class (bold, larger)
- Subheadings: `font-subheading` class (medium weight)
- Body: Default font

### Responsive Design

- Mobile-first approach
- Containers: `max-w-lg`, `max-w-2xl`, `max-w-4xl`
- Grid: `md:grid-cols-2`, `md:grid-cols-3`
- Padding: `px-4 sm:px-6 lg:px-8`

---

## 🔄 KEY USER WORKFLOWS

### Workflow 1: New Mobile Mapper Onboarding

```
1. Admin creates youth in youth_participants table
   - youth_id, full_name, program_type='mobile_mapping', settlement
   - is_active=true

2. Youth receives youth_id (e.g., KAY1278MK)

3. Youth logs in at / (login page)
   - Enters youth_id
   - System validates and creates JWT

4. Redirected to /dashboard
   - System checks training status
   - Shows "Training Dashboard" and "Work Dashboard" (locked)

5. Youth clicks "Training Dashboard"
   - Redirected to /mobile-mapping
   - Sees 8 training steps

6. Youth requests ODK setup from trainer
   - Trainer runs registration script
   - youth_participants.odk_actor_id and odk_token set

7. Youth refreshes /mobile-mapping
   - QR code now visible
   - Scans QR code with ODK Collect app

8. Youth completes training steps (1-8)
   - Progress stored in localStorage
   - Also synced to youth_training_progress table

9. All steps completed
   - trainingCompleted = true
   - "Work Dashboard" unlocks

10. Youth clicks "Work Dashboard"
    - Redirected to /mobile-mapping/work
    - Sees current work day, progress, targets
```

### Workflow 2: Daily Work Routine

```
1. Youth logs into platform
   - JWT validated

2. Navigates to /dashboard
   - Clicks "Work Dashboard"

3. Views /mobile-mapping/work
   - Checks current work day (e.g., Day 15 of 20)
   - Views progress: 15/20 days completed

4. Opens ODK Collect on phone
   - Fills forms in the field
   - Submits when has internet

5. Returns to /mobile-mapping/work
   - Clicks refresh to see updated count
   - Data synced from ODK Central

6. Repeats for 20 work days
```

---

## 🛠️ TECHNICAL IMPLEMENTATION NOTES

### Authentication Helpers

**File:** `src/app/api/_lib/auth.ts`

```typescript
// Verify youth JWT token
export function verifyYouthToken(token: string): {
  youthId: string;
  [key: string]: any;
}

// Verify staff JWT token
export function verifyStaffToken(token: string): {
  staffId: string;
  role: string;
  [key: string]: any;
}
```

### Youth Model

**File:** `src/app/api/_lib/YouthModel.ts`

```typescript
class YouthModel {
  static async findById(youthId: string)
  static async updateLastLogin(youthId: string)
  static async hasSignedContract(youthId: string)
  // ... other methods
}
```

### Database Helper

**File:** `src/app/api/_lib/database.ts`

```typescript
// For API routes (Next.js App Router)
import { Database } from '@/app/api/_lib/database';

const result = await Database.query(
  'SELECT * FROM youth_participants WHERE youth_id = $1',
  [youthId]
);
```

**File:** `src/lib/db.ts`

```typescript
// For non-route server utilities
import pool from '@/lib/db';

const result = await pool.query(
  'SELECT * FROM youth_participants WHERE program_type = $1',
  ['mobile_mapping']
);
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
# or
learn_DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
# or
learn_STACK_SECRET_SERVER_KEY=your-secret-key

# API Keys
DPW_MANAGER_API_KEY=...
REDIS_URL=... (optional)
```

---

## 🎯 SUMMARY FOR FULL STACK DEVELOPER

### What You Need to Know

1. **181 mobile mappers** across 3 settlements
   - Kayole Soweto: 100 users (55%)
   - Kariobangi Machakos: 53 users (29%)
   - Mji wa Huruma: 28 users (16%)

2. **Authentication is youth_id based**
   - No separate user accounts for youth
   - JWT tokens contain youth data
   - 24-hour token expiration

3. **Dashboard routing is smart**
   - `/dashboard` checks training status
   - Routes to program-specific training pages
   - Work dashboard unlocks after training completion

4. **Mobile mapping has 2 main pages**
   - `/mobile-mapping` - Training overview with 8 steps
   - `/mobile-mapping/work` - Work tracking dashboard

5. **ODK integration is central**
   - QR codes for easy app setup
   - Forms are settlement-specific
   - Data synced from ODK Central

6. **Work tracking is automatic**
   - 20-day work period
   - Weekdays only (Mon-Fri)
   - Progress calculated from start_date

---

## ❓ QUESTIONS FOR CLARIFICATION

Before proceeding with any changes or new features, please clarify:

1. **User Management:**
   - Should we add bulk user import/export functionality?
   - Is there a need for user profile editing by youth themselves?

2. **ODK Setup:**
   - What's the process for the 28 users without ODK setup?
   - Should there be automated reminders for incomplete ODK configuration?

3. **Work Dashboard:**
   - Should we add daily building count goals?
   - Is there a leaderboard or performance comparison feature needed?

4. **Training:**
   - Can youth retake completed training steps?
   - Should there be certificates upon completion?

5. **Settlement-Specific Features:**
   - Are there different requirements per settlement beyond forms?
   - Should each settlement have custom branding/colors?

6. **Reporting:**
   - Do trainers need dashboards to monitor youth progress?
   - What metrics are most important to track?

---

**Document Status:** ✅ Complete  
**Next Steps:** Awaiting your feedback and questions  
**Ready for:** Development planning, feature additions, UI/UX improvements

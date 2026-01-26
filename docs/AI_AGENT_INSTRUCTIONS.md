# AI Agent Onboarding Instructions
# SC Training Hub - Spatial Collective Learning Platform

**Last Updated:** January 26, 2026  
**Version:** 2.0.0  
**Platform:** Next.js 15 + React 19 + PostgreSQL (Neon)

---

## 🎯 Platform Overview

SC Training Hub is a comprehensive youth employment and training management platform developed by **Spatial Collective Limited** for youth in Nairobi's informal settlements. The platform manages training, work tracking, attendance, contract management, and communication.

### Key Metrics
- **Youth Participants:** ~300 across 3 settlements
- **Settlements:** Kayole Soweto, Kariobangi Machakos, Mji wa Huruma
- **Training Modules:** 4 (Digitization, Mobile Mapping, Household Survey, Microtasking)
- **Staff:** ~15 (Trainers, Admins, SuperAdmins)
- **Production URL:** https://learn.spatialcollective.co.ke

---

## 🏗️ System Architecture

### Technology Stack
```
Frontend:  Next.js 15 + React 19 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes (serverless)
Database:  PostgreSQL (Neon - serverless)
Hosting:   Vercel
External:  Private OSM Server (osm.spatialcollective.co.ke)
```

### Directory Structure
```
learn/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── staff/
│   │   │   │   ├── attendance/     # ✨ Attendance API (POST, GET, DELETE)
│   │   │   │   ├── auth/
│   │   │   │   └── manage/
│   │   │   ├── youth/
│   │   │   ├── work/
│   │   │   └── _lib/               # Shared utilities (Database, Auth)
│   │   ├── dashboard/
│   │   │   ├── staff/
│   │   │   │   ├── attendance/     # ✨ Attendance UI
│   │   │   │   └── page.tsx
│   │   │   ├── admin/
│   │   │   ├── youth/
│   │   │   └── work/
│   │   └── ...
├── database/
│   ├── schema-neon-postgresql.sql  # Main schema
│   └── migrations/
│       └── add-attendance-table.sql # ✨ Attendance migration
├── docs/
│   ├── PLATFORM_DOCUMENTATION.md
│   └── AI_AGENT_INSTRUCTIONS.md   # ✨ This file
└── scripts/                        # Database scripts
```

---

## 📊 Database Schema

### Core Tables

#### 1. `youth_participants`
Primary table for youth participant data.
```sql
CREATE TABLE youth_participants (
  youth_id VARCHAR(50) PRIMARY KEY,       -- e.g., KAY1278MK, KAR119BN
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  program_type VARCHAR(50) NOT NULL,      -- digitization, mobile_mapping, etc.
  settlement VARCHAR(100),                -- Kayole, Kariobangi, Huruma
  osm_username VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Youth ID Format:**
- `KAY####XX` - Kayole Soweto
- `KAR####XX` - Kariobangi Machakos
- `HUR####XX` - Mji wa Huruma

#### 2. `staff_members`
Staff and administrator accounts.
```sql
CREATE TABLE staff_members (
  staff_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  role VARCHAR(20) NOT NULL,              -- trainer, admin, superadmin
  created_by VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Roles:**
- `trainer` - Field supervisors, can record attendance
- `admin` - Can manage staff and access admin dashboard
- `superadmin` - Full system access

#### 3. ✨ `attendance_records` (NEW FEATURE)
Daily attendance tracking for youth participants.
```sql
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  youth_id VARCHAR(50) NOT NULL REFERENCES youth_participants(youth_id),
  attendance_date DATE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by VARCHAR(50) NOT NULL REFERENCES staff_members(staff_id),
  notes TEXT,
  UNIQUE(youth_id, attendance_date)
);
```

**Key Features:**
- Staff can record attendance for any youth
- One record per youth per date (enforced by UNIQUE constraint)
- ✨ **DELETE FUNCTIONALITY:** Staff can delete attendance if wrong youth was recorded
- Tracks who submitted the attendance and when
- Optional notes field for additional information

---

## 🔐 Authentication System

### JWT-based Authentication
Both youth and staff use JWT tokens stored in localStorage.

**Youth Login Flow:**
1. POST `/api/youth/auth` with `{ youthId, password }`
2. Receives `{ token, youthData }`
3. Stores in `localStorage.getItem('youthToken')` and `localStorage.getItem('youthData')`

**Staff Login Flow:**
1. POST `/api/staff/auth` with `{ staffId, password }`
2. Receives `{ token, staffData }`
3. Stores in `localStorage.getItem('staffToken')` and `localStorage.getItem('staffData')`

**Token Verification:**
```typescript
// In API routes
import { verifyStaffToken, verifyYouthToken } from '@/app/api/_lib/auth';

const token = authHeader.substring(7);
const decoded = verifyStaffToken(token);
```

---

## ✨ ATTENDANCE FEATURE - DETAILED GUIDE

### Overview
The attendance feature allows staff to record daily attendance for youth participants and delete records if mistakes are made.

### User Flow

#### Recording Attendance
1. Staff navigates to `/dashboard/staff/attendance`
2. Selects module (Mobile Mapping, Digitization, etc.)
3. Optionally filters by settlement
4. Searches for youth by ID (e.g., KAY1278MK)
5. Selects youth from search results
6. Chooses attendance date (defaults to today)
7. Optionally adds notes
8. Clicks "Record Attendance"

#### Deleting Attendance (NEW)
1. Staff views attendance list for a specific date
2. Each attendance record shows:
   - Youth name and ID
   - Time recorded
   - Who recorded it
   - **Delete button (trash icon)**
3. Click delete button
4. Confirm deletion in popup
5. Record is permanently deleted
6. List refreshes automatically

### API Endpoints

#### POST `/api/staff/attendance`
Record new attendance.

**Request:**
```typescript
POST /api/staff/attendance
Headers: { Authorization: 'Bearer <staff_token>' }
Body: {
  youth_id: 'KAY1278MK',
  attendance_date: '2026-01-26',
  notes?: 'Optional notes'
}
```

**Response:**
```typescript
{
  success: true,
  message: 'Attendance recorded successfully',
  data: {
    record: { id, youth_id, attendance_date, submitted_at },
    youth: { youth_id, full_name, program_type }
  }
}
```

**Error Codes:**
- `401` - Unauthorized (invalid/missing token)
- `404` - Youth not found or not active
- `409` - Attendance already recorded for this date

#### GET `/api/staff/attendance`
Retrieve attendance records.

**Request:**
```typescript
GET /api/staff/attendance?date=2026-01-26&module=mobile_mapping
Headers: { Authorization: 'Bearer <staff_token>' }
```

**Response:**
```typescript
{
  success: true,
  data: {
    records: [
      {
        id: 1,
        youth_id: 'KAY1278MK',
        full_name: 'Michelle Kinya',
        program_type: 'mobile_mapping',
        attendance_date: '2026-01-26',
        submitted_at: '2026-01-26T08:30:00Z',
        submitted_by: 'STEA8103SA',
        notes: 'On time'
      }
    ],
    attendance_count: 45,
    total_mappers: 100,
    date: '2026-01-26'
  }
}
```

#### ✨ DELETE `/api/staff/attendance` (NEW)
Delete an attendance record.

**Request:**
```typescript
DELETE /api/staff/attendance?id=123
Headers: { Authorization: 'Bearer <staff_token>' }
```

**Response:**
```typescript
{
  success: true,
  message: 'Attendance record for Michelle Kinya on 2026-01-26 has been deleted',
  data: {
    deleted_record: {
      id: 123,
      youth_id: 'KAY1278MK',
      full_name: 'Michelle Kinya',
      attendance_date: '2026-01-26'
    }
  }
}
```

**Error Codes:**
- `401` - Unauthorized
- `404` - Attendance record not found
- `400` - Missing record ID

**Logging:**
All deletions are logged to console with:
- Record ID
- Youth details
- Original submitter
- Who deleted it
- Deletion timestamp

### UI Components

#### File: `src/app/dashboard/staff/attendance/page.tsx`

**Key State Variables:**
```typescript
const [selectedModule, setSelectedModule] = useState('mobile_mapping');
const [selectedSettlement, setSelectedSettlement] = useState('all');
const [searchQuery, setSearchQuery] = useState('');
const [selectedYouth, setSelectedYouth] = useState<Youth | null>(null);
const [attendanceDate, setAttendanceDate] = useState(today);
const [notes, setNotes] = useState('');
const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
```

**Delete Function:**
```typescript
const deleteAttendanceRecord = async (recordId: number, youthName: string) => {
  if (!confirm(`Are you sure you want to delete the attendance record for ${youthName}?`)) {
    return;
  }
  
  setDeletingRecordId(recordId);
  const token = localStorage.getItem('staffToken');
  const response = await fetch(`/api/staff/attendance?id=${recordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  if (data.success) {
    fetchTodayAttendance(); // Refresh list
  }
  setDeletingRecordId(null);
};
```

**Delete Button in UI:**
```tsx
<button
  onClick={() => deleteAttendanceRecord(record.id, record.full_name)}
  disabled={deletingRecordId === record.id}
  className="p-2 rounded-lg bg-error/10 hover:bg-error/20 text-error"
  title="Delete this attendance record"
>
  {deletingRecordId === record.id ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Trash2 className="w-4 h-4" />
  )}
</button>
```

---

## 🔧 Common Development Tasks

### Adding a New Feature

1. **Plan the Feature**
   - Define user stories
   - Sketch UI/UX flow
   - Design database schema changes
   - Plan API endpoints

2. **Database Changes**
   - Create migration in `database/migrations/`
   - Update main schema in `database/schema-neon-postgresql.sql`
   - Test migration locally

3. **API Implementation**
   - Create/update API route in `src/app/api/`
   - Add authentication checks
   - Implement business logic
   - Add error handling

4. **UI Implementation**
   - Create/update page in `src/app/dashboard/`
   - Add state management
   - Implement API calls
   - Add loading states and error messages

5. **Testing**
   - Test authentication
   - Test happy path
   - Test error cases
   - Test edge cases

### Running Database Migrations

```bash
# Connect to Neon database
psql "postgresql://user:password@host/database?sslmode=require"

# Run migration
\i database/migrations/add-attendance-table.sql

# Verify
\dt              # List tables
\d+ attendance_records  # Describe table
```

### Testing API Endpoints

```bash
# Using curl
curl -X POST https://learn.spatialcollective.co.ke/api/staff/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"youth_id": "KAY1278MK", "attendance_date": "2026-01-26"}'

# Using scripts/
node scripts/test-attendance-api.js
```

---

## 📝 Code Style Guidelines

### TypeScript
```typescript
// Use explicit types
interface AttendanceRecord {
  id: number;
  youth_id: string;
  full_name: string;
  attendance_date: string;
  submitted_at: string;
  submitted_by: string;
  notes: string | null;
}

// Use async/await for API calls
const response = await fetch('/api/endpoint');
const data = await response.json();

// Handle errors properly
try {
  const result = await someFunction();
} catch (error) {
  console.error('Error:', error);
  setErrorMessage('Something went wrong');
}
```

### React Components
```typescript
// Use functional components with hooks
export default function ComponentName() {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div>Content</div>
  );
}
```

### API Routes
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.substring(7);
    const decoded = verifyStaffToken(token);
    
    // 2. Validate input
    const body = await request.json();
    if (!body.required_field) {
      return NextResponse.json({ error: 'Missing field' }, { status: 400 });
    }
    
    // 3. Execute business logic
    const result = await Database.query('...');
    
    // 4. Return response
    return NextResponse.json({ success: true, data: result.rows });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Token verification failed"
**Solution:** Token expired. User needs to log in again.
```typescript
if (response.status === 401) {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffData');
  router.push('/');
}
```

### Issue: "Attendance already recorded"
**Solution:** Delete existing record first, then re-record.
```typescript
// User can click delete button in UI to remove wrong record
// Then record attendance again with correct youth
```

### Issue: Database connection timeout
**Solution:** Neon serverless DB may be sleeping. Retry the request.

---

## 🚀 Deployment

### Production Deployment (Vercel)
```bash
# Push to main branch
git add .
git commit -m "feat: add attendance delete functionality"
git push origin main

# Vercel auto-deploys from main branch
# URL: https://learn.spatialcollective.co.ke
```

### Environment Variables
Required in `.env.local` and Vercel:
```
DATABASE_URL=postgresql://...@...neon.tech/...?sslmode=require
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=https://learn.spatialcollective.co.ke
```

---

## 📖 Additional Resources

### Documentation Files
- `docs/PLATFORM_DOCUMENTATION.md` - Complete platform docs
- `docs/DEVELOPER_ONBOARDING.md` - Developer setup guide
- `docs/README.md` - Project overview
- `database/schema-neon-postgresql.sql` - Full database schema

### External APIs
- **Private OSM Server:** `https://osm.spatialcollective.co.ke`
  - Changeset API: `/api/0.6/changesets`
  - User API: `/api/0.6/user/details`

### Support
- **Platform Lead:** Spatial Collective Tech Team
- **Repository:** Private GitLab/GitHub repo

---

## 🎓 Learning Path for New AI Agents

### Day 1: Understanding the Platform
1. Read this document completely
2. Review `docs/PLATFORM_DOCUMENTATION.md`
3. Explore the database schema
4. Understand authentication flow

### Day 2: Code Exploration
1. Navigate through `src/app/dashboard/` structure
2. Review API routes in `src/app/api/`
3. Understand the attendance feature end-to-end
4. Study other features (work tracking, contracts)

### Day 3: Hands-on Practice
1. Set up local development environment
2. Test attendance recording
3. Test attendance deletion
4. Make a small code change

### Day 4: Advanced Topics
1. Understand OSM integration
2. Study work tracking system
3. Review email integration
4. Learn deployment process

---

## ✅ Checklist for AI Agents

Before working on any feature, ensure you:

- [ ] Understand the user's role (youth/trainer/admin/superadmin)
- [ ] Know which database tables are involved
- [ ] Understand authentication requirements
- [ ] Review existing similar features
- [ ] Check for related API endpoints
- [ ] Consider error cases and edge cases
- [ ] Plan for loading states and user feedback
- [ ] Follow established code patterns
- [ ] Test thoroughly before deployment

---

## 🎯 Quick Reference

### Attendance Feature Summary

**Purpose:** Track daily attendance and allow corrections

**Users:** Staff (trainers, admins, superadmins)

**Actions:**
1. ✅ Record attendance for youth
2. ✅ View attendance for any date
3. ✨ Delete attendance if wrong youth recorded

**Files Changed:**
- `src/app/api/staff/attendance/route.ts` (added DELETE)
- `src/app/dashboard/staff/attendance/page.tsx` (added delete UI)
- `database/schema-neon-postgresql.sql` (added attendance_records table)
- `database/migrations/add-attendance-table.sql` (new migration)

**Database:**
- Table: `attendance_records`
- Constraint: UNIQUE(youth_id, attendance_date)
- Cascade: ON DELETE CASCADE for youth_id

---

**Document Version:** 2.0.0  
**Last Updated:** January 26, 2026  
**Next Review:** When new major features are added

---

*This document is maintained for AI agents working on the SC Training Hub platform. Keep it updated as the platform evolves.*

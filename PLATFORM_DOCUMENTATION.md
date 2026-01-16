# SC Training Hub - Complete Platform Documentation

**Spatial Collective Learning Platform**

**Version:** 1.0.0  
**Last Updated:** January 15, 2026  
**Production URL:** https://learn.spatialcollective.co.ke

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [API Reference](#6-api-reference)
7. [External Integrations](#7-external-integrations)
8. [User Roles & Permissions](#8-user-roles--permissions)
9. [Training Modules](#9-training-modules)
10. [Work Dashboard & Tracking](#10-work-dashboard--tracking)
11. [Email Integration](#11-email-integration)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Security Measures](#13-security-measures)
14. [File Structure](#14-file-structure)

---

## 1. Executive Summary

### 1.1 Purpose

SC Training Hub is a comprehensive digital training and work management platform developed by **Spatial Collective Limited** for youth employment programs in Nairobi's informal settlements. The platform manages:

- **Youth Training**: Multi-module learning system for geospatial data collection
- **Work Tracking**: Real-time monitoring of digitization work via OSM API integration
- **Contract Management**: Digital contract signing and storage
- **Progress Monitoring**: Dashboard for tracking training completion and work output
- **Email Communication**: Integrated work email access for youth participants

### 1.2 Scale

| Metric | Count |
|--------|-------|
| Total Youth Participants | ~300 |
| Settlements | 3 (Kayole, Kariobangi, Mji wa Huruma) |
| Training Modules | 4 (Digitization, Mobile Mapping, Household Survey, Microtasking) |
| Staff Members | ~15 (Trainers, Admins, SuperAdmins) |
| Work Period | 20 days per youth |

### 1.3 Key Features

- **Multi-role Authentication**: JWT-based secure login for youth and staff
- **Sequential Training**: Step-by-step modules with progress tracking
- **Real-time OSM Integration**: Automatic building count tracking from OpenStreetMap
- **Work Day Management**: 20-day work period tracking with approval workflow
- **Contract Signing**: Digital signature capture and PDF storage
- **Email Integration**: Work email access via API proxy

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Next.js 16 Frontend (React 19)                                          │
│  - Youth Dashboard (/dashboard)                                          │
│  - Training Modules (/digitization, /mobile-mapping)                     │
│  - Work Dashboard (/dashboard/work)                                      │
│  - Staff Dashboard (/dashboard/staff, /dashboard/admin)                  │
│  - Messages (/dashboard/messages)                                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (/api/*)                                             │
│  - /api/youth/* - Youth authentication, profile, training progress       │
│  - /api/staff/* - Staff authentication and management                    │
│  - /api/work/* - Work statistics, day counting, sync                     │
│  - /api/contracts/* - Contract signing and retrieval                     │
│  - /api/messages/* - Email API proxy                                     │
│  - /api/training/* - Training completion status                          │
└───────────────┬─────────────────────────┬───────────────────────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────┐
│      DATABASE LAYER       │   │          EXTERNAL SERVICES               │
├───────────────────────────┤   ├─────────────────────────────────────────┤
│  PostgreSQL (Neon)        │   │  • Private OSM Server                    │
│  - youth_participants     │   │    osm.spatialcollective.co.ke           │
│  - staff_members          │   │    - Changeset API                       │
│  - signed_contracts       │   │    - User verification                   │
│  - youth_training_progress│   │    - OAuth2 authentication               │
│  - youth_work_days        │   │                                          │
│  - youth_osm_stats        │   │  • Email API                             │
│  - settlement_work_config │   │    tasks.spatialcollective.co.ke/email-api│
│  - auth_logs              │   │    - Inbox access                        │
└───────────────────────────┘   │    - Unread count                        │
                                │                                          │
┌───────────────────────────┐   │  • Redis (Upstash)                       │
│      CACHING LAYER        │   │    - OSM stats caching (5 min TTL)       │
├───────────────────────────┤   │    - Rate limit prevention               │
│  Redis / Memory Fallback  │   └─────────────────────────────────────────┘
│  - OSM building counts    │
│  - Session data           │
└───────────────────────────┘
```

### 2.2 Data Flow

```
Youth Login → JWT Token Generation → Training Progress Check → 
  ├─ Training Incomplete → Training Module Pages
  └─ Training Complete → Work Dashboard
       └─ OSM Stats Fetch (via cache) → Display Building Count → 
          Work Day Sync → Approval Workflow
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.7 | React framework with SSR/SSG |
| React | 19.0.1 | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4.18 | Utility-first CSS |
| Lucide React | 0.554.0 | Icon library |
| Framer Motion | 12.23.24 | Animation library |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.0.7 | Serverless API endpoints |
| jsonwebtoken | 9.0.2 | JWT authentication |
| pg | 8.16.3 | PostgreSQL client |
| axios | 1.6.2 | HTTP client |
| fast-xml-parser | 5.3.3 | OSM XML parsing |

### 3.3 Database & Caching

| Technology | Purpose |
|------------|---------|
| PostgreSQL (Neon) | Primary database with serverless scaling |
| Redis (Upstash) | Caching layer for OSM stats |
| In-memory cache | Fallback when Redis unavailable |

### 3.4 External Services

| Service | URL | Purpose |
|---------|-----|---------|
| Private OSM Server | osm.spatialcollective.co.ke | Building data source |
| Email API | tasks.spatialcollective.co.ke/email-api | Work email access |
| Vercel | vercel.com | Hosting & deployment |

---

## 4. Database Schema

### 4.1 Core Tables

#### `youth_participants`
Primary table for youth participant data.

```sql
CREATE TABLE youth_participants (
  youth_id VARCHAR(50) PRIMARY KEY,      -- e.g., KAY1278MK, KAR119BN, HUR728CM
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  program_type VARCHAR(50) NOT NULL,     -- digitization, mobile_mapping, household_survey, microtasking
  settlement VARCHAR(100),               -- Kayole, Kariobangi Machakos, Mji wa Huruma
  osm_username VARCHAR(255),             -- OpenStreetMap username
  work_email VARCHAR(255),               -- @spatialcollective.co.ke email
  module_assignment VARCHAR(50),         -- mapper or validator (for digitization)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Youth ID Prefixes:**
- `KAY` - Kayole Soweto settlement
- `KAR` - Kariobangi Machakos settlement
- `HUR` - Mji wa Huruma settlement

#### `staff_members`
Staff and administrator accounts.

```sql
CREATE TABLE staff_members (
  staff_id VARCHAR(50) PRIMARY KEY,      -- e.g., STEA8103SA, SFEA0119T
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  role VARCHAR(20) NOT NULL,             -- trainer, admin, superadmin
  created_by VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE
);
```

**Staff ID Format:** `S[T/F/M]EA####[SA/T/A]`
- `T` = Trainer, `F` = Field, `M` = Manager
- `SA` = SuperAdmin, `T` = Trainer, `A` = Admin

#### `youth_training_progress`
Tracks completion of training steps.

```sql
CREATE TABLE youth_training_progress (
  progress_id UUID PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants,
  module_type VARCHAR(20),               -- mapper, validator, mobile_mapping, etc.
  step_id INTEGER,                       -- 1, 2, 3, etc.
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### 4.2 Work Tracking Tables

#### `youth_work_days`
Tracks daily work output within 20-day work period.

```sql
CREATE TABLE youth_work_days (
  work_day_id UUID PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants,
  work_date DATE NOT NULL,
  buildings_count INTEGER DEFAULT 0,
  daily_target INTEGER DEFAULT 200,
  target_met BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  approved_by VARCHAR(50) REFERENCES staff_members,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(youth_id, work_date)
);
```

#### `youth_osm_stats`
Caches OSM building counts to prevent API rate limiting.

```sql
CREATE TABLE youth_osm_stats (
  stats_id UUID PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants,
  osm_username VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  buildings_mapped INTEGER DEFAULT 0,
  changesets_analyzed INTEGER DEFAULT 0,
  last_changeset_id BIGINT,
  last_upload_time TIMESTAMP WITH TIME ZONE,
  UNIQUE(youth_id, date)
);
```

#### `settlement_work_config`
Configuration per settlement and program type.

```sql
CREATE TABLE settlement_work_config (
  config_id UUID PRIMARY KEY,
  settlement VARCHAR(100) NOT NULL,
  program_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  total_work_days INTEGER DEFAULT 20,
  daily_target INTEGER DEFAULT 200,
  project_hashtag VARCHAR(100) DEFAULT '#DPW2025',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(settlement, program_type)
);
```

### 4.3 Contract Tables

#### `contract_templates`
Contract templates by program type.

```sql
CREATE TABLE contract_templates (
  template_id UUID PRIMARY KEY,
  program_type VARCHAR(50) NOT NULL,
  version VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### `signed_contracts`
Youth-signed contracts with digital signatures.

```sql
CREATE TABLE signed_contracts (
  contract_id UUID PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants,
  template_id UUID REFERENCES contract_templates,
  signature_data TEXT NOT NULL,          -- Base64 signature image
  ip_address VARCHAR(100),
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT TRUE
);
```

### 4.4 Entity Relationship Diagram

```
┌─────────────────────┐     ┌─────────────────────┐
│  staff_members      │     │  youth_participants │
├─────────────────────┤     ├─────────────────────┤
│ PK staff_id         │     │ PK youth_id         │
│    full_name        │     │    full_name        │
│    email            │     │    email            │
│    role             │◄────│    program_type     │
│    is_active        │     │    settlement       │
└──────────┬──────────┘     │    osm_username     │
           │                │    work_email       │
           │                │    is_active        │
           │                └──────────┬──────────┘
           │                           │
           │     ┌─────────────────────┼─────────────────────┐
           │     │                     │                     │
           ▼     ▼                     ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  youth_work_days     │  │ youth_training_progress│ │  signed_contracts    │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ PK work_day_id       │  │ PK progress_id       │  │ PK contract_id       │
│ FK youth_id          │  │ FK youth_id          │  │ FK youth_id          │
│ FK approved_by       │  │    module_type       │  │ FK template_id       │
│    work_date         │  │    step_id           │  │    signature_data    │
│    buildings_count   │  │    completed_at      │  │    signed_at         │
│    status            │  └──────────────────────┘  └──────────────────────┘
└──────────────────────┘
           ▲
           │
┌──────────────────────────┐
│  settlement_work_config  │
├──────────────────────────┤
│ PK config_id             │
│    settlement            │
│    program_type          │
│    start_date            │
│    total_work_days       │
│    daily_target          │
│    project_hashtag       │
└──────────────────────────┘
```

---

## 5. Authentication System

### 5.1 JWT Token Flow

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Client     │    │   API Route   │    │   Database    │
│  (Browser)    │    │  (Next.js)    │    │  (PostgreSQL) │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        │ POST /api/youth/auth/authenticate      │
        │ { youthId: "KAY1278MK" }               │
        │─────────────────────>│                 │
        │                      │                 │
        │                      │ SELECT * FROM youth_participants
        │                      │ WHERE youth_id = 'KAY1278MK'
        │                      │────────────────────────────────>│
        │                      │                                 │
        │                      │<────────────────────────────────│
        │                      │    { youth_id, full_name, ... } │
        │                      │                                 │
        │                      │ jwt.sign({ youthId, programType })
        │                      │                                 │
        │<─────────────────────│                                 │
        │ { success: true,     │                                 │
        │   token: "eyJ...",   │                                 │
        │   youth: {...} }     │                                 │
        │                      │                                 │
        │ Store in localStorage│                                 │
        │ 'youthToken'         │                                 │
```

### 5.2 Youth Authentication

**Endpoint:** `POST /api/youth/auth/authenticate`

**Request:**
```json
{
  "youthId": "KAY1278MK"
}
```

**Validation Rules:**
- Youth ID must match pattern: `^(KAY|KAR|HUR)[A-Z0-9]+$`
- Case-insensitive (normalized to uppercase)
- Must exist in database and be active
- Max 5 failed attempts per 15 minutes

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "youth": {
    "youthId": "KAY1278MK",
    "fullName": "Michelle Kinya",
    "programType": "digitization",
    "settlement": "Kayole",
    "osmUsername": "MichelleK",
    "hasSignedContract": true
  }
}
```

### 5.3 Staff Authentication

**Endpoint:** `POST /api/staff/auth/authenticate`

**Request:**
```json
{
  "staffId": "STEA8103SA"
}
```

**Validation Rules:**
- Staff ID must match pattern: `^S[TFM]EA\d{4}(SA|T|A)$`
- Must exist in database and be active

**JWT Payload (Staff):**
```json
{
  "staffId": "STEA8103SA",
  "fullName": "Admin User",
  "role": "superadmin",
  "iat": 1736899200,
  "exp": 1736985600
}
```

### 5.4 Token Verification

All protected API routes verify tokens using:

```typescript
const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

function verifyYouthToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
```

**Token Lifetime:** 24 hours (configurable via `JWT_EXPIRES_IN`)

---

## 6. API Reference

### 6.1 Youth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/youth/auth/authenticate` | Youth login |
| GET | `/api/youth/profile` | Get youth profile |
| GET | `/api/youth/training-progress` | Get training progress |
| POST | `/api/youth/training-progress` | Mark step complete |
| PUT | `/api/youth/update-osm-username` | Update OSM username |
| GET | `/api/youth/notifications` | Get notifications |
| POST | `/api/youth/notifications/[id]/hide` | Hide notification |
| GET | `/api/youth/odk-config` | Get ODK server config |

### 6.2 Staff Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/staff/auth/authenticate` | Staff login |
| GET | `/api/staff` | List all staff (admin only) |
| POST | `/api/staff/create` | Create staff member |
| DELETE | `/api/staff/[staffId]` | Delete staff member |

### 6.3 Work Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/work/stats/daily` | Get today's OSM stats |
| POST | `/api/work/stats/refresh` | Force refresh OSM stats |
| GET | `/api/work/days/count` | Get work days completed |
| POST | `/api/work/days/sync` | Sync work day from OSM |

### 6.4 Contract Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts/template` | Get contract template |
| POST | `/api/contracts/sign` | Sign contract |
| GET | `/api/contracts/signed` | Get signed contracts |

### 6.5 Training Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/training/completion-status` | Check training complete |

### 6.6 Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/inbox` | Get email inbox |
| GET | `/api/messages/[id]` | Get single email |
| GET | `/api/messages/unread-count` | Get unread count |
| GET | `/api/messages/folders` | Get email folders |

### 6.7 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/youth` | List all youth |
| POST | `/api/admin/approve-december-days` | Bulk approve work days |
| GET | `/api/admin/contracts/view/[contractId]` | View contract |
| GET | `/api/admin/contracts/print` | Print contracts |

### 6.8 Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/version` | API version |
| GET | `/api/debug` | Debug info (dev only) |
| GET | `/api/osm/verify-username` | Verify OSM username |

---

## 7. External Integrations

### 7.1 Private OSM Server

**Base URL:** `https://osm.spatialcollective.co.ke`

**API Endpoints Used:**
- `GET /api/0.6/changesets` - Fetch user changesets
- `GET /api/0.6/changeset/:id` - Get changeset details
- `GET /api/0.6/user/:id` - Verify user exists

**OAuth2 Configuration:**
```
Authorize URL: https://osm.spatialcollective.co.ke/oauth2/authorize
Token URL: https://osm.spatialcollective.co.ke/oauth2/token
```

**Integration Flow:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Work Dashboard │     │  OSM Service    │     │  Private OSM    │
│    (Client)     │     │   (Backend)     │     │    Server       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ GET /api/work/stats/daily                     │
         │───────────────────────>│                      │
         │                        │                      │
         │                        │ Check Redis Cache    │
         │                        │                      │
         │                        │ (Cache Miss)         │
         │                        │                      │
         │                        │ GET /api/0.6/changesets
         │                        │ ?user=Username       │
         │                        │ &time=today          │
         │                        │ &hashtag=#DPW2025    │
         │                        │──────────────────────>│
         │                        │                       │
         │                        │<──────────────────────│
         │                        │  XML: Changesets      │
         │                        │                       │
         │                        │ Parse XML, count buildings
         │                        │ Cache in Redis (5 min)│
         │                        │                       │
         │<───────────────────────│                       │
         │ { buildings: 245,      │                       │
         │   target: 200,         │                       │
         │   percentage: 122% }   │                       │
```

**Caching Strategy:**
- **Redis TTL:** 5 minutes
- **Fallback:** In-memory cache if Redis unavailable
- **Manual Refresh:** Available via "Refresh Stats" button

### 7.2 Email API

**Base URL:** `https://tasks.spatialcollective.co.ke/email-api`

**Authentication:**
```
Header: X-API-Key: 06682c28d538516b9920423822798612
```

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emails` | Fetch email list |
| POST | `/email/{id}` | Get single email |
| POST | `/unread-count` | Get unread count |
| POST | `/folders` | List folders |

**Request Format:**
```json
{
  "email": "kay1278mk@spatialcollective.co.ke",
  "password": "DPW2026Map!",
  "folder": "INBOX",
  "limit": 20
}
```

**Youth Email Format:** `{youth_id}@spatialcollective.co.ke`
- Example: `kay1278mk@spatialcollective.co.ke`
- Default Password: `DPW2026Map!`

### 7.3 HOT Tasking Manager

**Project URLs by Settlement:**

| Settlement | Project URL |
|------------|-------------|
| Kayole | https://tasks.hotosm.org/projects/39443 |
| Kariobangi | https://tasks.hotosm.org/projects/36571 |
| Mji wa Huruma | https://tasks.hotosm.org/projects/36603 |

---

## 8. User Roles & Permissions

### 8.1 Role Hierarchy

```
                    ┌─────────────────┐
                    │   SuperAdmin    │
                    │ Full system     │
                    │ access          │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │   Admin   │  │  Trainer  │  │   Youth   │
       │ User mgmt │  │ Training  │  │ Training  │
       │ Reports   │  │ oversight │  │ Work      │
       └───────────┘  └───────────┘  └───────────┘
```

### 8.2 Permission Matrix

| Feature | Youth | Trainer | Admin | SuperAdmin |
|---------|-------|---------|-------|------------|
| Login | ✅ | ✅ | ✅ | ✅ |
| View Training | ✅ | ✅ | ✅ | ✅ |
| Complete Training | ✅ | ❌ | ❌ | ❌ |
| Work Dashboard | ✅ | ✅ | ✅ | ✅ |
| Sign Contract | ✅ | ❌ | ❌ | ❌ |
| View Messages | ✅ | ❌ | ❌ | ❌ |
| View Youth List | ❌ | ✅ | ✅ | ✅ |
| Approve Work Days | ❌ | ❌ | ✅ | ✅ |
| Manage Staff | ❌ | ❌ | ✅ | ✅ |
| Create Staff | ❌ | ❌ | ❌ | ✅ |
| Delete Staff | ❌ | ❌ | ❌ | ✅ |
| System Config | ❌ | ❌ | ❌ | ✅ |

### 8.3 Dashboard Access by Role

| Role | Dashboard URL | Features |
|------|---------------|----------|
| Youth | `/dashboard` | Training, Work, Messages |
| Trainer | `/dashboard/trainer` | Youth progress, Activity logs |
| Admin | `/dashboard/admin` | Youth management, Contracts |
| SuperAdmin | `/dashboard/admin/staff` | Staff management, Full access |

---

## 9. Training Modules

### 9.1 Module Overview

| Module | Steps | Required OSM | Target Users |
|--------|-------|--------------|--------------|
| Mapper (Digitization) | 7 | Yes | KAY, KAR, HUR prefix |
| Validator | 6 | Yes | Staff only |
| Mobile Mapping | 4 | No | KAY prefix (mobile_mapping) |
| Household Survey | 4 | No | Future |
| Microtasking | 3 | No | Future |

### 9.2 Digitization Training (Mapper)

**Route:** `/digitization/mapper/[stepId]`

| Step | Title | Content |
|------|-------|---------|
| 1 | Introduction | Overview of building digitization |
| 2 | Building Types | Residential, commercial, industrial |
| 3 | Building Identification | Satellite imagery analysis |
| 4 | Drawing Techniques | JOSM tracing methods |
| 5 | Quality Guidelines | Accuracy standards |
| 6 | OSM Setup | Account creation, JOSM config |
| 7 | Final Assessment | Practical test |

**Completion Requirements:**
- All 7 steps completed sequentially
- OSM username submitted and verified
- Contract signed

### 9.3 Mobile Mapping Training

**Route:** `/mobile-mapping/[stepId]`

| Step | Title | Content |
|------|-------|---------|
| 1 | Install ODK Collect | App installation guide |
| 2 | Connect to Server | Server URL configuration |
| 3 | Download Forms | Form download process |
| 4 | Collect Data | Field data collection |

**ODK Server Configuration:**
- Server URL: `https://odk.spatialcollective.co.ke`
- Project ID: Auto-assigned based on settlement
- Username: Youth ID
- Password: Youth ID

### 9.4 Progress Tracking

```typescript
// Database: youth_training_progress
{
  youth_id: "KAY1278MK",
  module_type: "mapper",  // NOT program_type
  step_id: 5,             // Integer, not string
  completed_at: "2026-01-15T10:30:00Z"
}
```

**Training Completion Check:**
```sql
SELECT COUNT(DISTINCT step_id) as completed_steps
FROM youth_training_progress
WHERE youth_id = $1 AND module_type = $2
```

---

## 10. Work Dashboard & Tracking

### 10.1 Work Period Configuration

| Settlement | Start Date | Work Days | Daily Target | Hashtag |
|------------|------------|-----------|--------------|---------|
| Kayole | Dec 9, 2025 | 20 | 200 buildings | #DPW2025 |
| Kariobangi | Dec 15, 2025 | 20 | 200 buildings | #DPW2025 |
| Mji wa Huruma | Dec 11, 2025 | 20 | 200 buildings | #DPW2025 |

### 10.2 OSM Stats Fetching

**Service:** `src/lib/osm-service.ts`

**Function:** `getTodayBuildingCount(username, hashtag, timezone, forceRefresh)`

**Process:**
1. Check Redis cache for existing stats
2. If cache miss, query OSM Changeset API
3. Parse XML response for building modifications
4. Filter by hashtag (#DPW2025)
5. Count buildings with `building=*` tag
6. Cache result (5 min TTL)
7. Store in `youth_osm_stats` table

**OSM API Request:**
```
GET /api/0.6/changesets
?user={username}
&time={today_start},{today_end}
&closed=true
```

### 10.3 Work Day Sync

**Endpoint:** `POST /api/work/days/sync`

**Trigger:** Automatic when youth views Work Dashboard

**Logic:**
1. Fetch today's OSM stats
2. Check if buildings_count >= daily_target
3. If target met and no existing record:
   - Insert into `youth_work_days`
   - Status: 'approved' (auto-approval)
   - Notes: 'Auto-synced from OSM stats'

### 10.4 Work Dashboard Display

**Route:** `/dashboard/work`

**Components:**
- Today's Building Count (from OSM)
- Progress Percentage (count/target)
- Work Days Counter (X of 20)
- Task Assignment Link (HOT TM)
- Refresh Button
- Performance Metrics

---

## 11. Email Integration

### 11.1 Email System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Messages Page  │     │  API Proxy      │     │  Email API      │
│  (Frontend)     │     │  (/api/messages)│     │  (External)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ GET /api/messages/inbox                       │
         │───────────────────────>│                      │
         │                        │                      │
         │                        │ Get youth work_email │
         │                        │ from database        │
         │                        │                      │
         │                        │ POST /email-api/emails
         │                        │ { email, password }  │
         │                        │──────────────────────>│
         │                        │                       │
         │                        │<──────────────────────│
         │                        │    { emails: [...] }  │
         │                        │                       │
         │<───────────────────────│                       │
         │ { success: true,       │                       │
         │   emails: [...] }      │                       │
```

### 11.2 Email Account Setup

**Email Format:** `{youth_id_lowercase}@spatialcollective.co.ke`
- Example: `kay1278mk@spatialcollective.co.ke`

**Default Password:** `DPW2026Map!`

**Total Accounts:** 39 youth

| Settlement | Count |
|------------|-------|
| Kayole | 15 |
| Kariobangi | 15 |
| Huruma | 9 |

### 11.3 Messages Dashboard

**Route:** `/dashboard/messages`

**Features:**
- Folder navigation (Inbox, Sent, Drafts, Trash)
- Email list with previews
- Full email view with attachments
- Unread count badge
- Email credentials display
- Refresh functionality

---

## 12. Deployment Architecture

### 12.1 Vercel Configuration

**File:** `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 12.2 Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `learn_DATABASE_URL` | Alternative DB connection |
| `JWT_SECRET` | JWT signing key |
| `learn_STACK_SECRET_SERVER_KEY` | Alternative JWT key |
| `REDIS_URL` | Upstash Redis connection |
| `EMAIL_API_URL` | Email API base URL |
| `EMAIL_API_KEY` | Email API authentication |
| `NEXT_PUBLIC_OSM_SERVER_URL` | OSM server base URL |

### 12.3 Build & Deploy

**Build Command:** `npm run build`
**Output:** `.next/` (optimized production build)

**Deployment Flow:**
```
git push origin main
    ↓
Vercel detects push
    ↓
npm run build
    ↓
Deploy to edge network
    ↓
https://learn.spatialcollective.co.ke
```

---

## 13. Security Measures

### 13.1 Authentication Security

- **JWT Tokens:** Signed with 256-bit secret
- **Token Expiry:** 24 hours
- **Rate Limiting:** 5 failed attempts per 15 minutes
- **Auth Logging:** All attempts logged to `auth_logs`

### 13.2 Data Protection

- **SSL/TLS:** All connections encrypted
- **Database SSL:** Required for Neon PostgreSQL
- **Parameterized Queries:** SQL injection prevention
- **Input Validation:** Server-side validation on all inputs

### 13.3 API Security

- **CORS Headers:** Configured per route
- **Authorization Headers:** Bearer token required
- **API Keys:** External services use key authentication
- **Error Handling:** Generic error messages to clients

### 13.4 Audit Logging

**Table:** `auth_logs`

```sql
{
  log_id: UUID,
  user_id: "KAY1278MK",
  user_type: "youth",
  action: "login",
  success: true,
  ip_address: "196.201.xxx.xxx",
  user_agent: "Mozilla/5.0...",
  created_at: "2026-01-15T10:30:00Z"
}
```

---

## 14. File Structure

```
learn/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── _lib/              # Shared utilities
│   │   │   │   ├── auth.ts        # JWT verification
│   │   │   │   ├── database.ts    # PostgreSQL client
│   │   │   │   ├── YouthModel.ts  # Youth CRUD operations
│   │   │   │   ├── StaffModel.ts  # Staff CRUD operations
│   │   │   │   ├── ContractModel.ts
│   │   │   │   └── AuthLogModel.ts
│   │   │   ├── youth/
│   │   │   │   ├── auth/authenticate/route.ts
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── training-progress/route.ts
│   │   │   │   ├── update-osm-username/route.ts
│   │   │   │   ├── notifications/route.ts
│   │   │   │   └── odk-config/route.ts
│   │   │   ├── staff/
│   │   │   │   ├── auth/authenticate/route.ts
│   │   │   │   ├── create/route.ts
│   │   │   │   └── [staffId]/route.ts
│   │   │   ├── work/
│   │   │   │   ├── stats/daily/route.ts
│   │   │   │   ├── stats/refresh/route.ts
│   │   │   │   ├── days/count/route.ts
│   │   │   │   └── days/sync/route.ts
│   │   │   ├── contracts/
│   │   │   │   ├── template/route.ts
│   │   │   │   ├── sign/route.ts
│   │   │   │   └── signed/route.ts
│   │   │   ├── messages/
│   │   │   │   ├── inbox/route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── unread-count/route.ts
│   │   │   │   └── folders/route.ts
│   │   │   ├── training/
│   │   │   │   └── completion-status/route.ts
│   │   │   ├── admin/
│   │   │   ├── trainer/
│   │   │   └── osm/
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Dashboard selection
│   │   │   ├── work/page.tsx      # Work dashboard
│   │   │   ├── messages/page.tsx  # Email inbox
│   │   │   ├── youth/page.tsx     # Youth main dashboard
│   │   │   ├── staff/page.tsx     # Staff dashboard
│   │   │   ├── admin/page.tsx     # Admin dashboard
│   │   │   └── trainer/page.tsx   # Trainer dashboard
│   │   ├── digitization/
│   │   │   ├── page.tsx           # Module selection
│   │   │   ├── mapper/[stepId]/page.tsx
│   │   │   └── validator/[stepId]/page.tsx
│   │   ├── mobile-mapping/
│   │   │   ├── page.tsx
│   │   │   ├── [stepId]/page.tsx
│   │   │   └── work/page.tsx
│   │   ├── contract/
│   │   │   ├── page.tsx           # Contract signing
│   │   │   └── review/page.tsx
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home/login page
│   │   └── globals.css
│   ├── components/
│   │   ├── YouthAuthentication.tsx
│   │   ├── StaffAuthentication.tsx
│   │   ├── ContractSigning.tsx
│   │   ├── AgreementModal.tsx
│   │   └── ui/                    # Reusable UI components
│   ├── lib/
│   │   ├── db.ts                  # Alternative DB client
│   │   ├── osm-service.ts         # OSM API integration
│   │   └── utils.ts               # Helper functions
│   └── data/
│       └── training/              # Training content
├── database/
│   ├── schema-neon-postgresql.sql # Core schema
│   ├── migrations/
│   │   ├── add-work-tracking-tables.sql
│   │   ├── add-youth-email-addresses.sql
│   │   └── add-osm-username.sql
│   └── seed_*.sql                 # Seed data
├── scripts/
│   ├── setup-neon-database.ts
│   ├── add-youth-email-addresses.js
│   ├── update-kayole-work-days.js
│   └── verify-*.js                # Verification scripts
├── public/
│   └── images/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vercel.json
```

---

## Appendix A: Quick Reference

### API Base URL
- **Production:** `https://learn.spatialcollective.co.ke/api`
- **Development:** `http://localhost:3000/api`

### Key Endpoints
```
POST /api/youth/auth/authenticate   # Youth login
POST /api/staff/auth/authenticate   # Staff login
GET  /api/youth/training-progress   # Training status
GET  /api/work/stats/daily          # OSM building count
GET  /api/training/completion-status # Check training complete
POST /api/contracts/sign            # Sign contract
GET  /api/messages/inbox            # Get emails
```

### Database Connection
```
Host: ep-dawn-resonance-ad1t4i7z-pooler.c-2.us-east-1.aws.neon.tech
Database: neondb
SSL: Required
```

### External Services
```
OSM Server: https://osm.spatialcollective.co.ke
Email API:  https://tasks.spatialcollective.co.ke/email-api
```

---

## Appendix B: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid Youth ID" | ID not in database | Check prefix (KAY/KAR/HUR) |
| "Training incomplete" | Missing steps | Complete all training steps |
| "OSM username required" | No OSM account | Create OSM account, submit username |
| "0 buildings today" | Cache stale | Click "Refresh Stats" |
| "Rate limited" | Too many OSM requests | Wait 5 minutes |
| "Email not found" | No work_email | Contact admin |

---

## Appendix C: Change Log

| Date | Version | Changes |
|------|---------|---------|
| Jan 15, 2026 | 1.0.0 | Initial documentation |
| Jan 13, 2026 | - | Private OSM server migration |
| Jan 13, 2026 | - | Email integration launch |
| Dec 09, 2025 | - | Work dashboard launch |
| Dec 05, 2025 | - | Initial platform launch |

---

**© 2026 Spatial Collective Limited. All rights reserved.**

*This documentation is proprietary and confidential. Unauthorized distribution is prohibited.*

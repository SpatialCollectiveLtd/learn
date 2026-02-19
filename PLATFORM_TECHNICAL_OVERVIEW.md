# Spatial Collective Learn Platform
## Technical Overview Document

---

## System Classification

**Full-Stack Training Management System**
- Next.js 16 App Router application (TypeScript)
- PostgreSQL database (Neon serverless)
- JWT-based authentication
- Multi-tenant youth training platform for Nairobi informal settlements

---

## Platform Scope

### Geographic Coverage
- **3 Nairobi Settlements**: Kayole Soweto, Kariobangi Machakos, Mji wa Huruma
- **200+ Active Participants**: Youth aged 18-35 enrolled in geospatial training programs
- **12 Active Trainers**: Field supervisors managing daily operations

### Program Types
| Program | Technology Stack | Participant Count |
|---------|-----------------|-------------------|
| **Digitization** | JOSM/iD Editor + OpenStreetMap | ~50 youth |
| **Mobile Mapping** | ODK Collect + ODK Central | 156 youth (153 configured) |
| **Household Survey** | ODK Collect + ODK Central | Planned |
| **Microtasking** | External platform (micro.spatialcollective.co.ke) | Planned |

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 16 (React 19) with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3.x + Framer Motion animations
- **UI Components**: Custom components + Lucide React icons
- **State Management**: React hooks + JWT client-side storage

### Backend Stack
- **Runtime**: Node.js v24+ (Vercel serverless functions)
- **Database**: PostgreSQL 14+ (Neon serverless, SSL required)
- **Authentication**: JWT (HS256) with role-based access control
- **Caching**: Redis (optional, fallback to in-memory)
- **API Architecture**: RESTful JSON endpoints under `/api/*`

### Database Schema
**14 Core Tables**:
- `youth_participants` - Master youth registry (youth_id PK: KAY123, KAR456, HUR789)
- `youth_training_progress` - Sequential step completion tracking
- `youth_work_days` - Daily work log with approval workflow
- `youth_osm_stats` - Cached OSM building counts (5-min TTL)
- `staff_members` - Trainer/admin accounts with role hierarchy
- `signed_contracts` - Digital signature storage (base64 + metadata)
- `contract_templates` - Reusable contract definitions
- `settlement_work_config` - Work period parameters by settlement
- `attendance_records` - Trainer-submitted daily attendance
- `training_content` - Static training module definitions
- `training_messages` - Platform announcements/updates
- `refresh_tokens` - JWT refresh token management
- `app_user_accounts` - Legacy user table
- `work_summary` - Aggregated work statistics view

### External Service Integrations

| Service | Protocol | Purpose |
|---------|----------|---------|
| **ODK Central** | REST API + Basic Auth | Mobile data collection server (collector.kesmis.go.ke) |
| **Private OSM Server** | Overpass API (XML/JSON) | Building count queries (osm.spatialcollective.co.ke) |
| **DPW Manager API** | REST API + API Key | Data export to app.spatialcollective.com |
| **Email API** | REST API + API Key | Spatial Collective email service proxy |
| **Redis Cache** | Redis Protocol | Optional distributed caching layer |

---

## API Structure

### Internal Endpoints (`/api/*`)

**Youth Management**
- `/api/youth/auth` - JWT token generation/validation
- `/api/youth/profile` - Profile CRUD operations
- `/api/youth/work-days` - Work day submission/retrieval
- `/api/youth/training` - Training progress tracking

**Staff Operations**
- `/api/staff/auth` - Staff authentication
- `/api/trainer/attendance` - Daily attendance submission
- `/api/admin/youth` - Youth account management
- `/api/admin/reports` - Aggregated statistics

**Work Tracking**
- `/api/osm/buildings` - OSM changeset analysis + building counts
- `/api/work/*` - Work day approval workflow

**Contracts & Compliance**
- `/api/contracts/templates` - Contract template management
- `/api/contracts/sign` - Digital signature capture
- `/api/contracts/download` - PDF generation

**External Integration**
- `/api/external/dpw-sync` - Public GET endpoint with API key auth
  - Query params: `?youth_id=KAY123` or `?module=mobile_mapping`
  - Returns: JSON array of youth/training/work data

### Authentication Scheme
- **Token Type**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Secret**: `learn_STACK_SECRET_SERVER_KEY` or `JWT_SECRET` env var
- **Payload**: `{ userId, role, iat, exp }`
- **Roles**: Youth, Trainer, Staff, Admin, Superadmin
- **Youth Login**: youth_id only (no password)
- **Staff Login**: email + password (bcrypt hashed)

---

## Data Flow Patterns

### Training Progression
```
Youth Login → View Module Steps → Complete Step N → 
Sequential Validation (must finish N-1) → Update DB → 
Unlock Next Step → Repeat until Module Complete
```

### Work Day Submission (Digitization)
```
Youth Dashboard → Submit Work Day → 
OSM API Query (via Overpass) → Cache Result (Redis/Memory) → 
Calculate Building Count → Store in youth_work_days → 
Pending Approval → Trainer/Admin Approves → Status: Approved
```

### ODK Configuration (Mobile Mapping)
```
Admin Registers Youth in ODK Central → 
Platform Generates QR Code → Youth Scans with ODK Collect → 
Auto-configures: Server URL, Username, Password, Project → 
Youth Collects Data in Field → Syncs to ODK Central
```

### DPW Data Sync
```
External System (app.spatialcollective.com) → 
GET /api/external/dpw-sync?youth_id=KAY123 
Headers: X-API-Key: <secret> → 
Platform Queries DB (youth + training + work) → 
Returns JSON Response
```

---

## Environment Configuration

### Required Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` or `learn_DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` or `learn_STACK_SECRET_SERVER_KEY` | JWT signing key | Random 256-bit string |
| `DPW_MANAGER_API_KEY` | External API authentication | Random UUID |

### Optional Variables
| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Distributed cache connection |
| `ODK_CENTRAL_URL` | ODK server endpoint |
| `ODK_CENTRAL_EMAIL` | ODK admin credentials |
| `ODK_CENTRAL_PASSWORD` | ODK admin credentials |
| `PRIVATE_OSM_URL` | Private OSM Overpass API |
| `EMAIL_SERVICE_API_KEY` | Email proxy authentication |

---

## Deployment Architecture

### Production Environment
- **Hosting**: Vercel (serverless Next.js)
- **Domain**: `learn.spatialcollective.co.ke`
- **Database**: Neon PostgreSQL (serverless, autoscaling)
- **CDN**: Vercel Edge Network
- **SSL**: Automatic (Let's Encrypt via Vercel)
- **Region**: Frankfurt (eu-central-1) for low latency to Nairobi

### Build Configuration
- **Build Command**: `next build`
- **Output**: Standalone Next.js output with ISR support
- **Node Version**: 24.x
- **Environment**: Production variables injected via Vercel dashboard
- **Monitoring**: Vercel Analytics + Runtime Logs

---

## Training Content Structure

### Module Definitions (Static Data)
- **Location**: `src/data/*-training.ts` files
- **Format**: TypeScript objects exported as constants
- **Components**: Steps, content, videos, resources

**Available Modules**:
1. **Mapper Training** (7 steps) - `src/data/mapper-training.ts`
2. **Validator Training** (6 steps) - `src/data/validator-training.ts`
3. **Mobile Mapping Training** (4 steps) - `src/data/mobile-mapping-training.ts`
4. **Microtasking Training** (3 steps × 3 modules) - `src/data/microtasking-training.ts`

### Step Structure
Each training step contains:
- `id`: Unique step identifier (integer)
- `title`: Step display name
- `description`: Learning objectives
- `videoUrl`: YouTube/Vimeo embed (optional)
- `content`: Markdown-formatted instructions
- `resources`: External links, downloads, tools

---

## Work Tracking Specifications

### Digitization Program
- **Daily Target**: 200 buildings per mapper (configurable)
- **Work Period**: 20 days per settlement
- **Counting Method**: OSM changeset analysis via Overpass API
  - Query: Buildings modified by user on date X
  - Cache: 5 minutes per user/date pair
  - Rate Limit: 1 request/second to OSM server
- **Approval**: Required before payment processing

### Mobile Mapping Program
- **Daily Target**: Field data collection (variable by project)
- **Work Period**: Project-specific (configured in `settlement_work_config`)
- **Counting Method**: Manual trainer verification + ODK submission count
- **Tools**: ODK Collect app on Android smartphones

### Microtasking Program
- **Platform**: External (micro.spatialcollective.co.ke)
- **Integration**: Training only (no work tracking in Learn Platform)
- **Structure**: 3 independent training modules

---

## Access Patterns

### Youth User Journey
1. Login with youth_id (e.g., `KAY123`)
2. View assigned training module (based on `program_type` + `module_assignment`)
3. Complete training steps sequentially
4. Access ODK QR code (mobile mapping) or JOSM setup guide (digitization)
5. Submit work days from dashboard
6. Sign digital contracts
7. Access work email through platform proxy

### Trainer User Journey
1. Login with email/password
2. Submit daily attendance (settlement + program + date + youth list)
3. View youth roster with training/work status
4. Approve/reject work day submissions
5. Generate settlement reports

### Admin User Journey
1. Full platform access via admin dashboard
2. Bulk youth registration/editing
3. Work configuration management
4. Contract template creation
5. System health monitoring
6. Export data via DPW API test tools

---

## Critical Safety Features

### Data Integrity
- **Backup Protocol**: `scripts/backup-youth-data.js` creates timestamped JSON + SQL dumps
- **Requirement**: Mandatory backup before any `youth_participants` schema changes
- **Storage**: `backups/` directory with ISO timestamps

### Security Measures
- **SQL Injection Prevention**: Parameterized queries in all database operations
- **XSS Protection**: React automatic escaping + CSP headers
- **API Rate Limiting**: Express rate limiter on external endpoints
- **JWT Expiration**: Short-lived access tokens + refresh token rotation
- **Role Validation**: Middleware checks on all protected routes

### Audit Trail
- Signed contracts: IP address, user agent, timestamp
- Work days: Created by, approved by, timestamps
- Attendance: Trainer ID, submission timestamp
- Training progress: Step completion timestamps

---

## Developer Utilities

### Active Scripts (`scripts/`)
- `backup-youth-data.js` - Critical data backup utility
- `test-production-full.js` - Comprehensive DPW API integration test
- `register-mobile-mappers.js` - Bulk ODK Central registration
- `check-tables.js` - Database schema inspector
- `add-trainers.js` - Staff account creation
- `export-odk-config.js` - ODK configuration export

### Testing Tools
- `scripts/test-dpw-api.js` - Local DPW endpoint validation
- `scripts/test-attendance-api.js` - Attendance workflow testing
- `scripts/check-work-summary.js` - Work statistics verification

### Archived Scripts (`archive/`)
- Historical one-time data migrations
- Deprecated utilities retained for reference
- See `archive/README.md` for catalog

---

## Performance Characteristics

### Database
- **Connection**: Pooled connections via `pg` library (lazy-loaded)
- **SSL**: Required for Neon serverless (rejectUnauthorized: false for dev)
- **Query Optimization**: Indexed on youth_id, staff_id, date columns

### Caching Strategy
- **OSM Data**: 5-minute cache (Redis or in-memory Map)
- **Training Content**: Static data (no cache needed)
- **Work Statistics**: Computed on-demand (no pre-aggregation)

### API Response Times
- Youth auth: <200ms
- Training progress: <150ms
- OSM building count (cached): <100ms
- OSM building count (fresh): 2-5 seconds (external API dependency)
- DPW sync: <500ms (single youth), <3s (module-wide)

---

## Known Limitations

1. **OSM Rate Limiting**: Maximum 1 request/second to private OSM server
2. **ODK Central Dependency**: Mobile mapping requires external ODK server availability
3. **Single Database**: No read replica (Neon serverless scales automatically)
4. **No Real-time Updates**: Polling-based refresh (no WebSocket/SSE)
5. **Microtasking**: External platform with no data integration
6. **File Uploads**: Limited to signature images (base64 encoded)

---

## Platform Statistics (Current)

| Metric | Value |
|--------|-------|
| **Total Youth Registered** | 200+ |
| **Active Training Modules** | 4 (Digitization, Mobile Mapping, Household Survey, Microtasking) |
| **ODK-Configured Users** | 153 |
| **Total Work Days Logged** | 600+ |
| **Buildings Mapped (OSM)** | 47,000+ |
| **Digital Contracts Signed** | Variable by program |
| **Active Trainers** | 12 |
| **API Endpoints** | 40+ internal, 1 external |
| **Database Tables** | 14 core tables |

---

## Technology Version Matrix

| Component | Version | Notes |
|-----------|---------|-------|
| Next.js | 16.0.7 | App Router architecture |
| React | 19.0.1 | Latest stable |
| Node.js | 24.x | Required for all scripts |
| TypeScript | 5.x | Strict mode enabled |
| PostgreSQL | 14+ | Neon serverless |
| Tailwind CSS | 3.x | JIT compiler |
| Redis | 5.10.0 | Optional dependency |

---

## Documentation Index

| Document | Location | Purpose |
|----------|----------|---------|
| Developer Onboarding | `docs/DEVELOPER_ONBOARDING.md` | Complete tech stack + setup |
| Platform Documentation | `docs/PLATFORM_DOCUMENTATION.md` | Feature specifications |
| DPW Integration API | `docs/api/DPW_INTEGRATION_API.md` | External API spec |
| External APIs | `docs/api/EXTERNAL_API_INTEGRATION.md` | All third-party integrations |
| Deployment Guide | `docs/deployment/` | Vercel + environment setup |
| Script Catalog | `scripts/README.md` | Active utility documentation |

---

**Document Version**: 1.0  
**Last Updated**: February 19, 2026  
**Platform**: Spatial Collective Learn  
**Owner**: Spatial Collective Limited  
**Production URL**: https://learn.spatialcollective.co.ke

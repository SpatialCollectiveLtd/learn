# Copilot Instructions

## Project Overview
Next.js 16 App Router application managing youth training programs (digitization, mobile mapping, microtasking) for 200+ participants across 3 Nairobi settlements. Platform handles training modules, work tracking, attendance, contracts, and integrates with external services (ODK Central, Private OSM, DPW Manager API, Microtasking Platform).

## Architecture & Data Flow

### Database Access Patterns
- **API routes**: Use `Database.query()` from [src/app/api/_lib/database.ts](src/app/api/_lib/database.ts) for all queries
  - Example pattern: [src/app/api/external/dpw-sync/route.ts](src/app/api/external/dpw-sync/route.ts#L68-L95) (parameterized queries with indexed params)
  - Connection: PostgreSQL (Neon) via lazy-loaded pool; SSL required, uses `learn_DATABASE_URL` or `DATABASE_URL` env var
- **Non-route server utilities**: Use pooled client from [src/lib/db.ts](src/lib/db.ts)
- **Environment**: Neon serverless PostgreSQL requires `ssl: { rejectUnauthorized: false }`

### API Architecture
- **Internal APIs**: UI → Next.js route handlers in [src/app/api](src/app/api) → Database
  - Youth: auth, profile, training progress
  - Staff/Trainer: management, attendance submission, email/password login
  - Work: OSM building counts, work days
  - Contracts: digital signatures
  - Disputes: payment dispute filing and resolution (`/api/disputes`, `/api/disputes/[id]`)
  - Admin: trainer management, password management (`/api/admin/trainers`, `/api/admin/trainers/[id]/password`)
- **External API**: Public GET endpoint [src/app/api/external/dpw-sync](src/app/api/external/dpw-sync) syncs data to `app.spatialcollective.com`
  - Auth: Requires `X-API-Key` header matching `DPW_MANAGER_API_KEY` env var
  - Query params: `?youth_id=KAY123` or `?module=mobile_mapping`
- **Payments v4**: `GET /api/users/[id]/payments?from=YYYY-MM-DD&to=YYYY-MM-DD` returns `DailyPaymentRecord[]` keyed by date; types in [src/app/api/_lib/types.ts](src/app/api/_lib/types.ts); DPW client in [src/lib/dpw-client.ts](src/lib/dpw-client.ts)

### Authentication & Authorization
- JWT-based auth using `learn_STACK_SECRET_SERVER_KEY` or `JWT_SECRET` env var
- Helpers in [src/app/api/_lib/auth.ts](src/app/api/_lib/auth.ts)
  - `verifyAuthHeader()` — validate Bearer token from Authorization header
  - `hasRole(token, ...roles)` — check role membership
  - `normalizeRole()` — maps DPW role variants (`Admin/superadmin/Manager → 'admin'`, `Trainer/Validator → 'trainer'`) for consistent routing
- Youth login: youth_id (e.g., `KAY123`) via [src/app/api/auth/youth/route.ts](src/app/api/auth/youth/route.ts)
- Staff/Trainer login: email + password (bcrypt) via [src/app/api/auth/staff/route.ts](src/app/api/auth/staff/route.ts) → `/auth/staff`
- DPW launch SSO: token from `app.spatialcollective.com` via [src/app/api/auth/launch/route.ts](src/app/api/auth/launch/route.ts)
- Roles: Youth, Trainer, Staff, Admin, Superadmin
- Password hashes stored in `staff_members.password_hash` (bcrypt, cost 12); column added via [scripts/add-staff-password-column.js](scripts/add-staff-password-column.js)

### External Service Integrations
- **OSM building counts**: `getTodayBuildingCount()` in [src/lib/osm-service.ts](src/lib/osm-service.ts)
  - Private OSM server: `osm.spatialcollective.co.ke` via Overpass API
  - Redis cache when `REDIS_URL` set, otherwise in-memory cache
  - Rate limiting & XML parsing (fast-xml-parser)
- **ODK Central**: Mobile data collection (`collector.kesmis.go.ke`)
- **Microtasking Platform**: External platform at `micro.spatialcollective.co.ke` (training only, no integration)
- **Email API**: Spatial Collective email service for work emails
- **DPW Manager**: Data sync with `app.spatialcollective.com` (see [docs/api/DPW_INTEGRATION_API.md](docs/api/DPW_INTEGRATION_API.md))

### Training Content
- Data-driven modules in [src/data](src/data): `mapper-training.ts`, `mobile-mapping-training.ts`, `validator-training.ts`, `microtasking-training.ts`
- Frontend renders from these static module definitions
- Microtasking: 3-step training, no work tracking, external platform (`micro.spatialcollective.co.ke`)

## Project-Specific Conventions

### Database Safety
- **CRITICAL**: Always backup `youth_participants` before editing
- Run [scripts/backup-youth-data.js](scripts/backup-youth-data.js) to create timestamped JSON + SQL backups in `backups/`
- Example: `node scripts/backup-youth-data.js` before schema changes

### Script Organization
- **Active scripts**: [scripts/](scripts) - production utilities (see [scripts/README.md](scripts/README.md))
- **Archived scripts**: [archive/](archive) - historical/one-time scripts (see [archive/README.md](archive/README.md))
- **Naming convention**: kebab-case with prefixes: `check-*`, `test-*`, `add-*`, `update-*`, `export-*`
- **Required**: Node.js v24+, `.env.local` file, `require('dotenv').config({path:'.env.local'})` at script top

### Code Style
- TypeScript throughout; strict types in API routes
- Tailwind CSS for styling (see [tailwind.config.ts](tailwind.config.ts))
- Icons: `lucide-react` preferred, `@tabler/icons-react` for legacy
- Error handling: Log with request IDs, return structured JSON responses

## Developer Workflows

### Local Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run db:init      # Bootstrap database schema
```

### Testing
```bash
# DPW API (RECOMMENDED comprehensive test)
node scripts/test-production-full.js

# Individual API tests
node scripts/test-dpw-api.js         # Local DPW API
node scripts/test-attendance-api.js  # Attendance endpoints
```

### Database Utilities
```bash
node scripts/check-tables.js         # List all tables & columns
node scripts/check-work-summary.js   # Verify work summary structure
node scripts/check-env-vars.js       # Validate environment variables
node scripts/check-mappers.js        # Check mapper counts by program
```

### Common Operations
```bash
# Register youth on ODK Central
node scripts/register-mobile-mappers.js

# Add trainer accounts
node scripts/add-trainers.js

# Set a trainer's Learn platform password
node scripts/set-trainer-password.js

# Add staff_members.password_hash column (one-time migration)
node scripts/add-staff-password-column.js

# Create payment_disputes table (one-time migration)
node scripts/create-disputes-table.js

# Attendance reports
node scripts/check-attendance-dates.js

# Export ODK configs
node scripts/export-odk-config.js
```

## Key Documentation

### Setup & Config
- **Developer setup**: [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md) (complete tech stack, structure, env vars)
- **Environment variables**: Required vars in onboarding doc
  - Database: `DATABASE_URL` or `learn_DATABASE_URL`
  - Auth: `JWT_SECRET` or `learn_STACK_SECRET_SERVER_KEY`
  - External: `DPW_MANAGER_API_KEY`, `REDIS_URL` (optional), ODK/OSM/Email API keys

### API Integration Docs
- **DPW Manager**: [docs/api/DPW_INTEGRATION_API.md](docs/api/DPW_INTEGRATION_API.md) (comprehensive), [docs/api/DPW_API_KEY.md](docs/api/DPW_API_KEY.md)
- **All external APIs**: [docs/api/EXTERNAL_API_INTEGRATION.md](docs/api/EXTERNAL_API_INTEGRATION.md)
- **Email API**: [docs/api/Email-API-Docs.md](docs/api/Email-API-Docs.md)

### Features & Deployment
- **Platform documentation**: [docs/PLATFORM_DOCUMENTATION.md](docs/PLATFORM_DOCUMENTATION.md)
- **Feature docs**: [docs/features/](docs/features) (messages, training progress, work dashboard)
- **Deployment**: [docs/deployment/](docs/deployment) (Vercel setup, env config, checklists)
- **User guides**: [docs/guides/](docs/guides) (JOSM setup, OSM counting methodology)

## Database Schema Overview

### Core Tables
- **youth_participants**: Main youth table
  - `youth_id` (PK): `KAY123`, `KAR456`, `HUR789` (settlement prefix)
  - `program_type`: `digitization`, `mobile_mapping`, `household_survey`, `microtasking`
  - `module_assignment`: `mapper` or `validator` (digitization only)
  - `osm_username`: OpenStreetMap username (required for digitization)
  - `settlement`: `Kayole Soweto`, `Kariobangi Machakos`, `Mji wa Huruma`

- **youth_training_progress**: Training completion tracking
  - Links: `youth_id` → youth_participants
  - `module_type`: `mapper`, `validator`, `mobile_mapping`, `household_survey`, `microtasking1`, `microtasking2`, `microtasking3`
  - `step_id`: Training step number (1-7 for mapper, 1-6 for validator, 1-4 for mobile_mapping, 1-3 for microtasking)
  - Sequential validation enforced: must complete step N-1 before step N

- **youth_work_days**: Daily work tracking (20-day work periods)
  - Links: `youth_id` → youth_participants, `approved_by` → staff_members
  - `buildings_count`: Auto-populated from OSM API for digitization
  - `daily_target`: Default 200 buildings (configurable per settlement/program)
  - `status`: `pending`, `approved`, `rejected`

- **youth_osm_stats**: Cache for OSM building counts
  - Links: `youth_id` → youth_participants
  - Prevents OSM API rate limiting (5-min cache)
  - `date`, `buildings_mapped`, `changesets_analyzed`, `last_changeset_id`

- **settlement_work_config**: Work period configuration
  - `settlement` + `program_type` (unique pair)
  - `start_date`, `total_work_days`, `daily_target`, `project_hashtag`
  - Defines work period boundaries and targets

- **signed_contracts**: Digital contract signatures
  - Links: `youth_id` → youth_participants, `template_id` → contract_templates
  - `signature_data`: Base64-encoded signature image
  - Tracks IP, user agent, timestamp

- **staff_members**: Trainers, admins, superadmins
  - `staff_id` (PK): `STEA####SA`, `SFEA####T` format
  - `role`: `trainer`, `admin`, `superadmin`
  - `password_hash VARCHAR(255)`: bcrypt hash for Learn email login (nullable — not all staff have it)
  - Approves work days, manages youth

- **payment_disputes**: Youth-filed payment disputes
  - `id SERIAL PK`, `youth_id`, `dispute_date`, `module`, `issue_type`
  - `issue_type`: `missed_attendance`, `wrong_volume`, `missing_bonus`, `wrong_module`, `other`
  - `description`, `expected_amount_kes`, `reported_amount_kes`
  - `status DEFAULT 'open'` CHECK IN (`open`, `resolved`, `rejected`)
  - `resolver_staff_id`, `resolution_note`, `resolved_at` — populated when resolved/rejected
  - Created via `scripts/create-disputes-table.js`

### Data Relationships
```
youth_participants (1) ← (many) youth_training_progress
youth_participants (1) ← (many) youth_work_days → (1) staff_members [approved_by]
youth_participants (1) ← (many) youth_osm_stats
youth_participants (1) ← (many) signed_contracts → (1) contract_templates
youth_participants (1) ← (many) payment_disputes → (1) staff_members [resolver_staff_id]
settlement_work_config: defines work periods per settlement+program
```

Full schema in [docs/PLATFORM_DOCUMENTATION.md](docs/PLATFORM_DOCUMENTATION.md#41-core-tables)

## Admin Dashboard

### Pages
- `/admin` — Overview with stats from DPW Manager
- `/admin/youth` — Youth list and individual detail (`/admin/youth/[id]`)
- `/admin/trainers` — Staff & trainers management: view all trainer/admin accounts, set/reset/revoke Learn login passwords

### Admin Nav
Defined in [src/app/admin/layout.tsx](src/app/admin/layout.tsx) `navLinks` array: Overview, Youth, Trainers. Guard: `parsed.role !== 'admin'` redirects to trainer or root.

### YouthDetailTabs Component
[src/components/admin/YouthDetailTabs.tsx](src/components/admin/YouthDetailTabs.tsx) — 5 tabs: Profile, Attendance, Performance, Payments (v4 daily records), **Disputes** (with inline Resolve/Reject actions for open disputes).

## Disputes Feature

- Youth file disputes via `/dashboard/payments` page (modal form)
- Admins/trainers resolve or reject via the Disputes tab in YouthDetailTabs
- **API**:
  - `GET /api/disputes?youth_id=KAY123` — list disputes (youth sees own; trainer/admin sees all or filtered)
  - `POST /api/disputes` — youth files a new dispute (409 if duplicate open dispute for same date)
  - `PATCH /api/disputes/[id]` — trainer/admin resolves or rejects (`{ status, resolution_note }`)

## Trainer Login Feature

- Staff with `password_hash` set can log in at `/auth/staff` with email + password
- Admins manage passwords at `/admin/trainers` (set, reset, revoke)
- **API**:
  - `POST /api/auth/staff` — bcrypt verify, issues JWT with trainer or admin role
  - `PATCH /api/admin/trainers/[id]/password` — admin sets trainer's password (bcrypt cost 12)
  - `DELETE /api/admin/trainers/[id]/password` — admin revokes trainer's login access
- `normalizeRole()` in [src/app/api/_lib/auth.ts](src/app/api/_lib/auth.ts) maps DPW role variants to canonical `'admin'` / `'trainer'` for consistent post-login routing

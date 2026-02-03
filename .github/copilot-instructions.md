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
  - Staff/Trainer: management, attendance submission
  - Work: OSM building counts, work days
  - Contracts: digital signatures
- **External API**: Public GET endpoint [src/app/api/external/dpw-sync](src/app/api/external/dpw-sync) syncs data to `app.spatialcollective.com`
  - Auth: Requires `X-API-Key` header matching `DPW_MANAGER_API_KEY` env var
  - Query params: `?youth_id=KAY123` or `?module=mobile_mapping`

### Authentication & Authorization
- JWT-based auth using `learn_STACK_SECRET_SERVER_KEY` or `JWT_SECRET` env var
- Helpers in [src/app/api/_lib/auth.ts](src/app/api/_lib/auth.ts)
- Youth login: youth_id (e.g., `KAY123`), Trainers: email/password
- Roles: Youth, Trainer, Staff, Admin, Superadmin

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
  - `module_type`: `mapper`, `validator`, `mobile_mapping`, `household_survey`, `microtasking`1-3 for microtasking
  - `step_id`: Training step number (1-7 for mapper, 1-6 for validator, 1-4 for mobile_mapping, etc.)
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
  - Approves work days, manages youth

### Data Relationships
```
youth_participants (1) ← (many) youth_training_progress
youth_participants (1) ← (many) youth_work_days → (1) staff_members [approved_by]
youth_participants (1) ← (many) youth_osm_stats
youth_participants (1) ← (many) signed_contracts → (1) contract_templates
settlement_work_config: defines work periods per settlement+program
```

Full schema in [docs/PLATFORM_DOCUMENTATION.md](docs/PLATFORM_DOCUMENTATION.md#41-core-tables)

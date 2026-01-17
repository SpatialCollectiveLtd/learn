# Spatial Collective Learning Platform - Documentation

**Last Updated:** January 17, 2026

## 📚 Documentation Structure

### API Documentation (`/docs/api/`)
- **[DPW_INTEGRATION_API.md](api/DPW_INTEGRATION_API.md)** - DPW Manager data sync API (comprehensive)
- **[DPW_API_KEY.md](api/DPW_API_KEY.md)** - API key setup and configuration
- **[DPW_API_INTEGRATION_SPEC.md](api/DPW_API_INTEGRATION_SPEC.md)** - Integration specifications
- **[DPW_IMPLEMENTATION_SUMMARY.md](api/DPW_IMPLEMENTATION_SUMMARY.md)** - Quick reference
- **[EXTERNAL_API_INTEGRATION.md](api/EXTERNAL_API_INTEGRATION.md)** - All external API integrations
- **[Email-API-Docs.md](api/Email-API-Docs.md)** - Email notification API

### Deployment Documentation (`/docs/deployment/`)
- **[PRODUCTION_DEPLOYMENT.md](deployment/PRODUCTION_DEPLOYMENT.md)** - Production deployment guide
- **[VERCEL_ENV_SETUP.md](deployment/VERCEL_ENV_SETUP.md)** - Vercel environment configuration
- **[DEPLOYMENT_CHECKLIST_PRIVATE_OSM.md](deployment/DEPLOYMENT_CHECKLIST_PRIVATE_OSM.md)** - OSM deployment checklist
- **[DEPLOYMENT_STATUS.md](deployment/DEPLOYMENT_STATUS.md)** - Current deployment status
- **[DEPLOYMENT_SUMMARY.md](deployment/DEPLOYMENT_SUMMARY.md)** - Deployment summary
- **[DEPLOYMENT_VERIFY.md](deployment/DEPLOYMENT_VERIFY.md)** - Verification steps

### Feature Documentation (`/docs/features/`)
- **[MESSAGES_FEATURE_IMPLEMENTATION.md](features/MESSAGES_FEATURE_IMPLEMENTATION.md)** - Messaging system
- **[TRAINING_PROGRESS_IMPLEMENTATION.md](features/TRAINING_PROGRESS_IMPLEMENTATION.md)** - Training progress tracking
- **[WORK_DASHBOARD_COMPLETE.md](features/WORK_DASHBOARD_COMPLETE.md)** - Work dashboard (complete)
- **[WORK_DASHBOARD_IMPLEMENTATION_PLAN.md](features/WORK_DASHBOARD_IMPLEMENTATION_PLAN.md)** - Implementation plan
- **[WORK_DASHBOARD_DEPLOYMENT.md](features/WORK_DASHBOARD_DEPLOYMENT.md)** - Deployment guide
- **[WORK_DAYS_AUTO_COUNT.md](features/WORK_DAYS_AUTO_COUNT.md)** - Automatic work day counting

### User Guides (`/docs/guides/`)
- **[JOSM_SETUP_RATE_LIMIT_GUIDE.md](guides/JOSM_SETUP_RATE_LIMIT_GUIDE.md)** - JOSM configuration
- **[JOSM_CONFIG_FILES.md](guides/JOSM_CONFIG_FILES.md)** - JOSM configuration files
- **[MODULE_CONTRACTS_GUIDE.md](guides/MODULE_CONTRACTS_GUIDE.md)** - Module contracts
- **[OSM_BUILDING_COUNTING_METHODOLOGY.md](guides/OSM_BUILDING_COUNTING_METHODOLOGY.md)** - Building counting
- **[OSM_COMMUNITY_RESPONSE_PLAN.md](guides/OSM_COMMUNITY_RESPONSE_PLAN.md)** - Community engagement
- **[QUICK_REFERENCE.md](guides/QUICK_REFERENCE.md)** - Quick reference guide

### Platform Documentation
- **[PLATFORM_DOCUMENTATION.md](PLATFORM_DOCUMENTATION.md)** - Main platform documentation

---

## 🛠️ Scripts Directory (`/scripts/`)

### Active/Useful Scripts

#### Database Management
- `check-tables.js` - List all database tables and columns
- `check-work-summary.js` - Verify work summary table structure
- `check-env-vars.js` - Verify environment variables

#### Testing Scripts
- `test-dpw-api.js` - Test DPW API locally
- `test-dpw-production.js` - Test DPW API in production
- `test-production-full.js` - Comprehensive production API tests
- `test-attendance-api.js` - Test attendance API

#### ODK Central Integration
- `register-mobile-mappers.js` - Register mobile mappers on ODK Central
- `export-odk-config.js` - Export ODK configuration

#### User Management
- `add-trainers.js` - Add new trainer accounts
- `check-mappers.js` - Check mapper status and counts

### Archived Scripts
All temporary, one-off, and historical scripts have been moved to `/archive/`

---

## 📦 Archive Directory (`/archive/`)

Contains:
- Historical documentation and investigation reports
- Data snapshots (JSON, CSV, XML files)
- One-time migration scripts
- Debug and analysis scripts
- Old configuration files

---

## 🔑 Key Information

### Production URL
`https://learn.spatialcollective.co.ke`

### DPW Manager API
- **Endpoint:** `/api/external/dpw-sync`
- **Authentication:** API Key in `X-API-Key` header
- **Key Location:** `.env.local` → `DPW_MANAGER_API_KEY`
- **Documentation:** [docs/api/DPW_INTEGRATION_API.md](api/DPW_INTEGRATION_API.md)

### Database
- **Provider:** Neon (PostgreSQL)
- **Tables:** 21 total
- **Key Tables:** `youth_participants`, `signed_contracts`, `youth_training_progress`, `youth_work_days`, `youth_work_summary`, `attendance_records`

### Current Modules
1. **Digitization** - 53 active participants
2. **Mobile Mapping** - 95 active participants (launched Jan 14, 2026)

### ODK Central Integration
- **Project ID:** 41
- **App Users:** 95 mobile mappers
- **Forms:** Mobile mapping data collection

---

## 📊 Current Status (Jan 17, 2026)

### Mobile Mapping Module
- ✅ 95 mappers registered on ODK Central
- ✅ Attendance tracking system operational
- ✅ Training completion: 78/95 (82%)
- ✅ Attendance rate: 82% (Jan 15 & 16)
- ✅ 12 trainers (4 added recently)

### Recent Updates
- ✅ DPW Manager API deployed and working
- ✅ Attendance UI improved (dynamic stats, better calendar)
- ✅ All emojis replaced with Lucide icons
- ✅ Codebase organized and cleaned up

---

## 🚀 Quick Start

1. **Environment Setup:** See [docs/deployment/VERCEL_ENV_SETUP.md](deployment/VERCEL_ENV_SETUP.md)
2. **Development:** `npm run dev`
3. **Build:** `npm run build`
4. **Deploy:** Push to `main` branch (auto-deploys via Vercel)

---

## 📝 Contributing

When adding new features:
1. Update relevant documentation in `/docs/`
2. Add test scripts to `/scripts/`
3. Update this index if needed
4. Commit with descriptive messages

---

*For questions or issues, contact the Spatial Collective development team.*

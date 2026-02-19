# Spatial Collective Learning Platform - Documentation

**Last Updated:** February 19, 2026

## 📁 Documentation Structure

```
docs/
├── api/                # External API integration documentation
├── deployment/         # Deployment guides and checklists
├── features/           # Feature implementation documentation
├── guides/             # User and developer guides
├── historical/         # Archived implementation summaries
├── DEVELOPER_ONBOARDING.md
├── PLATFORM_DOCUMENTATION.md
└── README.md          # This file
```

---

## 🔌 API Documentation (`api/`)

### Integration Guides
- **[DPW_INTEGRATION_API.md](api/DPW_INTEGRATION_API.md)** - Complete DPW Manager API specification
- **[DPW_API_KEY.md](api/DPW_API_KEY.md)** - API key setup and authentication
- **[EXTERNAL_API_INTEGRATION.md](api/EXTERNAL_API_INTEGRATION.md)** - All external API integrations
- **[Email-API-Docs.md](api/Email-API-Docs.md)** - Spatial Collective email API
- **[QUICK_START_INTEGRATION.md](api/QUICK_START_INTEGRATION.md)** - Quick integration guide

### Implementation Details
- **[DPW_API_INTEGRATION_SPEC.md](api/DPW_API_INTEGRATION_SPEC.md)** - Technical specification
- **[DPW_IMPLEMENTATION_SUMMARY.md](api/DPW_IMPLEMENTATION_SUMMARY.md)** - Implementation summary
- **[DPW_MOBILE_MAPPING_FEATURES_API_REQUEST.md](api/DPW_MOBILE_MAPPING_FEATURES_API_REQUEST.md)** - Mobile mapping features
- **[ATTENDANCE_HISTORY_FIX.md](api/ATTENDANCE_HISTORY_FIX.md)** - Attendance history

---

## 🚀 Deployment (`deployment/`)

### Deployment Guides
- **[PRODUCTION_DEPLOYMENT.md](deployment/PRODUCTION_DEPLOYMENT.md)** - Production deployment process
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[PRODUCTION_READY.md](deployment/PRODUCTION_READY.md)** - Production readiness verification
- **[VERCEL_ENV_SETUP.md](deployment/VERCEL_ENV_SETUP.md)** - Vercel environment configuration

### Verification
- **[DEPLOYMENT_VERIFY.md](deployment/DEPLOYMENT_VERIFY.md)** - Post-deployment verification
- **[DEPLOYMENT_VERIFICATION.md](deployment/DEPLOYMENT_VERIFICATION.md)** - Comprehensive verification
- **[DEPLOYMENT_STATUS.md](deployment/DEPLOYMENT_STATUS.md)** - Current deployment status
- **[DEPLOYMENT_SUMMARY.md](deployment/DEPLOYMENT_SUMMARY.md)** - Deployment history
- **[DEPLOYMENT_CHECKLIST_PRIVATE_OSM.md](deployment/DEPLOYMENT_CHECKLIST_PRIVATE_OSM.md)** - Private OSM checklist

---

## ✨ Features (`features/`)

### Core Features
- **[TRAINING_PROGRESS_IMPLEMENTATION.md](features/TRAINING_PROGRESS_IMPLEMENTATION.md)** - Sequential training system
- **[WORK_DASHBOARD_COMPLETE.md](features/WORK_DASHBOARD_COMPLETE.md)** - Work dashboard implementation
- **[WORK_DASHBOARD_IMPLEMENTATION_PLAN.md](features/WORK_DASHBOARD_IMPLEMENTATION_PLAN.md)** - Dashboard architecture
- **[WORK_DASHBOARD_DEPLOYMENT.md](features/WORK_DASHBOARD_DEPLOYMENT.md)** - Dashboard deployment

### Attendance & Work Management
- **[DIGITAL_ATTENDANCE_PRD.md](features/DIGITAL_ATTENDANCE_PRD.md)** - Digital attendance requirements
- **[ATTENDANCE_DELETE_FEATURE.md](features/ATTENDANCE_DELETE_FEATURE.md)** - Attendance deletion
- **[WORK_DAYS_AUTO_COUNT.md](features/WORK_DAYS_AUTO_COUNT.md)** - Automatic building counting
- **[WORK_DAYS_2025_2026_BREAKDOWN.md](features/WORK_DAYS_2025_2026_BREAKDOWN.md)** - Work days analysis

### Communication
- **[MESSAGES_FEATURE_IMPLEMENTATION.md](features/MESSAGES_FEATURE_IMPLEMENTATION.md)** - Messages feature

---

## 📖 Guides (`guides/`)

### User Guides
- **[Microtasking Manual.md](guides/Microtasking%20Manual.md)** - Complete microtasking guide
- **[MICROTASKING_MODULE_SETUP_GUIDE.md](guides/MICROTASKING_MODULE_SETUP_GUIDE.md)** - Setup instructions
- **[Youth Code of Conduct.pdf](Youth%20Code%20of%20Conduct.pdf)** - Participant code of conduct

### Technical Guides
- **[JOSM_SETUP_RATE_LIMIT_GUIDE.md](guides/JOSM_SETUP_RATE_LIMIT_GUIDE.md)** - JOSM configuration
- **[JOSM_CONFIG_FILES.md](guides/JOSM_CONFIG_FILES.md)** - JOSM config files
- **[OSM_BUILDING_COUNTING_METHODOLOGY.md](guides/OSM_BUILDING_COUNTING_METHODOLOGY.md)** - Counting methodology
- **[MODULE_CONTRACTS_GUIDE.md](guides/MODULE_CONTRACTS_GUIDE.md)** - Contract system

### Reference
- **[QUICK_REFERENCE.md](guides/QUICK_REFERENCE.md)** - Quick reference
- **[QUICK_REFERENCE_DELETE_ATTENDANCE.md](guides/QUICK_REFERENCE_DELETE_ATTENDANCE.md)** - Attendance deletion reference
- **[AI_AGENT_INSTRUCTIONS.md](AI_AGENT_INSTRUCTIONS.md)** - AI agent development

---

## 📚 Historical Documentation (`historical/`)

Archived implementation summaries and status reports from previous development cycles.

**Contents:**
- Mobile mapping implementation cycle (Jan 2026)
- Microtasking module implementation (Feb 2026)
- Backend testing and API fix summaries
- Production deployment reports
- System audits and status snapshots

---

## � Core Documentation

### DEVELOPER_ONBOARDING.md
Complete developer setup guide:
- Tech stack overview (Next.js 16, PostgreSQL, Redis)
- Project structure and architecture
- Environment variables setup
- Database setup and migrations
- Development workflow
- Testing procedures

### PLATFORM_DOCUMENTATION.md
Comprehensive platform documentation:
- System architecture
- Database schema (21 tables)
- API endpoints and authentication
- External integrations (ODK, OSM, DPW, Email)
- Training modules (Digitization, Mobile Mapping, Microtasking)

### DATABASE_INTEGRATION_PLAN.md
Database architecture and integration guidelines

---

## 🎯 Quick Reference

### For New Developers
1. Start with [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md)
2. Review [PLATFORM_DOCUMENTATION.md](PLATFORM_DOCUMENTATION.md)
3. Check [api/EXTERNAL_API_INTEGRATION.md](api/EXTERNAL_API_INTEGRATION.md)
4. Browse [../scripts/README.md](../scripts/README.md) for available scripts

### For API Integration
1. Quick start: [api/QUICK_START_INTEGRATION.md](api/QUICK_START_INTEGRATION.md)
2. DPW API: [api/DPW_INTEGRATION_API.md](api/DPW_INTEGRATION_API.md)
3. API keys: [api/DPW_API_KEY.md](api/DPW_API_KEY.md)

### For Deployment
1. Checklist: [deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
2. Guide: [deployment/PRODUCTION_DEPLOYMENT.md](deployment/PRODUCTION_DEPLOYMENT.md)
3. Verify: [deployment/DEPLOYMENT_VERIFY.md](deployment/DEPLOYMENT_VERIFY.md)

### For Feature Development
Check [features/](features/) for detailed implementation guides

---

## 🔑 Key Information

### Production
- **URL:** https://learn.spatialcollective.co.ke
- **Database:** Neon PostgreSQL (21 tables)
- **Deployment:** Vercel

### External Services
- **ODK Central:** https://collector.kesmis.go.ke
- **Private OSM:** https://osm.spatialcollective.co.ke
- **DPW Manager:** https://app.spatialcollective.com
- **Email API:** Spatial Collective email service

### DPW Manager API
- **Endpoint:** `/api/external/dpw-sync`
- **Method:** GET
- **Auth:** `X-API-Key` header
- **Params:** `?youth_id=KAY123` or `?module=mobile_mapping`

### Current Modules (Feb 2026)
1. **Digitization** - Remote building mapping (~50 youth)
2. **Mobile Mapping** - Field data collection (~150 youth)
3. **Microtasking** - Data validation tasks (~25 youth)
4. **Household Survey** - Planned

---

## 🔗 External Resources

- **GitHub Repository:** (your repo link)
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **ODK Central:** https://collector.kesmis.go.ke

---

## 🔄 Documentation Maintenance

### When to Update
- New feature implementation
- API changes or integrations
- Deployment process updates
- Breaking changes or major bug fixes

### Documentation Standards
- Use Markdown format
- Include date in header: `**Last Updated:** YYYY-MM-DD`
- Add code examples where relevant
- Link to related documentation
- Keep historical docs in `historical/`

### File Naming
- `UPPERCASE_WITH_UNDERSCORES.md` for major docs
- Descriptive names indicating content
- Group related docs in subdirectories

---

*For questions, check inline code comments or contact the development team.*

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

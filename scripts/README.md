# Scripts Directory

**Last Updated:** February 19, 2026

## 📁 Directory Structure

```
scripts/
├── utilities/          # Database checks, backups, config verification
├── testing/            # API and integration test scripts
├── user-management/    # Youth and trainer account management
├── historical/         # One-time migrations and fixes (archived)
└── README.md          # This file
```

---

## 🗄️ Utilities (`utilities/`)

**Database Management:**
- `check-tables.js` - List all database tables and columns
- `check-work-summary.js` - Verify youth_work_summary table structure
- `check-env-vars.js` - Verify environment variables
- `check-mappers.js` - Check mapper counts by program type
- `backup-youth-data.js` - Backup youth_participants table (JSON + SQL)
- `backup-full-database.js` - Complete database backup
- `backup-database-simple.js` - Simple database backup

**Data Verification:**
- `check-attendance-dates.js` - Generate attendance reports by date
- `check-work-data.js` - Verify work days data
- `check-youth-stats.js` - Check youth statistics
- `check-program-types.js` - Verify program type assignments
- `verify-database-integrity.js` - Complete database integrity check

**Configuration:**
- `export-odk-config.js` - Export ODK Central configuration and QR codes
- `check-digitization-config.js` - Verify digitization work config

---

## 🧪 Testing (`testing/`)

**DPW API Testing:**
- `test-production-full.js` - ⭐ **RECOMMENDED** Comprehensive production test suite
- `test-dpw-api.js` - Test DPW API locally (all endpoints)
- `test-dpw-local.js` - Local DPW API testing with detailed output
- `test-dpw-production.js` - Production DPW API basic test

**Other API Testing:**
- `test-attendance-api.js` - Test attendance search and submission
- `test-work-days-api.js` - Test work days endpoints
- `test-all-apis.js` - Comprehensive API test suite
- `test-api-health.js` - API health check

**Component Testing:**
- `test-osm-data.js` - Test OSM data integration
- `test-counting-logic.js` - Test building counting logic
- `test-changeset-parsing.js` - Test OSM changeset parsing

---

## 👥 User Management (`user-management/`)

**Youth Management:**
- `add-new-youth.js` - Add new youth participants
- `verify-and-add-youth.js` - Verify and add youth with validation
- `register-mobile-mappers.js` - Register mobile mappers on ODK Central
- `odk-batch-register.js` - Batch register users on ODK Central

**Trainer Management:**
- `add-trainers.js` - Add new trainer accounts

**Account Operations:**
- `reset-user-logins.js` - Reset user login credentials
- `clear-attendance.js` - Clear attendance records (use with caution)

---

## 📚 Historical (`historical/`)

One-time scripts that were run for specific migrations, fixes, or data operations. These are preserved for reference but should not be run again.

**Recent Additions (Feb 2026):**
- Microtasking migration scripts
- User-specific fixes (Regina, Paul, Kay2333oo)
- Data restoration and audit scripts
- Weekend error cleanup

**Note:** Additional historical scripts also in `/archive/`

---

## 🚀 Common Operations

### Testing Production DPW API
```bash
node scripts/testing/test-production-full.js
```

### Check Database Status
```bash
node scripts/utilities/check-tables.js
node scripts/utilities/check-mappers.js
```

### Backup Youth Data
```bash
node scripts/utilities/backup-youth-data.js
```

### Add New Youth
```bash
node scripts/user-management/add-new-youth.js
```

### Register Mobile Mappers on ODK
```bash
node scripts/user-management/register-mobile-mappers.js
```

### Generate Attendance Report
```bash
node scripts/utilities/check-attendance-dates.js
```

---

## 📝 Script Conventions

### Naming
- **check-**: Verification and status checks
- **test-**: Testing scripts
- **add-**: Add new records
- **update-**: Update existing records
- **backup-**: Backup operations
- **verify-**: Validation operations
- **export-**: Export data/configs

### Requirements
- Node.js v24+
- `.env.local` file with required environment variables
- Import dotenv: `require('dotenv').config({path:'.env.local'})`

### Database Access
- Use `Database.query()` from `src/app/api/_lib/database.ts` for API routes
- Use pooled client from `src/lib/db.ts` for non-route utilities

---

## ⚠️ Important Notes

### Before Running Scripts
1. Always backup `youth_participants` before destructive operations
2. Run `check-env-vars.js` to verify environment setup
3. Test on development database first when possible

### Database Safety
- Backup command: `node scripts/utilities/backup-youth-data.js`
- Backups stored in: `backups/` directory with timestamps

### Production Usage
- Use `test-production-full.js` before deploying changes
- Verify API keys are set correctly
- Check rate limits for external APIs (OSM, ODK)

---

## 🔗 Related Documentation

- **Developer Setup**: [docs/DEVELOPER_ONBOARDING.md](../docs/DEVELOPER_ONBOARDING.md)
- **API Integration**: [docs/api/](../docs/api/)
- **Platform Docs**: [docs/PLATFORM_DOCUMENTATION.md](../docs/PLATFORM_DOCUMENTATION.md)
- **Archive Scripts**: [archive/README.md](../archive/README.md)

---

*For questions about specific scripts, check inline comments or contact the development team.*

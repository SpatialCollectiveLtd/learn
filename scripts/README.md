# Scripts Directory

**Last Updated:** January 17, 2026

## 📋 Active Scripts Inventory

### 🗄️ Database Utilities

- **check-tables.js** - List all database tables and their columns
- **check-work-summary.js** - Verify youth_work_summary table structure and sample data
- **check-env-vars.js** - Verify environment variables are properly set
- **check-mappers.js** - Check mapper counts and status by program type

### 🧪 Testing Scripts

#### DPW API Testing
- **test-dpw-api.js** - Test DPW API locally (all endpoints)
- **test-dpw-local.js** - Local DPW API testing with detailed output
- **test-dpw-production.js** - Production DPW API basic test
- **test-production-full.js** - Comprehensive production API test suite ✨ RECOMMENDED

#### Other API Testing
- **test-attendance-api.js** - Test attendance search and submission APIs

### 👥 User Management

- **add-trainers.js** - Add new trainer accounts to the system
- **register-mobile-mappers.js** - Register mobile mappers on ODK Central

### 📊 Data Management

- **check-attendance-dates.js** - Generate attendance reports by date
- **export-odk-config.js** - Export ODK Central configuration and QR codes
- **clear-attendance.js** - Clear all attendance records (use with caution)

---

## 🗑️ Archived Scripts

The following categories of scripts have been moved to `/archive/`:

- Migration scripts (one-time database migrations)
- Historical debug scripts
- Data analysis scripts
- Old verification scripts
- Temporary fix scripts

**Tip:** If you need to reference old functionality, check `/archive/`

---

## 🚀 Usage Examples

### Test Production DPW API
```bash
node scripts/test-production-full.js
```

### Check Database Tables
```bash
node scripts/check-tables.js
```

### Register Mobile Mappers on ODK Central
```bash
node scripts/register-mobile-mappers.js
```

### Add New Trainers
```bash
node scripts/add-trainers.js
```

### Generate Attendance Report
```bash
node scripts/check-attendance-dates.js
```

---

## ⚙️ Environment Requirements

All scripts require:
- `.env.local` file with database credentials and API keys
- Node.js v24+
- `dotenv` package for environment variable loading

---

## 📝 Script Development Guidelines

When creating new scripts:

1. **Naming Convention:** Use descriptive kebab-case names
   - `check-*` for read-only operations
   - `test-*` for testing
   - `add-*` or `update-*` for write operations
   - `export-*` for data exports

2. **Environment Loading:**
   ```javascript
   require('dotenv').config({ path: '.env.local' });
   ```

3. **Database Connection:**
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });
   ```

4. **Error Handling:** Always include try-catch blocks and proper error messages

5. **Documentation:** Add inline comments explaining complex logic

6. **Cleanup:** Close database connections with `pool.end()`

---

## 🔍 Finding Scripts

**Current working scripts:** `/scripts/` (this directory)  
**Old/archived scripts:** `/archive/`  
**Scripts count:** ~25 active scripts

---

*For questions about specific scripts, check inline comments or contact the development team.*

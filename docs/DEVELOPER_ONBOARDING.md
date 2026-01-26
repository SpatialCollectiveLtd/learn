# Developer Onboarding Guide

**SC Training Hub - Spatial Collective Learning Platform**

Welcome to the development team! This document will get you up and running with the codebase.

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [Key Features & Code Locations](#key-features--code-locations)
8. [External Services](#external-services)
9. [Git Workflow](#git-workflow)
10. [Your First Task](#your-first-task)
11. [Common Scripts](#common-scripts)
12. [Getting Help](#getting-help)

---

## Platform Overview

SC Training Hub is a **Next.js 16** application that manages youth training programs for Spatial Collective. It serves 200+ youth across 3 informal settlements in Nairobi:

- **Kayole Soweto** (primary)
- **Mji wa Huruma**
- **Kariobangi Machakos**

### What the Platform Does

| Feature | Description |
|---------|-------------|
| **Training Modules** | Step-by-step training for digitization and mobile mapping |
| **Youth Management** | Profiles, authentication, contract signing |
| **Work Tracking** | Counts buildings mapped via OSM API integration |
| **Attendance** | Digital attendance submission by trainers |
| **ODK Integration** | QR codes for mobile data collection app configuration |
| **External API** | Syncs data with app.spatialcollective.com |

### User Roles

- **Youth** - Training participants (login with youth_id)
- **Trainer** - Field supervisors (submit attendance)
- **Staff** - Office team
- **Admin/Superadmin** - Full access

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.0.7 (App Router) |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Icons** | Lucide React, Tabler Icons |
| **Database** | PostgreSQL (Neon - serverless) |
| **Authentication** | JWT (custom implementation) |
| **Deployment** | Vercel (auto-deploy from `main`) |
| **External APIs** | ODK Central, Private OSM Server, Email API |

### Key Dependencies

```json
{
  "next": "^16.0.7",
  "react": "^19.0.1",
  "pg": "^8.16.3",           // PostgreSQL client
  "jsonwebtoken": "^9.0.2",  // JWT auth
  "tailwind-merge": "^3.4.0",
  "lucide-react": "^0.554.0"
}
```

---

## Project Structure

```
learn/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (backend)
│   │   │   ├── youth/         # Youth auth, profile, training
│   │   │   ├── staff/         # Staff auth, management
│   │   │   ├── trainer/       # Attendance submission
│   │   │   ├── work/          # Work stats, OSM integration
│   │   │   ├── contracts/     # Contract signing
│   │   │   ├── external/      # DPW Manager API
│   │   │   └── _lib/          # Shared utilities (database.ts)
│   │   ├── dashboard/         # Youth dashboard pages
│   │   ├── digitization/      # Digitization training module
│   │   ├── mobile-mapping/    # Mobile mapping training module
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── YouthAuthentication.tsx
│   │   ├── StaffAuthentication.tsx
│   │   └── ContractSigning.tsx
│   ├── data/                  # Static data
│   │   ├── mapper-training.ts         # Digitization training content
│   │   ├── mobile-mapping-training.ts # Mobile mapping training content ⚠️
│   │   └── validator-training.ts
│   └── lib/                   # Utilities
│       ├── db.ts             # Database connection pool
│       ├── osm-service.ts    # OSM API integration
│       └── utils.ts
├── scripts/                   # Node.js utility scripts
│   ├── register-*.js         # User registration scripts
│   ├── check-*.js            # Status checking scripts
│   └── README.md
├── database/                  # SQL schemas and migrations
│   ├── schema-neon-postgresql.sql
│   └── migrations/
├── docs/                      # Documentation
├── public/                    # Static assets
└── archive/                   # Old/deprecated files
```

---

## Development Setup

### Prerequisites

- **Node.js** v24+ (check with `node --version`)
- **npm** (comes with Node.js)
- **Git** access to the repository
- **VS Code** (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/SpatialCollective/learn.git
cd learn
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with the credentials (see [Environment Variables](#environment-variables) section).

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Verify Setup

```bash
# Check database connection
node scripts/check-tables.js

# Check environment variables
node scripts/check-env-vars.js
```

---

## Environment Variables

You need a `.env.local` file with these variables. Request credentials from the team lead.

### Required Variables

```env
# Database (Neon PostgreSQL) - PRODUCTION DATABASE
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication
learn_STACK_SECRET_SERVER_KEY=your-jwt-secret-min-32-chars
JWT_SECRET=same-as-above

# Platform URL
NEXTAUTH_URL=http://localhost:3000

# Email API
EMAIL_API_URL=https://tasks.spatialcollective.co.ke/email-api
EMAIL_API_KEY=your-email-api-key

# DPW Manager API
DPW_MANAGER_API_KEY=your-dpw-api-key

# Private OSM Server
NEXT_PUBLIC_OSM_SERVER_URL=https://osm.spatialcollective.co.ke
```

### ODK Central (You don't need these)

ODK Central credentials are managed separately. The platform reads ODK tokens from the database, so you don't need ODK credentials for local development.

```env
# NOT NEEDED for your setup - managed by team lead
# ODK_CENTRAL_URL=https://collector.kesmis.go.ke
# ODK_ADMIN_EMAIL=...
# ODK_ADMIN_PASSWORD=...
```

### ⚠️ Database Warning

**You are connecting to the PRODUCTION database.** Before running any:
- `INSERT`, `UPDATE`, `DELETE` queries
- Database migrations
- Scripts that modify data

**Always:**
1. Test your query with `SELECT` first
2. Use `WHERE` clauses to limit scope
3. Ask for review on significant changes
4. Back up if doing bulk operations

---

## Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `youth_participants` | All youth profiles, ODK tokens, OSM usernames |
| `staff_members` | Trainers, admins, superadmins |
| `signed_contracts` | Digital contract signatures |
| `contract_templates` | Contract document templates |
| `auth_logs` | Login/logout audit trail |
| `attendance` | Daily attendance records |
| `youth_training_progress` | Training completion tracking |
| `work_days` | Approved work days per youth |
| `settlement_work_config` | Work period configuration per settlement |

### Important Columns in `youth_participants`

```sql
youth_id         -- Unique ID (e.g., KAY251BK, HUR478JM)
full_name        -- Display name
program_type     -- 'digitization' or 'mobile_mapping'
settlement       -- 'Kayole Soweto', 'Mji wa Huruma', 'Kariobangi Machakos'
osm_username     -- OpenStreetMap username (for digitizers)
odk_token        -- ODK Collect access token (for mobile mappers)
odk_actor_id     -- ODK Central user ID
is_active        -- Whether account is active
```

### Viewing Database

You can use Neon's web console or any PostgreSQL client (DBeaver, pgAdmin, etc.) with the `DATABASE_URL`.

---

## Key Features & Code Locations

### Training Content ⚠️ YOUR FIRST TASK

| File | Content |
|------|---------|
| `src/data/mobile-mapping-training.ts` | Mobile mapping training steps |
| `src/data/mapper-training.ts` | Digitization training content |
| `src/data/validator-training.ts` | Validator training content |

**Issue:** Training content has hardcoded "Kayole Soweto" references, but users from Mji wa Huruma and Kariobangi also see this content. This needs to be made dynamic based on the user's settlement.

### Authentication

| File | Purpose |
|------|---------|
| `src/app/api/youth/auth/route.ts` | Youth login endpoint |
| `src/app/api/staff/auth/route.ts` | Staff login endpoint |
| `src/components/YouthAuthentication.tsx` | Youth login form |
| `src/components/StaffAuthentication.tsx` | Staff login form |

### API Routes

All API routes are in `src/app/api/`:

```
/api/youth/auth          - Youth authentication
/api/youth/profile       - Get/update youth profile
/api/youth/odk-config    - Get ODK QR code data
/api/staff/auth          - Staff authentication
/api/trainer/attendance  - Submit attendance
/api/work/stats          - Get work statistics
/api/external/dpw/*      - DPW Manager sync API
```

### Dashboard Pages

```
/dashboard              - Youth main dashboard
/dashboard/work         - Work statistics view
/dashboard/messages     - Email inbox
/digitization           - Digitization training module
/mobile-mapping         - Mobile mapping training module
```

---

## External Services

### 1. ODK Central (`collector.kesmis.go.ke`)

Mobile data collection server. Youth scan QR codes to configure ODK Collect app.

- **Project ID**: 41
- **Form**: `streetlight_training`
- You have your own admin login (separate from env vars)

### 2. Private OSM Server (`osm.spatialcollective.co.ke`)

OpenStreetMap instance for building counting. The platform queries this to count buildings mapped by each youth.

- Used via Overpass API
- `src/lib/osm-service.ts` handles the integration

### 3. DPW Manager API (`app.spatialcollective.com`)

External platform that syncs youth data. API is documented in `docs/api/DPW_INTEGRATION_API.md`.

### 4. Email API (`tasks.spatialcollective.co.ke`)

Proxies work emails for youth. Implemented in `src/app/api/messages/`.

---

## Git Workflow

### Branch Strategy

```
main (production)
  └── feature/your-feature-name (your work)
```

### Creating Your Branch

```bash
# Make sure you're on main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/dynamic-settlement-training

# Work on your changes...

# Commit with descriptive messages
git add .
git commit -m "Make training content dynamic based on user settlement"

# Push to GitHub
git push origin feature/dynamic-settlement-training
```

### Submitting Changes

1. Push your branch to GitHub
2. Create a **Pull Request** to `main`
3. Request review from the team lead
4. After approval, the team lead will merge
5. Vercel automatically deploys from `main`

### Commit Message Format

```
feat: Add dynamic settlement names to mobile mapping training
fix: Correct attendance date calculation
docs: Update API documentation
refactor: Simplify OSM query logic
```

---

## Your First Task

### Issue: Hardcoded Settlement Names in Training

**File:** `src/data/mobile-mapping-training.ts`

**Problem:** The training content mentions "Kayole Soweto" in multiple places:
- "You'll be visiting locations in Kayole Soweto"
- "Walking around assigned areas in Kayole Soweto"
- "Your work helps improve Kayole Soweto community"

**But:** Users from Mji wa Huruma and Kariobangi see the same content!

**Solution Options:**

1. **Template Approach** - Replace hardcoded names with placeholders, then substitute at render time based on logged-in user's settlement
2. **Generic Approach** - Replace specific settlement names with generic terms like "your assigned area" or "your community"
3. **Dynamic Content** - Create a function that returns content based on settlement

**Hints:**
- User's settlement is available from the JWT token or `/api/youth/profile`
- Look at how the training pages render content: `src/app/mobile-mapping/page.tsx`
- The `youth_participants.settlement` column contains the user's settlement

---

## Common Scripts

Run these from the project root:

```bash
# Check database tables
node scripts/check-tables.js

# Get full youth status
node scripts/get-full-status.js

# Check specific youth
node scripts/check-youth.js

# List all Huruma youth
node scripts/check-huruma-youth.js

# Test production API
node scripts/test-production-full.js
```

---

## Getting Help

### Communication

- **GitHub Issues** - Create issues for bugs, questions, or feature discussions
- **Code Reviews** - Request review on your PRs

### Useful Resources

| Resource | Location |
|----------|----------|
| Platform Documentation | `docs/PLATFORM_DOCUMENTATION.md` |
| API Documentation | `docs/api/` |
| Scripts Reference | `scripts/README.md` |
| Database Schema | `database/schema-neon-postgresql.sql` |

### Common Problems

**"Cannot connect to database"**
- Check `DATABASE_URL` in `.env.local`
- Ensure you have internet connection (Neon is cloud-hosted)

**"JWT secret error"**
- Make sure `learn_STACK_SECRET_SERVER_KEY` is at least 32 characters

**"Module not found"**
- Run `npm install` again
- Check import paths (use `@/` prefix for src imports)

---

## Account Information

### Your GitHub Account
- **Account**: Support@spatialcollective.com
- **Access**: Push to feature branches, create PRs
- **Cannot**: Push directly to `main`, merge PRs

### Services You Have Access To
- ✅ GitHub repository (via Support@spatialcollective.com)
- ✅ Production database (via shared `.env.local`)
- ✅ ODK Central admin (your own login)
- ✅ Private OSM Server
- ❌ Vercel dashboard (deployments via PR merge only)

---

## Quick Reference

### Run Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### File Naming Conventions

- **Pages**: `page.tsx` in route folders
- **API Routes**: `route.ts` in api folders
- **Components**: PascalCase (e.g., `YouthAuthentication.tsx`)
- **Utilities**: camelCase (e.g., `osm-service.ts`)
- **Scripts**: kebab-case (e.g., `check-youth.js`)

---

**Welcome to the team! 🎉**

Start by reading through the training files in `src/data/` and understanding how they're rendered. Then tackle the settlement name issue. Create a GitHub issue if you have questions!

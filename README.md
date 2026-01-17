# Spatial Collective Learning Platform

**Youth Training & Development Platform**

[![Deployment](https://img.shields.io/badge/deployment-Vercel-black)](https://learn.spatialcollective.co.ke)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)

---

## 🎯 Overview

Comprehensive digital training platform for youth programs in digital mapping, mobile data collection, and geospatial technologies. Currently serving **148 active participants** across 2 modules.

### ✨ Key Features

- **Multi-Module Training**: Digitization (53 participants), Mobile Mapping (95 participants)
- **ODK Central Integration**: Mobile data collection with 95 configured mappers
- **Attendance Tracking**: Digital attendance with trainer submission
- **Work Dashboard**: Real-time OSM building counting and performance tracking
- **Contract Management**: Digital contract signing and storage
- **DPW Manager API**: External data sync for app.spatialcollective.com
- **Progress Tracking**: Training completion monitoring
- **Multi-role System**: Youth, Staff, Trainers, Admins

### 🛠️ Technology Stack

- **Framework**: Next.js 16.0.7 with Turbopack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL (Neon) - 21 tables
- **APIs**: REST, ODK Central, OpenStreetMap Overpass
- **Authentication**: JWT tokens, API keys
- **Deployment**: Vercel (auto-deploy from main branch)

### 👥 User Roles

- **Youth Participants**: Training access, contract signing, progress tracking
- **Trainers**: Attendance submission, youth management (12 active)
- **Staff**: Platform management, reporting
- **Admins & Superadmins**: Full system access

---

## 📚 Documentation

All documentation is organized in `/docs/`:

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[API Documentation](docs/api/)** - DPW Manager API, external integrations
- **[Deployment Guides](docs/deployment/)** - Production deployment, Vercel setup
- **[Feature Docs](docs/features/)** - Work dashboard, messaging, training progress
- **[User Guides](docs/guides/)** - JOSM setup, OSM methodologies

### Quick Links
- [DPW Manager API](docs/api/DPW_INTEGRATION_API.md) - External data sync API
- [Platform Documentation](docs/PLATFORM_DOCUMENTATION.md) - Complete platform guide
- [Scripts Directory](scripts/README.md) - All utility scripts

---

## 🚀 Getting Started

### Prerequisites
- Node.js v24+
- PostgreSQL database (Neon)
- Environment variables (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Required variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string
- `DPW_MANAGER_API_KEY` - API key for DPW Manager integration
- `NEXTAUTH_SECRET` - JWT secret
- `NEXTAUTH_URL` - Platform URL

---

## 🧪 Testing

```bash
# Test DPW API (comprehensive)
node scripts/test-production-full.js

# Check database structure
node scripts/check-tables.js

# Verify environment variables
node scripts/check-env-vars.js
```

---

## 📂 Project Structure

```
learn/
├── docs/               # All documentation
│   ├── api/           # API documentation
│   ├── deployment/    # Deployment guides
│   ├── features/      # Feature documentation
│   └── guides/        # User guides
├── scripts/           # Utility scripts
├── src/               # Source code
│   ├── app/          # Next.js app directory
│   └── components/   # React components
├── archive/           # Historical files
└── public/           # Static assets
```

---

## 🔒 Security

- JWT-based authentication
- API key authentication for external integrations
- Database-level access controls
- Audit logging for all authentication events
- SSL/TLS encryption in production

---

## 📊 Current Status

**Last Updated:** January 17, 2026

### Active Modules
- **Digitization**: 53 participants, 664 days worked, 47,265 buildings mapped
- **Mobile Mapping**: 95 participants, launched Jan 14, 2026

### Mobile Mapping Module (Recent Launch)
- ✅ 95 mappers registered on ODK Central
- ✅ 78/95 (82%) training completed
- ✅ 82% attendance rate (156 records)
- ✅ 12 trainers managing the program
- ✅ DPW Manager API operational

---

## 🔧 Maintenance

### Regular Tasks
- Monitor attendance submission
- Review work performance metrics
- Update training materials as needed
- Maintain API integrations

### Useful Scripts
```bash
# Check mapper status
node scripts/check-mappers.js

# Generate attendance report
node scripts/check-attendance-dates.js

# Export ODK configuration
node scripts/export-odk-config.js
```

---

## 📝 Contributing

1. Create feature branch from `main`
2. Make changes and test locally
3. Update relevant documentation in `/docs/`
4. Commit with descriptive messages
5. Push to GitHub (auto-deploys via Vercel)

---

## 📄 License & Ownership

© 2025-2026 **Spatial Collective Limited**. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 📞 Contact

**Spatial Collective Limited**  
Email: info@spatialcollective.co.ke  
Platform: https://learn.spatialcollective.co.ke

---

*Built with ❤️ for youth empowerment through geospatial technology*

# Spatial Collective Learning Platform

**Youth Training & Development Platform**

[![Deployment](https://img.shields.io/badge/deployment-Vercel-black)](https://learn.spatialcollective.co.ke)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)

---

## 🎯 What is This Platform?

SC Training Hub is a comprehensive digital training and work management platform developed by **Spatial Collective Limited** for youth employment programs across Nairobi's informal settlements. The platform enables hundreds of youth to learn geospatial data collection skills and track their work output.

### 🏘️ Settlements Served

- **Kayole Soweto** - Primary settlement with digitization and mobile mapping
- **Mji wa Huruma** - Digitization and mobile mapping programs
- **Kariobangi Machakos** - Digitization and mobile mapping programs

---

## ✨ Core Features

### Training Modules
| Module | Description | Participants |
|--------|-------------|--------------|
| **Digitization** | Remote building mapping using JOSM/iD editor on satellite imagery | ~50+ |
| **Mobile Mapping** | Field data collection using ODK Collect on smartphones | ~150+ |
| **Household Survey** | Door-to-door survey data collection | Planned |
| **Microtasking** | Small data validation and verification tasks | Planned |

### Youth Features
- **Sequential Training** - Step-by-step training modules with progress tracking
- **QR Code Access** - ODK Collect configuration via personalized QR codes
- **Contract Signing** - Digital contract signing with signature capture
- **Work Dashboard** - Real-time view of buildings mapped and work days
- **Email Access** - Integrated work email via platform proxy

### Staff Features
- **Attendance Management** - Digital attendance submission by trainers
- **Youth Management** - Add, edit, and manage youth profiles
- **Performance Tracking** - View work statistics across settlements
- **Admin Dashboard** - System-wide management and reporting

### External Integrations
- **ODK Central** - Mobile data collection server (`collector.kesmis.go.ke`)
- **Private OSM Server** - Building counting via Overpass API (`osm.spatialcollective.co.ke`)
- **DPW Manager API** - Data sync with `app.spatialcollective.com`
- **Email Service** - Work email delivery via Spatial Collective email API

---

## 👥 User Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| **Youth** | Training, contracts, work dashboard | Program participants |
| **Trainer** | Attendance, youth management | Field supervisors (12 active) |
| **Staff** | Reports, basic admin | Office team members |
| **Admin** | Full platform access | System administrators |
| **Superadmin** | All + staff management | Platform owners |

---

## 📊 Platform Statistics

**Last Updated:** January 2026

- **Total Youth**: 200+ active participants
- **Mobile Mappers**: 156 (ODK configured: 153)
- **Digitizers**: ~50 across 3 settlements
- **Work Days Logged**: 600+
- **Buildings Mapped**: 47,000+

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Developer Onboarding](docs/DEVELOPER_ONBOARDING.md) | Setup guide for new contributors |
| [Platform Documentation](docs/PLATFORM_DOCUMENTATION.md) | Complete technical guide |
| [API Documentation](docs/api/) | External API integrations |
| [Feature Docs](docs/features/) | Individual feature documentation |
| [Scripts Guide](scripts/README.md) | Utility scripts reference |

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

# Staff Credentials - Spatial Collective Learning Platform

## Latest Update (Dec 8, 2025 - Evening)
**Critical Fix Deployed** - Commit: 6541fbc
- **Issue**: `/api/admin/youth` returning 500 errors, preventing admin dashboard from loading youth data
- **Root Cause**: Routes importing `pool` directly (null) instead of using `Database` class
- **Solution**: Replaced all direct pool imports with `Database.query()` for proper connection initialization
- **Fixed Routes**:
  - `/api/admin/youth` - Youth participants list
  - `/api/admin/contracts/print` - Print contracts  
  - `/api/admin/contracts/view/[contractId]` - View individual contracts
- **Status**: ✅ Build successful, deployed to production

---

## Staff ID Format
**Format:** `S[Type]EA[EmployeeCode][Role]`

### Type Codes:
- **T** = Technical
- **F** = Field
- **M** = Management

### Role Codes:
- **SA** = Super Admin
- **T** = Trainer
- **A** = Admin

---

## Active Staff Members

### 1. Super Admin
**Staff ID:** `STEA8103SA`
**Name:** Technical Team
**Email:** tech@spatialcollective.com
**Role:** Super Admin
**Dashboard:** /dashboard/staff
**Access:** Full system access, all modules, admin functions

### 2. Admin
**Staff ID:** `SMEA4441A`
**Name:** Alex Okumu
**Email:** alex.okumu@spatialcollective.com
**Employee Code:** 4441
**Role:** Admin
**Dashboard:** /dashboard/admin
**Access:** Staff management, youth overview, analytics, system settings

### 3. Trainers

#### Juma Charles
**Staff ID:** `SFEA0119T`
**Name:** Juma Charles
**Email:** juma.charles@spatialcollective.com
**Employee Code:** 0119
**Role:** Trainer
**Dashboard:** /dashboard/trainer
**Access:** Training management, youth progress, review submissions

#### Francis Wambua
**Staff ID:** `SFEA4333T`
**Name:** Francis Wambua
**Email:** francis.wambua@spatialcollective.com
**Employee Code:** 4333
**Role:** Trainer
**Dashboard:** /dashboard/trainer
**Access:** Training management, youth progress, review submissions

#### Purent Oduor
**Staff ID:** `SFEA4808T`
**Name:** Purent Oduor
**Email:** purent.oduor@spatialcollective.com
**Employee Code:** 4808
**Role:** Trainer
**Dashboard:** /dashboard/trainer
**Access:** Training management, youth progress, review submissions

---

## Login Instructions

1. Go to: https://learn.spatialcollective.co.ke
2. Click "Staff Login" tab
3. Enter your Staff ID (e.g., `STEA8103SA`)
4. You'll be automatically routed to your role-specific dashboard

---

## Dashboard Routing

| Role | Staff ID Pattern | Dashboard URL | Features |
|------|-----------------|---------------|----------|
| Super Admin | STEA####SA | /dashboard/staff | All modules, full system access |
| Admin | SMEA####A | /dashboard/admin | Staff management, analytics, settings |
| Trainer | SFEA####T | /dashboard/trainer | Youth progress, training materials |

---

## Database Status

✅ All 5 staff members seeded in production database
✅ Old SC### format entries removed
✅ All staff created by STEA8103SA
✅ All accounts active and ready for login

---

## Changes Made

1. **Staff ID Format:** Updated from `SC###` to `S[Type]EA[Code][Role]`
2. **Validation Regex:** `/^S[TFM]EA\d{4}(SA|T|A)$/i`
3. **Role-Based Routing:** Automatic redirect based on staff role
4. **Trainer Dashboard:** New dedicated dashboard for trainers
5. **Access Control:** Super Admin portal now restricted to superadmin only
6. **Database:** Cleaned up old entries, seeded new staff members

---

## Testing

To test login:
```
Super Admin: STEA8103SA → /dashboard/staff
Admin: SMEA4441A → /dashboard/admin
Trainer: SFEA0119T → /dashboard/trainer
Trainer: SFEA4333T → /dashboard/trainer
Trainer: SFEA4808T → /dashboard/trainer
```

All dashboards are live and functional!

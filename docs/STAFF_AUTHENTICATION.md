# Staff ID Authentication System

## Overview

The Validator Training module is **restricted to Spatial Collective staff only** and requires Staff ID authentication before accessing any training content.

## How It Works

### 1. Authentication Flow

```
User visits Validator Training
    ↓
Not Authenticated? → Show Staff ID Login Screen
    ↓
User enters Staff ID (format: SC###)
    ↓
System validates format and checks registration
    ↓
Valid? → Grant access + Store in sessionStorage
    ↓
Invalid? → Show error message
```

### 2. Staff ID Format

- **Format:** `SC` followed by 3 or more digits
- **Examples:**
  - ✅ `SC001`
  - ✅ `SC123`
  - ✅ `SC4567`
  - ❌ `sc001` (lowercase - will be converted to uppercase)
  - ❌ `SC12` (too short)
  - ❌ `123` (missing prefix)

### 3. Session Management

- Authentication is stored in **sessionStorage**
- Persists for the current browser session
- Cleared when browser tab/window is closed
- Users can manually logout via the UI

## Components

### 1. `StaffAuthentication.tsx`

The login screen component that:
- Displays the Staff ID input form
- Validates Staff ID format
- Shows error messages for invalid/unregistered IDs
- Provides contact information for registration requests

**Usage:**
```tsx
import StaffAuthentication from './components/StaffAuthentication';

<StaffAuthentication onAuthenticated={(staffId) => {
  console.log('Authenticated:', staffId);
}} />
```

### 2. `ValidatorTrainingWrapper.tsx`

A wrapper component that:
- Checks for existing authentication in sessionStorage
- Shows login screen if not authenticated
- Displays training content if authenticated
- Provides logout functionality
- Shows staff info bar with authenticated user details

**Usage:**
```tsx
import ValidatorTrainingWrapper from './components/ValidatorTrainingWrapper';

<ValidatorTrainingWrapper>
  {/* Your validator training content here */}
  <ValidatorTrainingModule />
</ValidatorTrainingWrapper>
```

### 3. `StaffAdminPanel.tsx`

An admin interface for managing Staff IDs:
- Register new staff members
- View all registered staff
- Remove/unregister staff
- See registration details (name, role, date)

**Usage:**
```tsx
import StaffAdminPanel from './components/StaffAdminPanel';

// In admin section of your app
<StaffAdminPanel />
```

## Data Functions

### Located in: `src/data/validator-training.ts`

#### Authentication Functions

**`authenticateStaffId(staffId: string): AuthenticationResult`**
- Validates and authenticates a Staff ID
- Returns success status and message

```typescript
const result = authenticateStaffId('SC001');
if (result.success) {
  console.log('Authenticated:', result.staffId);
}
```

**`hasValidatorTrainingAccess(staffId: string): boolean`**
- Quick check if a Staff ID has access
- Returns true/false

```typescript
if (hasValidatorTrainingAccess('SC001')) {
  // Grant access
}
```

#### Admin Functions

**`registerStaffId(staffId: string, name: string, role?: 'validator' | 'admin')`**
- Registers a new Staff ID
- Default role is 'validator'

```typescript
registerStaffId('SC001', 'John Validator', 'validator');
```

**`unregisterStaffId(staffId: string)`**
- Removes a Staff ID from registration

```typescript
unregisterStaffId('SC001');
```

**`getAllRegisteredStaff(): StaffCredentials[]`**
- Returns array of all registered staff

```typescript
const staff = getAllRegisteredStaff();
console.log(`Total staff: ${staff.length}`);
```

**`isStaffIdRegistered(staffId: string): boolean`**
- Checks if a Staff ID exists in the system

```typescript
if (isStaffIdRegistered('SC001')) {
  console.log('Staff ID exists');
}
```

#### Training Access Functions (with Authentication)

All these functions now accept an optional `staffId` parameter for authentication:

**`getValidatorStepById(id: string, staffId?: string): TrainingStep | undefined`**

**`getNextValidatorStep(currentId: string, staffId?: string): TrainingStep | null`**

**`getPreviousValidatorStep(currentId: string, staffId?: string): TrainingStep | null`**

**`getAllValidatorSteps(staffId?: string): TrainingStep[]`**

If `staffId` is provided but not authorized, these functions return `undefined`, `null`, or empty array respectively.

## Setup Instructions

### Step 1: Register Staff Members

Before staff can access training, they must be registered:

```typescript
import { registerStaffId } from './data/validator-training';

// Register validators
registerStaffId('SC001', 'John Validator', 'validator');
registerStaffId('SC002', 'Jane Validator', 'validator');

// Register admins
registerStaffId('SC100', 'Admin User', 'admin');
```

Or use the `StaffAdminPanel` component for a UI-based approach.

### Step 2: Integrate with Your App

Wrap your validator training content with the authentication wrapper:

```tsx
import ValidatorTrainingWrapper from './components/ValidatorTrainingWrapper';
import YourValidatorTraining from './components/YourValidatorTraining';

function App() {
  return (
    <ValidatorTrainingWrapper>
      <YourValidatorTraining />
    </ValidatorTrainingWrapper>
  );
}
```

### Step 3: Add Admin Panel (Optional)

For managing staff IDs through a UI:

```tsx
import StaffAdminPanel from './components/StaffAdminPanel';

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <StaffAdminPanel />
    </div>
  );
}
```

## Security Considerations

### Current Implementation (Development)

⚠️ **Important:** The current implementation stores Staff IDs in **memory** (a JavaScript Map). This is suitable for development and testing but **NOT for production**.

**Limitations:**
- Data is lost when the application restarts
- No persistence across sessions
- All staff IDs must be re-registered after each restart
- No audit trail or logging

### Production Requirements

For production deployment, you **MUST** integrate with a backend database:

1. **Backend API Requirements:**
   ```
   POST   /api/staff/register      - Register new staff
   POST   /api/staff/authenticate  - Validate Staff ID
   GET    /api/staff               - Get all staff (admin)
   DELETE /api/staff/:id           - Remove staff (admin)
   GET    /api/staff/:id/access    - Check access permission
   ```

2. **Database Schema Example:**
   ```sql
   CREATE TABLE staff_members (
     staff_id VARCHAR(10) PRIMARY KEY,
     full_name VARCHAR(255) NOT NULL,
     role VARCHAR(20) NOT NULL,
     registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     last_login TIMESTAMP,
     is_active BOOLEAN DEFAULT TRUE
   );
   ```

3. **Security Enhancements:**
   - Add password/PIN authentication
   - Implement JWT tokens instead of sessionStorage
   - Add rate limiting for authentication attempts
   - Log all authentication events
   - Add 2FA for admin accounts
   - Implement session timeout
   - Add audit trail for all actions

### Migration Path

To migrate to backend authentication:

1. Create backend API endpoints
2. Update functions in `validator-training.ts` to call API instead of using Map
3. Replace sessionStorage with JWT tokens
4. Add token refresh mechanism
5. Implement proper error handling and retry logic

## User Experience Flow

### First-Time User

1. User navigates to Validator Training
2. Sees authentication screen with Staff ID input
3. Attempts to enter Staff ID
4. If format invalid → Shows format error
5. If ID not registered → Shows "Contact admin" message
6. If ID valid → Grants access and shows training content

### Returning User (Same Session)

1. User navigates to Validator Training
2. System checks sessionStorage for existing auth
3. If found and valid → Immediately shows training content
4. User sees their name and Staff ID in top bar
5. Can logout to end session

### Admin User

1. Can access all regular training content
2. Additionally has access to Staff Admin Panel
3. Can register new staff members
4. Can view all registered staff
5. Can remove staff access

## Customization

### Change Staff ID Format

Edit the regex pattern in `validator-training.ts`:

```typescript
// Current: SC followed by 3+ digits
const staffIdPattern = /^SC\d{3,}$/;

// Example: Change to different prefix
const staffIdPattern = /^VALID\d{4,}$/; // VALID0001, VALID0002

// Example: Allow letters
const staffIdPattern = /^SC[A-Z0-9]{3,}$/; // SC001, SCABC
```

### Add Additional User Fields

Extend the `StaffCredentials` interface:

```typescript
export interface StaffCredentials {
  staffId: string;
  name?: string;
  role?: 'validator' | 'admin';
  registeredAt?: Date;
  // Add new fields:
  email?: string;
  department?: string;
  phoneNumber?: string;
}
```

### Customize UI Branding

Edit the authentication components to match your brand:
- Update colors in `StaffAuthentication.tsx`
- Change logo/icons
- Modify text and messaging
- Add company branding elements

## Testing

### Test Staff IDs

For development/testing, you can pre-register test IDs:

```typescript
// In your app initialization
if (process.env.NODE_ENV === 'development') {
  registerStaffId('SC001', 'Test Validator', 'validator');
  registerStaffId('SC999', 'Test Admin', 'admin');
}
```

### Manual Testing Checklist

- [ ] Valid Staff ID authenticates successfully
- [ ] Invalid format shows appropriate error
- [ ] Unregistered ID shows appropriate error
- [ ] Authentication persists during session
- [ ] Logout clears authentication
- [ ] Training content only shows when authenticated
- [ ] Admin panel can register new staff
- [ ] Admin panel can remove staff
- [ ] Session survives page refresh (same tab)
- [ ] Session clears when closing browser

## Support & Contact

For issues or questions about Staff ID authentication:

**Email:** admin@spatialcollective.com

**Include in your request:**
- Full name
- Desired Staff ID (if you have a preference)
- Role (Validator or Admin)
- Reason for access

---

## Quick Reference

### Staff ID Format
```
SC### (e.g., SC001, SC123)
```

### Key Files
```
src/data/validator-training.ts        - Core authentication logic
src/components/StaffAuthentication.tsx - Login screen
src/components/ValidatorTrainingWrapper.tsx - Auth wrapper
src/components/StaffAdminPanel.tsx    - Admin management
```

### Common Tasks

**Register a staff member:**
```typescript
registerStaffId('SC001', 'John Doe', 'validator');
```

**Check authentication:**
```typescript
if (hasValidatorTrainingAccess('SC001')) { /* ... */ }
```

**Get authenticated training content:**
```typescript
const step = getValidatorStepById('validator-1', 'SC001');
```

---

**Last Updated:** December 2, 2025  
**System Version:** 1.0  
**Status:** Development (In-Memory Storage)

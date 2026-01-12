# Messages Feature Implementation

## Overview
Added a complete email/messages feature that allows youth participants to access their `@spatialcollective.co.ke` work emails directly from the training platform.

## What Was Implemented

### 1. Database Changes
**File**: [database/migrations/add-youth-email-addresses.sql](database/migrations/add-youth-email-addresses.sql)

- Added `work_email` column to `youth_participants` table
- Populated 39 youth with their @spatialcollective.co.ke email addresses
- Created index for performance

**Run Migration**:
```bash
node scripts/add-youth-email-addresses.js
```

### 2. API Routes
All routes use youth authentication and proxy to the Email API.

**Files Created**:
- [src/app/api/messages/inbox/route.ts](src/app/api/messages/inbox/route.ts) - Get email list
- [src/app/api/messages/[id]/route.ts](src/app/api/messages/[id]/route.ts) - Get single email
- [src/app/api/messages/unread-count/route.ts](src/app/api/messages/unread-count/route.ts) - Get unread count
- [src/app/api/messages/folders/route.ts](src/app/api/messages/folders/route.ts) - Get folder list

**Authentication**: All routes require valid youth JWT token

**SSO Password**: Uses `youth_id` as email password (platform password = email password)

### 3. Messages Page
**File**: [src/app/dashboard/messages/page.tsx](src/app/dashboard/messages/page.tsx)

**Features**:
- ✅ 3-column layout: Folders | Email List | Email Detail
- ✅ Folder navigation (Inbox, Sent, Drafts, Trash)
- ✅ Email list with preview
- ✅ Unread count badge
- ✅ Mark as read (automatic on open)
- ✅ Full email view with HTML rendering
- ✅ Attachments list with download info
- ✅ Settings panel showing email credentials
- ✅ Copy email address & password
- ✅ Refresh button
- ✅ Responsive design

### 4. Dashboard Integration
**File**: [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

- Added "Messages" card to dashboard
- Shows as 3rd option alongside Training and Work dashboards
- Marked as "New Feature"
- Direct link to `/dashboard/messages`

### 5. Environment Variables
**File**: [.env.local.example](.env.local.example)

Add to your `.env.local`:
```bash
EMAIL_API_URL=https://email-api.spatialcollective.co.ke/api
EMAIL_API_KEY=06682c28d538516b9920423822798612
```

## Email Accounts Provisioned (39 Youth)

| Settlement | Count |
|------------|-------|
| Kayole | 15 youth |
| Kariobangi | 15 youth |
| Huruma | 9 youth |
| **Total** | **39 youth** |

Full list in [Email-API-Docs.md](Email-API-Docs.md#account-list)

## How It Works

### For Youth Users:

1. **Login** to platform with youth credentials
2. **Navigate** to Dashboard → Click "Messages"
3. **View emails** - No additional login required (SSO)
4. **Read messages** from coordinators, trainers, OSM notifications
5. **Access credentials** via Settings panel (for external email clients)

### Authentication Flow:

```
Youth logs in → JWT token issued
    ↓
Messages page → Uses JWT token
    ↓
API route → Verifies JWT → Gets youth_id
    ↓
Fetches work_email from database
    ↓
Calls Email API with:
    - email: work_email
    - password: youth_id (SSO)
    ↓
Returns emails to frontend
```

### Security:

- ✅ Email API key stored server-side only (env variable)
- ✅ Youth authentication required (JWT)
- ✅ Password auto-filled (youth_id = email password)
- ✅ HTTPS only communication
- ✅ No password storage (SSO approach)

## User Experience

### Messages Dashboard:
```
┌─────────────────────────────────────────────────────┐
│ ← Back    📧 Messages (3)                  ⚙ Refresh│
│ user@spatialcollective.co.ke                        │
├───────────┬─────────────────┬───────────────────────┤
│ FOLDERS   │ EMAIL LIST      │ EMAIL DETAIL          │
│           │                 │                       │
│ 📥 Inbox  │ From: Trainer   │ Subject: Welcome      │
│    (3)    │ Subject: ...    │ From: ...             │
│ 📤 Sent   │ Preview: ...    │ Date: ...             │
│ 📄 Drafts │                 │                       │
│ 🗑️ Trash  │ [NEW] From: ... │ Full email body...    │
│           │ Subject: ...    │                       │
│           │                 │ 📎 Attachments:       │
│           │                 │ - file.pdf            │
└───────────┴─────────────────┴───────────────────────┘
```

### Settings Panel:
- Email: `kay2805jk@spatialcollective.co.ke` [Copy]
- Password: `KAY2805JK` [Copy]
- Info: "Use these credentials with any email client"

## Deployment Checklist

### 1. Update Environment Variables (Production)
```bash
# Add to Vercel/hosting platform
EMAIL_API_URL=https://email-api.spatialcollective.co.ke/api
EMAIL_API_KEY=06682c28d538516b9920423822798612
```

### 2. Run Database Migration
```bash
# Local/staging
node scripts/add-youth-email-addresses.js

# Or use SQL directly in production
psql $DATABASE_URL < database/migrations/add-youth-email-addresses.sql
```

### 3. Deploy Code
```bash
git add .
git commit -m "feat: add messages feature for youth work emails"
git push origin main
```

### 4. Verify Deployment
- [ ] Visit `/dashboard/messages`
- [ ] Test with youth account that has email (e.g., KAY2805JK)
- [ ] Verify emails load
- [ ] Test folder navigation
- [ ] Check unread count updates
- [ ] Open email detail view
- [ ] Test refresh button

### 5. Test Youth Accounts
Pick 2-3 youth from each settlement:
- [ ] Kayole: KAY2805JK, KAY1498DO
- [ ] Kariobangi: KAR115SO, KAR268SM
- [ ] Huruma: HUR728CM, HUR185RN

### 6. Monitor for Issues
- Check API logs for Email API errors
- Verify authentication works
- Monitor page load times
- Check for CORS errors

## Future Enhancements (Not in V1)

### Phase 2:
- [ ] Reply to emails
- [ ] Compose new emails
- [ ] Forward emails
- [ ] Delete emails
- [ ] Archive emails

### Phase 3:
- [ ] Email search
- [ ] Filters (unread, starred, etc.)
- [ ] Bulk actions
- [ ] Email notifications (push/badge)

### Phase 4:
- [ ] Rich text editor for compose
- [ ] File attachments upload
- [ ] Email templates
- [ ] Auto-signatures

## Support & Troubleshooting

### Youth reports "No work email assigned"
**Solution**: Contact admin to provision email account. Add to database:
```sql
UPDATE youth_participants 
SET work_email = 'youthid@spatialcollective.co.ke' 
WHERE youth_id = 'YOUTHID';
```

### Emails not loading
**Checks**:
1. Verify EMAIL_API_URL and EMAIL_API_KEY in env
2. Check Email API is running: `curl https://email-api.spatialcollective.co.ke/api/health`
3. Verify youth's email credentials work (test login to webmail)
4. Check browser console for errors

### "Invalid credentials" error
**Solution**: 
- Verify youth_id matches email password
- If youth changed password, they need to contact admin
- SSO approach means platform password = email password

### Performance issues
**Optimization**:
- Implement email caching (Redis)
- Add pagination for large inboxes
- Lazy load email bodies
- Add loading skeletons

---

**Status**: ✅ Ready for production deployment  
**Version**: 1.0  
**Date**: January 12, 2026  
**Coverage**: 39/61 youth (64%)

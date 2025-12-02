# Complete Setup Guide - Youth Contract System

## 🎯 Overview

This system allows youth participants to:
1. Authenticate with their Youth ID
2. Read and sign their program contract digitally
3. Access training materials only after signing

## 📦 Installation

### Step 1: Install Dependencies

#### Frontend (Next.js)
```powershell
# In the root directory
npm install
```

This installs:
- `axios` - HTTP client for API calls
- `react-signature-canvas` - Digital signature capture

#### Backend (API)
```powershell
# In the api directory
cd api
npm install
```

This installs all backend dependencies including:
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `pdfkit` - PDF generation
- And more...

### Step 2: Database Setup

1. **Create PostgreSQL Database** (if not already exists)

2. **Update .env.local** with your remote database credentials:
```env
DATABASE_URL=postgresql://user:password@host:port/database_name
```

3. **Run Database Schema**

```powershell
# Option 1: Using psql command line
psql $env:DATABASE_URL -f api/database/schema.sql

# Option 2: Using pgAdmin or similar tool
# Copy/paste content from api/database/schema.sql and execute
```

This creates:
- All required tables
- Test staff (SC001, SC002)
- Test youth (YT001, YT002)
- Digitization contract template

### Step 3: Configure Environment Variables

#### Create api/.env
```powershell
cd api
cp ../.env.example .env
```

Edit `api/.env`:
```env
# Use your remote database URL from .env.local
DATABASE_URL=postgresql://user:password@host:port/database_name

# Generate a secure JWT secret (32+ characters)
JWT_SECRET=your-very-secure-random-string-min-32-chars

# API Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
CORS_ORIGIN=http://localhost:3000
```

### Step 4: Start the Servers

#### Terminal 1: Start Backend API
```powershell
cd api
npm run dev
```

You should see:
```
🚀 Spatial Collective API Server Started
Port:        3001
✅ Database connected successfully
```

#### Terminal 2: Start Frontend
```powershell
# In root directory
npm run dev
```

Access at `http://localhost:3000`

## 🧪 Testing the System

### Test Youth IDs (from seed data):
- **YT001** - Alice Digitizer (digitization program)
- **YT002** - Bob Mapper (digitization program)

### Test Staff IDs (from seed data):
- **SC001** - John Admin (admin role)
- **SC002** - Jane Validator (validator role)

### Testing Flow:

1. **Youth Authentication**
   - Visit youth contract page
   - Enter `YT001`
   - Click "Continue to Contract"

2. **Contract Signing**
   - Read contract agreement
   - Sign in the signature pad
   - Check agreement checkbox
   - Click "Sign Contract Agreement"

3. **Access Training**
   - After signing, youth can access training materials
   - System checks if contract is signed before showing content

## 🔧 API Endpoints Quick Reference

### Health Check
```http
GET http://localhost:3001/health
```

### Youth Authentication
```http
POST http://localhost:3001/api/youth/auth/authenticate
Content-Type: application/json

{
  "youthId": "YT001"
}
```

### Get Contract Template
```http
GET http://localhost:3001/api/contracts/template
Authorization: Bearer {token}
```

### Sign Contract
```http
POST http://localhost:3001/api/contracts/sign
Authorization: Bearer {token}
Content-Type: application/json

{
  "templateId": "uuid-from-template",
  "signatureData": "data:image/png;base64,..."
}
```

### Get Signed Contract
```http
GET http://localhost:3001/api/contracts/signed
Authorization: Bearer {token}
```

## 📊 Adding More Youth/Staff

### Via SQL (Recommended for bulk)
```sql
-- Add new youth
INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type)
VALUES 
  ('YT003', 'John Doe', 'john@example.com', '+254700000003', 'digitization'),
  ('YT004', 'Jane Smith', 'jane@example.com', '+254700000004', 'mobile_mapping');

-- Add new staff
INSERT INTO staff_members (staff_id, full_name, email, role)
VALUES 
  ('SC003', 'New Validator', 'validator@example.com', 'validator'),
  ('SC004', 'Admin User', 'admin@example.com', 'admin');
```

### Via API (Admin only for staff)
```http
POST http://localhost:3001/api/staff/auth/register
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "staffId": "SC005",
  "fullName": "Another Validator",
  "email": "another@example.com",
  "role": "validator"
}
```

## 🏗️ Architecture

```
┌─────────────────┐
│  Youth Device   │
│  (Web Browser)  │
└────────┬────────┘
         │
         │ 1. Enter Youth ID
         │
         ▼
┌─────────────────────────┐
│   Frontend (Next.js)    │
│  - YouthAuthentication  │
│  - ContractSigning      │
└────────┬────────────────┘
         │
         │ 2. API Calls (JWT)
         │
         ▼
┌─────────────────────────┐
│   Backend API (Express) │
│  - Authentication       │
│  - Contract Management  │
│  - PDF Generation       │
└────────┬────────────────┘
         │
         │ 3. Database Queries
         │
         ▼
┌─────────────────────────┐
│  PostgreSQL Database    │
│  - youth_participants   │
│  - signed_contracts     │
│  - contract_templates   │
│  - auth_logs            │
└─────────────────────────┘
```

## 🔐 Security Flow

1. **Youth enters Youth ID** → Validated against database
2. **JWT token generated** → 24-hour expiration
3. **Token stored** → localStorage on frontend
4. **All API calls** → Include Bearer token in header
5. **Signature captured** → Base64 encoded image
6. **Contract signed** → Immutable database record + PDF
7. **Access granted** → Only after valid contract signature

## 📁 File Locations

### Frontend Components
- `src/components/YouthAuthentication.tsx` - Login screen
- `src/components/ContractSigning.tsx` - Contract signing interface
- `src/components/StaffAuthentication.tsx` - Staff login (validators)

### Backend API
- `api/src/server.ts` - Main server file
- `api/src/controllers/` - Business logic
- `api/src/models/` - Database queries
- `api/src/routes/` - API endpoints
- `api/database/schema.sql` - Database schema

### Configuration
- `.env.local` - Root environment (database URL)
- `api/.env` - API environment (JWT secret, port, etc.)

## 🚀 Deployment Checklist

### Backend Deployment
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Configure DATABASE_URL for production
- [ ] Set up SSL/TLS
- [ ] Configure reverse proxy (nginx)
- [ ] Set up process manager (PM2)
- [ ] Enable CORS for production domain
- [ ] Set up database backups

### Frontend Deployment
- [ ] Update NEXT_PUBLIC_API_URL to production API
- [ ] Build for production (`npm run build`)
- [ ] Deploy to hosting service
- [ ] Configure environment variables

## 🆘 Common Issues

### "Database connection failed"
- ✅ Check DATABASE_URL is correct
- ✅ Verify database is running
- ✅ Check firewall allows connection
- ✅ Verify database credentials

### "Invalid or expired token"
- ✅ Token expires after 24 hours (login again)
- ✅ Check JWT_SECRET is set in api/.env
- ✅ Clear localStorage and re-authenticate

### "Youth ID not recognized"
- ✅ Verify youth exists in database
- ✅ Check ID format (YT### uppercase)
- ✅ Run database seed script

### "Contract template not found"
- ✅ Check contract_templates table has entry
- ✅ Verify program_type matches youth's program
- ✅ Check is_active = TRUE

### CORS errors
- ✅ Update CORS_ORIGIN in api/.env
- ✅ Frontend must match allowed origin
- ✅ Restart API server after changes

## 📞 Support

For issues or questions:
- Check `api/README.md` for API documentation
- Review database schema in `api/database/schema.sql`
- Check server logs for error messages

---

**System Version:** 1.0.0  
**Last Updated:** December 2, 2025  
**Status:** Production Ready

# Youth Contract System - Backend API

Complete backend API with database integration for Youth Training Program contract management.

## 🚀 Features

- **Youth Authentication** - YouthID-based login system
- **Staff Authentication** - StaffID-based validator access
- **Digital Contract Signing** - Electronic signature capture and PDF generation
- **Contract Management** - Template management and signed contract storage
- **Audit Logging** - Track all authentication attempts and contract signings
- **JWT Authentication** - Secure token-based API access
- **PostgreSQL Database** - Production-ready data storage
- **Rate Limiting** - Protection against abuse
- **RESTful API** - Clean, documented endpoints

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 12.x or higher
- **npm** or **yarn**

## 🛠️ Installation

### 1. Navigate to API directory
```powershell
cd api
```

### 2. Install dependencies
```powershell
npm install
```

### 3. Set up environment variables

Copy `.env.example` from the root to `api/.env` and configure:

```env
# Database Configuration (Use your remote database from .env.local)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (Generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# API Configuration
PORT=3001
NODE_ENV=development

# CORS (Your frontend URL)
CORS_ORIGIN=http://localhost:3000
```

### 4. Initialize Database

Run the schema file against your PostgreSQL database:

```powershell
# Using psql command line
psql -h your-host -U your-user -d your-database -f database/schema.sql

# Or using pgAdmin (copy/paste schema.sql content and execute)
```

This will:
- Create all necessary tables
- Set up indexes for performance
- Create views for common queries
- Insert test data (2 staff, 2 youth, 1 contract template)

### 5. Start the development server

```powershell
npm run dev
```

The API will start on `http://localhost:3001`

## 📊 Database Schema

### Tables

1. **staff_members** - Staff authentication and management
2. **youth_participants** - Youth participants registry
3. **contract_templates** - Contract templates per program type
4. **signed_contracts** - Digitally signed contracts with signatures
5. **auth_logs** - Authentication audit trail

### Test Data

**Staff IDs:**
- `SC001` - John Admin (admin role)
- `SC002` - Jane Validator (validator role)

**Youth IDs:**
- `YT001` - Alice Digitizer (digitization program)
- `YT002` - Bob Mapper (digitization program)

## 🔌 API Endpoints

### Youth Authentication

```http
POST /api/youth/auth/authenticate
Content-Type: application/json

{
  "youthId": "YT001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "jwt-token-here",
    "youth": {
      "youthId": "YT001",
      "fullName": "Alice Digitizer",
      "programType": "digitization",
      "hasSignedContract": false
    }
  }
}
```

### Staff Authentication

```http
POST /api/staff/auth/authenticate
Content-Type: application/json

{
  "staffId": "SC001"
}
```

### Get Contract Template

```http
GET /api/contracts/template
Authorization: Bearer {youth-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templateId": "uuid",
    "programType": "digitization",
    "title": "Digitization Youth Contract Agreement",
    "version": "v1.0",
    "content": "Contract text with placeholders replaced..."
  }
}
```

### Sign Contract

```http
POST /api/contracts/sign
Authorization: Bearer {youth-token}
Content-Type: application/json

{
  "templateId": "uuid",
  "signatureData": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract signed successfully",
  "data": {
    "contractId": "uuid",
    "signedAt": "2025-12-02T10:30:00Z",
    "pdfUrl": "/uploads/contracts/contract_YT001_timestamp.pdf"
  }
}
```

### Get Signed Contract

```http
GET /api/contracts/signed
Authorization: Bearer {youth-token}
```

### Admin: Get All Signed Contracts

```http
GET /api/contracts/all
Authorization: Bearer {staff-admin-token}
```

### Admin: Get Contract Statistics

```http
GET /api/contracts/statistics
Authorization: Bearer {staff-admin-token}
```

### Admin: Register New Staff

```http
POST /api/staff/auth/register
Authorization: Bearer {staff-admin-token}
Content-Type: application/json

{
  "staffId": "SC003",
  "fullName": "New Validator",
  "email": "new@example.com",
  "role": "validator"
}
```

## 🔐 Security Features

- **JWT Tokens** - Expire after 24 hours
- **Rate Limiting** - 100 requests per 15 minutes (general), 10 per 15 minutes (auth)
- **Helmet.js** - Security headers
- **Input Validation** - ID format validation
- **Audit Logging** - All auth attempts logged
- **CORS Protection** - Configured origin restrictions

## 📁 Project Structure

```
api/
├── database/
│   └── schema.sql          # Database schema and seed data
├── src/
│   ├── config/
│   │   └── database.ts     # Database connection
│   ├── controllers/
│   │   ├── YouthAuthController.ts
│   │   ├── StaffAuthController.ts
│   │   └── ContractController.ts
│   ├── models/
│   │   ├── YouthModel.ts
│   │   ├── StaffModel.ts
│   │   ├── ContractModel.ts
│   │   └── AuthLogModel.ts
│   ├── middleware/
│   │   └── auth.ts         # JWT authentication middleware
│   ├── routes/
│   │   ├── youthAuth.ts
│   │   ├── staffAuth.ts
│   │   └── contracts.ts
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   └── server.ts           # Express server setup
├── uploads/
│   └── contracts/          # Signed contract PDFs
├── package.json
├── tsconfig.json
└── .env
```

## 🧪 Testing the API

### 1. Test health endpoint
```powershell
curl http://localhost:3001/health
```

### 2. Test youth authentication
```powershell
curl -X POST http://localhost:3001/api/youth/auth/authenticate `
  -H "Content-Type: application/json" `
  -d '{"youthId":"YT001"}'
```

### 3. Test contract template (requires token)
```powershell
curl http://localhost:3001/api/contracts/template `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔄 Development Workflow

### Run in development mode (with auto-reload)
```powershell
npm run dev
```

### Build for production
```powershell
npm run build
```

### Run production build
```powershell
npm start
```

## 📝 Adding New Youth/Staff

### Via Database
```sql
-- Add new youth
INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type)
VALUES ('YT003', 'New Youth Name', 'email@example.com', '+254700000003', 'digitization');

-- Add new staff
INSERT INTO staff_members (staff_id, full_name, email, role)
VALUES ('SC003', 'New Staff Name', 'staff@example.com', 'validator');
```

### Via API (Admin only for staff)
Use the `/api/staff/auth/register` endpoint with admin token.

## 🚨 Troubleshooting

### Database connection fails
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Test connection: `psql -h host -U user -d database`

### JWT token invalid
- Check JWT_SECRET is set in `.env`
- Ensure token is passed as `Bearer {token}`
- Token expires after 24h (configurable in JWT_EXPIRE)

### CORS errors
- Update CORS_ORIGIN in `.env` to match your frontend URL
- Check if frontend is making requests with credentials

### File upload errors
- Ensure `uploads/contracts/` directory exists and is writable
- Check MAX_FILE_SIZE setting in `.env`

## 📚 Next Steps

1. **Production Deployment**
   - Use environment variables for all secrets
   - Set NODE_ENV=production
   - Use process manager (PM2, systemd)
   - Set up reverse proxy (nginx)
   - Enable SSL/TLS

2. **Add More Program Types**
   - Create contract templates for mobile_mapping, household_survey, microtasking
   - Insert into contract_templates table

3. **Email Notifications**
   - Send contract confirmation emails
   - Send contract PDFs via email

4. **Admin Dashboard**
   - Build admin UI for managing youth/staff
   - View contract statistics
   - Download signed contracts

---

**Version:** 1.0.0  
**Last Updated:** December 2, 2025  
**Status:** Production Ready

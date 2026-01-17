# DATABASE SYNC ANALYSIS - Spatial Collective Learning Platform
Generated: 2025-12-05 14:03:11

## CRITICAL ISSUES FOUND:

### 1. MISSING API ENDPOINTS 
Frontend expects these endpoints that DON'T EXIST:
- GET /api/contracts/template (called by ContractSigning.tsx)
- POST /api/contracts/sign (called by ContractSigning.tsx)

Only existing endpoints:
- POST /api/youth/auth/authenticate 
- POST /api/staff/auth/authenticate   
- GET /api/health 

### 2. STAFF AUTHENTICATION MISMATCH 
StaffAuthentication.tsx uses local mock data (validator-training.ts)
- Does NOT call /api/staff/auth/authenticate
- Stores data in sessionStorage instead of using JWT tokens
- No database integration for staff auth in frontend

### 3. DATABASE SCHEMA vs FRONTEND DATA STRUCTURES

#### Youth Authentication -  ALIGNED
Database (youth_participants):
- youth_id, full_name, email, phone_number, program_type
- is_active, created_at, updated_at, last_login

Frontend expects (YouthAuthentication.tsx):
- youthId, fullName, programType, hasSignedContract

API Returns:
- youthId, fullName, email, phone, programType, hasSignedContract 

#### Signed Contracts -  PARTIALLY ALIGNED
Database (signed_contracts):
- contract_id, youth_id, template_id, signature_data
- ip_address, user_agent, signed_at, pdf_url
- is_valid, invalidated_at, invalidated_by

Frontend expects (ContractSigning.tsx):
- templateId (needs conversion from template_id)
- signatureData (needs conversion from signature_data)

Missing fields in types:
- invalidation_reason (in types.ts but NOT in schema) 

#### Contract Templates -  NEEDS ENDPOINTS
Database (contract_templates):
- template_id, program_type, version, title, content
- pdf_url, is_active, created_by

Frontend needs:
- GET /api/contracts/template?programType=xxx  MISSING
- Should filter by program_type and is_active=true

#### Auth Logs -  ALIGNED
Database (auth_logs):
- log_id, user_id, user_type, action, success
- ip_address, user_agent, error_message, created_at

Backend types match schema 

## MISSING DATABASE COLUMNS:
1. signed_contracts.invalidation_reason (defined in types but not in schema)

## REQUIRED FIXES:

### Priority 1 - CRITICAL (Breaks Contract Signing):
1. Create /api/contracts/template/route.ts
   - GET handler to fetch contract template by program_type
   - Return: { templateId, title, content, version }

2. Create /api/contracts/sign/route.ts
   - POST handler to save signed contract
   - Input: { templateId, signatureData }
   - Save to signed_contracts table

### Priority 2 - HIGH (Staff Auth Not Using Database):
1. Update StaffAuthentication.tsx to use API endpoint
   - Replace mock authenticateStaffId() with axios.post()
   - Use /api/staff/auth/authenticate
   - Store JWT token instead of sessionStorage

### Priority 3 - MEDIUM (Data Consistency):
1. Add invalidation_reason column to signed_contracts table
   OR remove from types.ts

### Priority 4 - LOW (Production Deployment):
1. Fix Vercel environment variables
2. Investigate why API routes return 404 on production

## SUMMARY:
 Youth authentication: WORKING
 Contract signing: BROKEN (missing endpoints)
 Staff authentication: NOT USING DATABASE
 Types vs Schema: Minor mismatch (invalidation_reason)

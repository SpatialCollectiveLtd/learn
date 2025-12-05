# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project at:
https://vercel.com/spatialcollectiveltd/learn/settings/environment-variables

### Database Configuration (CRITICAL)

```
DATABASE_URL=postgresql://neondb_owner:npg_WNkBjwzE46sS@ep-dawn-resonance-ad1t4i7z-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_URL=postgresql://neondb_owner:npg_WNkBjwzE46sS@ep-dawn-resonance-ad1t4i7z-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

POSTGRES_USER=neondb_owner

POSTGRES_HOST=ep-dawn-resonance-ad1t4i7z-pooler.c-2.us-east-1.aws.neon.tech

POSTGRES_PASSWORD=npg_WNkBjwzE46sS

POSTGRES_DATABASE=neondb
```

### JWT Authentication (CRITICAL)

```
JWT_SECRET=sc-learning-platform-super-secret-jwt-key-2025-change-in-production

JWT_EXPIRES_IN=24h
```

### Application URLs

```
NEXT_PUBLIC_APP_URL=https://learn.spatialcollective.co.ke

NEXT_PUBLIC_API_URL=https://learn.spatialcollective.co.ke

NEXT_PUBLIC_DOMAIN=spatialcollective.co.ke
```

## Setup Steps

1. Go to https://vercel.com/spatialcollectiveltd/learn/settings/environment-variables

2. For each variable above:
   - Click "Add New"
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Paste the value
   - Select "Production, Preview, and Development" (or at least Production)
   - Click "Save"

3. After adding all variables, redeploy:
   - Go to https://vercel.com/spatialcollectiveltd/learn/deployments
   - Click the ⋯ menu on the latest deployment
   - Click "Redeploy"

## Verification

After redeployment, test:

```powershell
# Test health endpoint
curl https://learn.spatialcollective.co.ke/api/health

# Test version endpoint
curl https://learn.spatialcollective.co.ke/api/version

# Test authentication (should return error about missing youthId, not 500)
curl -Method POST `
  -Uri "https://learn.spatialcollective.co.ke/api/youth/auth/authenticate" `
  -ContentType "application/json" `
  -Body '{"youthId":"YT001"}'
```

## Current Status

✅ API routes deployed successfully (8 routes visible in build)
✅ .vercelignore fixed to preserve src/app/api/_lib/
❌ Environment variables missing (causing 500 errors)

Once environment variables are added, all endpoints should return proper responses instead of 500 errors.

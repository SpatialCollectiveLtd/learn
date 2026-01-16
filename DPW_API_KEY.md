# DPW Manager API Key

**CONFIDENTIAL - DO NOT COMMIT TO GIT**

## API Key for DPW Manager Integration

Generated: January 16, 2026

```
806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3
```

## Setup Instructions

### 1. Add to Learning Platform (Vercel)
Go to: https://vercel.com/spatialcollectiveltd/learn/settings/environment-variables

Add:
- **Name:** `DPW_MANAGER_API_KEY`
- **Value:** `806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3`
- **Environments:** Production, Preview, Development

### 2. Add to DPW Manager (app.spatialcollective.com)
In your DPW Manager environment variables, add:
- **Name:** `LEARNING_PLATFORM_API_KEY`
- **Value:** `806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3`

### 3. Test the API
```bash
curl -H "X-API-Key: 806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3" \
  https://learn.spatialcollective.co.ke/api/external/dpw-sync
```

## Security Notes
- Keep this key secret
- Do not share publicly
- Rotate if compromised
- Store securely in environment variables only

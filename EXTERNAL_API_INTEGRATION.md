# External API Integration Guide
## OSM Username Mappings Endpoint

### Overview
This endpoint provides youth participant OSM username mappings for registration in the central application (app.spatialcollective.com).

---

### Endpoint Details

**URL:** `https://learn.spatialcollective.co.ke/api/external/osm-mappings`

**Method:** `GET`

**CORS:** Restricted to `https://app.spatialcollective.com` only

**Authentication:** None (CORS origin validation)

---

### Request

#### Headers
```
Origin: https://app.spatialcollective.com
```

#### Example Request (JavaScript Fetch)
```javascript
fetch('https://learn.spatialcollective.co.ke/api/external/osm-mappings', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log(`Found ${data.count} youth with OSM usernames`);
    console.log(data.data); // Array of youth mappings
  })
  .catch(error => console.error('Error:', error));
```

#### Example Request (cURL)
```bash
curl -H "Origin: https://app.spatialcollective.com" \
     https://learn.spatialcollective.co.ke/api/external/osm-mappings
```

#### Example Request (Axios)
```javascript
import axios from 'axios';

const response = await axios.get(
  'https://learn.spatialcollective.co.ke/api/external/osm-mappings',
  {
    headers: {
      'Origin': 'https://app.spatialcollective.com'
    }
  }
);

console.log(response.data);
```

---

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "youth_id": "KAYTEST001ES",
      "full_name": "Test Youth Kayole",
      "osm_username": "jhhgbhhj",
      "email": "test@example.com",
      "created_at": "2025-12-08T14:21:47.804Z",
      "last_login": "2025-12-10T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-12-10T12:00:00.000Z"
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `count` | number | Total number of youth with OSM usernames |
| `data` | array | Array of youth participant objects |
| `timestamp` | string | ISO 8601 timestamp of the response |

#### Youth Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `youth_id` | string | **Unique ID** - Primary identifier for the youth (e.g., "KAYTEST001ES") |
| `full_name` | string | Full name of the youth participant |
| `osm_username` | string | OpenStreetMap username submitted by youth |
| `email` | string | Email address of the youth |
| `created_at` | string | ISO 8601 timestamp of account creation |
| `last_login` | string | ISO 8601 timestamp of last login (nullable) |

---

### Error Responses

#### 403 Forbidden (Invalid Origin)
```json
{
  "error": "Unauthorized origin"
}
```

**Cause:** Request not from `https://app.spatialcollective.com`

**Solution:** Ensure requests originate from the allowed domain

---

#### 500 Internal Server Error
```json
{
  "error": "Failed to fetch OSM mappings"
}
```

**Cause:** Database connection error or query failure

**Solution:** Contact technical support or retry after a moment

---

### CORS Preflight

The endpoint supports CORS preflight requests:

**Method:** `OPTIONS`

**Response Headers:**
```
Access-Control-Allow-Origin: https://app.spatialcollective.com
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

---

### Data Notes

1. **Only Submitted Usernames:** The endpoint only returns youth who have submitted OSM usernames (`WHERE osm_username IS NOT NULL`)

2. **Real-time Data:** No caching - always returns current database state

3. **Current Data:** As of deployment, 1 youth has submitted their OSM username (KAYTEST001ES → "jhhgbhhj")

4. **Expected Growth:** 19+ more youth will submit usernames as training progresses

5. **Ordering:** Results ordered by `created_at DESC` (newest first)

---

### Integration Steps

#### Step 1: Deploy to Production
The endpoint is ready and will be available after deployment:
```bash
git add .
git commit -m "feat: Add external API for OSM username mappings"
git push origin main
```

Vercel will auto-deploy to: `https://learn.spatialcollective.co.ke`

---

#### Step 2: Test the Endpoint

**Test from Browser Console (on app.spatialcollective.com):**
```javascript
fetch('https://learn.spatialcollective.co.ke/api/external/osm-mappings')
  .then(r => r.json())
  .then(d => console.table(d.data))
```

**Test CORS from Command Line:**
```bash
curl -i -H "Origin: https://app.spatialcollective.com" \
     https://learn.spatialcollective.co.ke/api/external/osm-mappings
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://app.spatialcollective.com
```

---

#### Step 3: Integrate into Central Application

**Example Integration:**

```javascript
// services/youthRegistration.js

const OSM_API_URL = 'https://learn.spatialcollective.co.ke/api/external/osm-mappings';

export async function fetchYouthOSMUsernames() {
  try {
    const response = await fetch(OSM_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`Fetched ${result.count} youth OSM mappings`);
      return result.data;
    } else {
      throw new Error('Failed to fetch OSM mappings');
    }
  } catch (error) {
    console.error('Error fetching OSM mappings:', error);
    throw error;
  }
}

// Usage
const youthMappings = await fetchYouthOSMUsernames();

// Process for registration
youthMappings.forEach(youth => {
  console.log(`Register ${youth.full_name} (ID: ${youth.youth_id}) with OSM username: ${youth.osm_username}`);
  // Your registration logic here
});
```

---

#### Step 4: Handle Updates

**Polling Strategy (Recommended):**
```javascript
// Poll every 5 minutes for new submissions
setInterval(async () => {
  const mappings = await fetchYouthOSMUsernames();
  updateLocalRegistry(mappings);
}, 5 * 60 * 1000);
```

**One-time Fetch:**
```javascript
// Fetch once when needed
const mappings = await fetchYouthOSMUsernames();
processRegistrations(mappings);
```

---

### Security Considerations

1. **CORS Protection:** Only `app.spatialcollective.com` can access this endpoint

2. **No Authentication Required:** CORS origin validation is the security mechanism

3. **Public Data:** OSM usernames are intentionally public (required for mapping work)

4. **Rate Limiting:** None currently - implement if needed based on usage patterns

5. **HTTPS Only:** All requests must use HTTPS protocol

---

### Support

**Technical Issues:**
- Check browser console for CORS errors
- Verify origin is exactly `https://app.spatialcollective.com` (no trailing slash)
- Ensure HTTPS is used (not HTTP)

**Data Questions:**
- Youth must complete Mapper Step 6 to submit OSM username
- Submissions are immediate (no batch processing)
- Database updates reflect in API within seconds

**Contact:**
- Production URL: https://learn.spatialcollective.co.ke
- API Endpoint: /api/external/osm-mappings
- Platform: Vercel (auto-deploys from main branch)

---

### Testing Checklist

- [ ] Build compiles successfully (`npm run build`) ✅
- [ ] Deploy to production (push to main branch)
- [ ] Test endpoint returns 200 OK
- [ ] Test CORS headers present in response
- [ ] Test from app.spatialcollective.com domain
- [ ] Verify unauthorized origin returns 403
- [ ] Confirm data structure matches documentation
- [ ] Validate youth_id and osm_username fields present
- [ ] Check timestamp format is ISO 8601
- [ ] Test with multiple youth submissions

---

### Deployment Status

**Build:** ✅ Compiled successfully (no errors)

**Next Steps:**
1. Commit and push to deploy
2. Test from production URL
3. Integrate into app.spatialcollective.com
4. Monitor submissions as youth complete training

**Estimated Time to Production:** ~2 minutes (Vercel auto-deploy)

# DPW Manager Integration API

## Overview
This API provides a secure data bridge between the Spatial Collective Learning Platform and the DPW Manager application (app.spatialcollective.com). It allows the main application to access comprehensive participant data including work performance, attendance, training progress, and module allocation.

## Authentication
All requests must include an API key in the request header:

```
X-API-Key: <your-api-key>
```

**Important:** The API key must be configured in environment variables:
- Variable name: `DPW_MANAGER_API_KEY`
- Store securely in Vercel environment variables
- Never commit the key to source code

## Endpoint

### GET `/api/external/dpw-sync`

Retrieves comprehensive data about youth participants.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `youth_id` | string | Filter by specific youth ID (optional) | `KAY1799DM` |
| `module` | string | Filter by program type (optional) | `mobile_mapping`, `digitization` |

#### Request Examples

**Get all participants:**
```bash
curl -H "X-API-Key: your-api-key-here" \
  https://learn.spatialcollective.co.ke/api/external/dpw-sync
```

**Get specific youth:**
```bash
curl -H "X-API-Key: your-api-key-here" \
  https://learn.spatialcollective.co.ke/api/external/dpw-sync?youth_id=KAY1799DM
```

**Get all mobile mappers:**
```bash
curl -H "X-API-Key: your-api-key-here" \
  https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping
```

#### Response Structure

```json
{
  "success": true,
  "timestamp": "2026-01-16T10:30:00.000Z",
  "data": {
    "participants": [
      {
        "youth_id": "KAY1799DM",
        "full_name": "David Mandu",
        "email": "david.mandu@example.com",
        "phone_number": "+254712345678",
        "work_email": "david.mandu@spatialcollective.com",
        "module": "mobile_mapping",
        "settlement": "Kayole Soweto",
        "osm_username": "davidmandu_osm",
        "module_assignment": "Zone A - Kayole",
        "enrollment_date": "2026-01-14T00:00:00.000Z",
        "last_login": "2026-01-16T09:15:00.000Z",
        
        // Contract Information
        "has_signed_contract": true,
        "contract_signed_date": "2026-01-14T14:30:00.000Z",
        
        // Work Performance
        "total_days_worked": 15,
        "work_summary": {
          "buildings_mapped": 342,
          "total_days": 15,
          "latest_date": "2026-01-16",
          "first_work_date": "2026-01-02"
        },
        
        // Attendance
        "attendance_days": 12,
        "attendance_history": [
          {
            "date": "2026-01-16",
            "submitted_at": "2026-01-16T08:30:00.000Z",
            "submitted_by": "SFEA1601T",
            "notes": null
          },
          {
            "date": "2026-01-15",
            "submitted_at": "2026-01-15T08:45:00.000Z",
            "submitted_by": "SFEA1601T",
            "notes": "On time"
          }
        ],
        
        // Training Progress
        "training_progress": {
          "digitization_completed": false,
          "digitization_completion_date": null,
          "mobile_mapping_completed": true,
          "mobile_mapping_completion_date": "2026-01-10T00:00:00.000Z"
        },
        
        // ODK Mobile Data Collection
        "odk_configured": true,
        "odk_configured_at": "2026-01-14T15:00:00.000Z",
        "odk_actor_id": "12345"
      }
    ],
    "count": 1,
    "statistics": [
      {
        "module": "mobile_mapping",
        "total_participants": 95,
        "logged_in_count": 87,
        "total_days_worked": 1425,
        "total_buildings_mapped": 32450,
        "total_attendance_records": 1140,
        "training_completed_count": 95,
        "odk_configured_count": 95
      },
      {
        "module": "digitization",
        "total_participants": 53,
        "logged_in_count": 48,
        "total_days_worked": 795,
        "total_buildings_mapped": 0,
        "total_attendance_records": 0,
        "training_completed_count": 42,
        "odk_configured_count": 0
      }
    ],
    "filters_applied": {
      "youth_id": "KAY1799DM",
      "module": null
    }
  }
}
```

## Data Fields Reference

### Participant Data

| Field | Type | Description |
|-------|------|-------------|
| `youth_id` | string | Unique participant identifier (e.g., KAY1799DM) |
| `full_name` | string | Full name of participant |
| `email` | string | Personal email address |
| `phone_number` | string | Phone number |
| `work_email` | string | Work email (@spatialcollective.com) |
| `module` | string | Program type: `mobile_mapping`, `digitization`, `household_survey`, `microtasking` |
| `settlement` | string | Settlement/area assigned to |
| `osm_username` | string | OpenStreetMap username |
| `module_assignment` | string | Specific area/zone assignment |
| `enrollment_date` | datetime | Date enrolled in program |
| `last_login` | datetime | Last platform login |

### Contract Information

| Field | Type | Description |
|-------|------|-------------|
| `has_signed_contract` | boolean | Whether contract has been signed |
| `contract_signed_date` | datetime | When contract was signed |

### Work Performance

| Field | Type | Description |
|-------|------|-------------|
| `total_days_worked` | integer | Total number of work days |
| `work_summary.buildings_mapped` | integer | Total buildings mapped |
| `work_summary.total_days` | integer | Days with work records |
| `work_summary.latest_date` | date | Most recent work date |
| `work_summary.first_work_date` | date | First work date |

### Attendance

| Field | Type | Description |
|-------|------|-------------|
| `attendance_days` | integer | Number of days attended |
| `attendance_history` | array | Detailed attendance records |
| `attendance_history[].date` | date | Attendance date |
| `attendance_history[].submitted_at` | datetime | When attendance was recorded |
| `attendance_history[].submitted_by` | string | Staff ID who recorded it |
| `attendance_history[].notes` | string | Optional notes |

### Training Progress

| Field | Type | Description |
|-------|------|-------------|
| `training_progress.digitization_completed` | boolean | Digitization training complete |
| `training_progress.digitization_completion_date` | datetime | When completed |
| `training_progress.mobile_mapping_completed` | boolean | Mobile mapping training complete |
| `training_progress.mobile_mapping_completion_date` | datetime | When completed |

### ODK Configuration

| Field | Type | Description |
|-------|------|-------------|
| `odk_configured` | boolean | ODK Central account set up |
| `odk_configured_at` | datetime | When configured |
| `odk_actor_id` | string | ODK Central actor ID |

### Statistics (Aggregated by Module)

| Field | Type | Description |
|-------|------|-------------|
| `module` | string | Program type |
| `total_participants` | integer | Number of participants |
| `logged_in_count` | integer | Participants who have logged in |
| `total_days_worked` | integer | Sum of all work days |
| `total_buildings_mapped` | integer | Sum of all buildings mapped |
| `total_attendance_records` | integer | Total attendance entries |
| `training_completed_count` | integer | Participants who completed training |
| `odk_configured_count` | integer | Participants with ODK configured |

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid API Key"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

## Usage in DPW Manager (app.spatialcollective.com)

### Example: Fetch all participants
```javascript
const response = await fetch('https://learn.spatialcollective.co.ke/api/external/dpw-sync', {
  headers: {
    'X-API-Key': process.env.LEARNING_PLATFORM_API_KEY
  }
});

const data = await response.json();

if (data.success) {
  const participants = data.data.participants;
  const stats = data.data.statistics;
  
  // Process participant data
  participants.forEach(participant => {
    console.log(`${participant.full_name} - ${participant.total_days_worked} days worked`);
  });
}
```

### Example: Get mobile mappers only
```javascript
const response = await fetch(
  'https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping',
  {
    headers: {
      'X-API-Key': process.env.LEARNING_PLATFORM_API_KEY
    }
  }
);

const data = await response.json();
// Process mobile mapping specific data
```

### Example: Calculate performance metrics
```javascript
const response = await fetch('https://learn.spatialcollective.co.ke/api/external/dpw-sync', {
  headers: { 'X-API-Key': process.env.LEARNING_PLATFORM_API_KEY }
});

const { participants } = (await response.json()).data;

// Calculate average attendance rate
const avgAttendance = participants.reduce((sum, p) => 
  sum + (p.attendance_days / p.total_days_worked), 0
) / participants.length;

// Find top performers
const topPerformers = participants
  .filter(p => p.module === 'mobile_mapping')
  .sort((a, b) => 
    b.work_summary.buildings_mapped - a.work_summary.buildings_mapped
  )
  .slice(0, 10);
```

## Setup Instructions

### 1. Generate API Key
```bash
# Generate a secure random API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add to Vercel Environment Variables
1. Go to https://vercel.com/spatialcollectiveltd/learn/settings/environment-variables
2. Add new variable:
   - Name: `DPW_MANAGER_API_KEY`
   - Value: [generated key from step 1]
   - Environment: Production, Preview, Development

### 3. Add to DPW Manager Environment Variables
Add the same key to app.spatialcollective.com environment:
- Name: `LEARNING_PLATFORM_API_KEY`
- Value: [same key]

### 4. Test the Connection
```bash
curl -H "X-API-Key: your-generated-key" \
  https://learn.spatialcollective.co.ke/api/external/dpw-sync?module=mobile_mapping
```

## Security Considerations

1. **API Key Protection**: Never expose the API key in client-side code
2. **HTTPS Only**: All requests must use HTTPS
3. **Rate Limiting**: Consider implementing rate limiting if needed
4. **IP Whitelisting**: Optionally restrict to DPW Manager server IPs
5. **Audit Logging**: Log all API access for security monitoring

## Data Refresh Frequency

The API provides real-time data. DPW Manager should:
- Poll this endpoint periodically (recommended: every 5-15 minutes)
- Cache responses to reduce load
- Use webhooks for real-time updates (future enhancement)

## Support

For issues or questions, contact:
- Technical Team: tech@spatialcollective.com
- API Documentation: https://learn.spatialcollective.co.ke/api/docs (if implemented)

## Version History

- **v1.0** (January 16, 2026) - Initial release
  - Participant data sync
  - Work performance metrics
  - Attendance tracking
  - Training progress
  - ODK configuration status

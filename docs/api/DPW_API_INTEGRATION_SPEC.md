# DPW App Integration - API Specification
**SC Training Hub ↔ DPW App Performance Metrics Integration**

**Document Version**: 1.0  
**Date**: January 6, 2026  
**DPW App Base URL**: https://app.spatialcollective.com  
**Training Hub Base URL**: https://learn.spatialcollective.co.ke  

---

## 📋 Executive Summary

The SC Training Hub requires performance data from the DPW App to display comprehensive work metrics for youth mappers. This integration will enable the Training Hub to show:

- Module-specific work assignments
- Performance metrics per settlement
- Quality scores and validation results
- Payment status and work completion
- Historical performance trends

---

## 🎯 Integration Overview

### Flow Diagram
```
Training Hub (learn.spatialcollective.co.ke)
    ↓ Request youth performance data
DPW App (app.spatialcollective.com)
    ↓ Returns performance metrics
Training Hub displays in Work Dashboard
```

### Authentication Flow
```
1. Training Hub authenticates with DPW App using API key
2. Requests youth performance by youth_id or osm_username
3. DPW App validates request and returns performance data
4. Training Hub caches response for 5 minutes
```

---

## 🔐 Authentication Requirements

### API Key Authentication

**Header**:
```http
Authorization: Bearer <DPW_API_KEY>
```

**Environment Variables Needed**:
```env
# Training Hub will set these
DPW_API_URL=https://app.spatialcollective.com/api
DPW_API_KEY=<provided_by_dpw_team>
```

### CORS Configuration

DPW App should allow requests from:
- `https://learn.spatialcollective.co.ke` (Production)
- `https://learn-*.vercel.app` (Preview deployments)
- `http://localhost:3000` (Development)

---

## 📡 Required API Endpoints

### 1. Get Youth Performance Metrics

**Endpoint**: `GET /api/v1/youth/performance/{youth_id}`

**Purpose**: Retrieve comprehensive performance data for a youth mapper including assignments, quality scores, and payment status.

#### Request

**URL Parameters**:
- `youth_id` (integer, required): The youth's unique identifier from `youth_participants` table

**Query Parameters**:
- `module` (string, optional): Filter by module (`digitization`, `mobile_mapping`, `household_survey`, `microtasking`)
- `settlement` (string, optional): Filter by settlement name
- `date_from` (date, optional): Start date for performance data (ISO 8601: YYYY-MM-DD)
- `date_to` (date, optional): End date for performance data (ISO 8601: YYYY-MM-DD)
- `include_history` (boolean, optional): Include historical assignments (default: false)

**Example Request**:
```http
GET /api/v1/youth/performance/123?module=digitization&settlement=Kayole&date_from=2025-12-08&date_to=2025-12-19 HTTP/1.1
Host: app.spatialcollective.com
Authorization: Bearer dpw_api_key_xxxxxxxxxxxxx
Content-Type: application/json
```

#### Response

**Status**: `200 OK`

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "youth_id": 123,
    "osm_username": "mapper_john",
    "full_name": "John Doe",
    "settlement": "Kayole",
    "module": "digitization",
    "performance_summary": {
      "total_assignments": 15,
      "completed_assignments": 12,
      "pending_assignments": 2,
      "rejected_assignments": 1,
      "total_buildings_mapped": 2400,
      "total_buildings_validated": 2100,
      "average_quality_score": 87.5,
      "completion_rate": 80.0,
      "days_active": 12,
      "days_remaining": 8,
      "total_earnings": 12000.00,
      "pending_payment": 2000.00,
      "paid_amount": 10000.00
    },
    "current_week": {
      "week_number": 2,
      "assignments_this_week": 5,
      "buildings_this_week": 1000,
      "average_quality": 90.0,
      "target_met": true
    },
    "assignments": [
      {
        "assignment_id": "ASN-2025-001",
        "date": "2025-12-08",
        "task_type": "building_mapping",
        "area_name": "Kayole South Zone A",
        "buildings_assigned": 200,
        "buildings_completed": 200,
        "buildings_validated": 185,
        "quality_score": 92.5,
        "status": "approved",
        "validator_name": "Jane Validator",
        "validated_at": "2025-12-09T10:30:00Z",
        "payment_status": "paid",
        "amount_earned": 1000.00,
        "notes": "Excellent quality, all buildings properly tagged"
      },
      {
        "assignment_id": "ASN-2025-002",
        "date": "2025-12-09",
        "task_type": "building_mapping",
        "area_name": "Kayole South Zone B",
        "buildings_assigned": 200,
        "buildings_completed": 200,
        "buildings_validated": 200,
        "quality_score": 100.0,
        "status": "approved",
        "validator_name": "Jane Validator",
        "validated_at": "2025-12-10T14:20:00Z",
        "payment_status": "paid",
        "amount_earned": 1000.00,
        "notes": "Perfect submission"
      },
      {
        "assignment_id": "ASN-2025-003",
        "date": "2025-12-10",
        "task_type": "building_mapping",
        "area_name": "Kayole South Zone C",
        "buildings_assigned": 200,
        "buildings_completed": 150,
        "buildings_validated": 0,
        "quality_score": null,
        "status": "pending_validation",
        "validator_name": null,
        "validated_at": null,
        "payment_status": "pending",
        "amount_earned": 0.00,
        "notes": null
      }
    ],
    "quality_breakdown": {
      "excellent": 8,
      "good": 3,
      "fair": 1,
      "poor": 0,
      "rejected": 1
    },
    "payment_breakdown": {
      "total_earned": 12000.00,
      "paid": 10000.00,
      "pending_validation": 1000.00,
      "pending_payment": 1000.00,
      "last_payment_date": "2025-12-15",
      "next_payment_date": "2025-12-22"
    },
    "settlement_rank": {
      "position": 5,
      "total_mappers": 25,
      "percentile": 80
    }
  },
  "meta": {
    "timestamp": "2026-01-06T12:00:00Z",
    "cache_ttl": 300
  }
}
```

#### Error Responses

**Youth Not Found** (`404`):
```json
{
  "success": false,
  "error": {
    "code": "YOUTH_NOT_FOUND",
    "message": "Youth with ID 123 not found in DPW system",
    "details": null
  }
}
```

**Invalid Module** (`400`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_MODULE",
    "message": "Module 'invalid_module' is not supported",
    "details": {
      "valid_modules": ["digitization", "mobile_mapping", "household_survey", "microtasking"]
    }
  }
}
```

**Unauthorized** (`401`):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "details": null
  }
}
```

---

### 2. Get Youth Performance by OSM Username

**Endpoint**: `GET /api/v1/youth/performance/by-osm/{osm_username}`

**Purpose**: Retrieve performance data using OSM username instead of youth_id (useful when Training Hub only has OSM username).

#### Request

**URL Parameters**:
- `osm_username` (string, required): The mapper's OpenStreetMap username

**Query Parameters**: Same as endpoint #1

**Example Request**:
```http
GET /api/v1/youth/performance/by-osm/mapper_john?module=digitization HTTP/1.1
Host: app.spatialcollective.com
Authorization: Bearer dpw_api_key_xxxxxxxxxxxxx
Content-Type: application/json
```

#### Response

Same structure as endpoint #1

---

### 3. Get Daily Work Summary

**Endpoint**: `GET /api/v1/youth/daily-summary/{youth_id}/{date}`

**Purpose**: Get detailed daily work summary for a specific date (complements OSM data from Training Hub).

#### Request

**URL Parameters**:
- `youth_id` (integer, required): Youth's unique identifier
- `date` (string, required): Date in YYYY-MM-DD format

**Example Request**:
```http
GET /api/v1/youth/daily-summary/123/2025-12-10 HTTP/1.1
Host: app.spatialcollective.com
Authorization: Bearer dpw_api_key_xxxxxxxxxxxxx
Content-Type: application/json
```

#### Response

```json
{
  "success": true,
  "data": {
    "youth_id": 123,
    "date": "2025-12-10",
    "assignments_today": [
      {
        "assignment_id": "ASN-2025-003",
        "area_name": "Kayole South Zone C",
        "target_buildings": 200,
        "completed_buildings": 150,
        "completion_percentage": 75.0,
        "time_started": "2025-12-10T08:00:00Z",
        "time_last_updated": "2025-12-10T16:30:00Z",
        "status": "in_progress",
        "osm_changesets": [12345678, 12345679]
      }
    ],
    "daily_stats": {
      "buildings_mapped": 150,
      "target_buildings": 200,
      "target_met": false,
      "percentage_complete": 75.0,
      "hours_worked": 8.5,
      "efficiency_score": 17.6,
      "osm_uploads": 2
    },
    "validator_feedback": null
  }
}
```

---

### 4. Get Settlement Performance Overview

**Endpoint**: `GET /api/v1/settlements/{settlement_name}/performance`

**Purpose**: Get aggregated performance metrics for all youth in a settlement (for leaderboards and comparisons).

#### Request

**URL Parameters**:
- `settlement_name` (string, required): Settlement name (e.g., "Kayole", "Kariobangi Machakos")

**Query Parameters**:
- `module` (string, optional): Filter by module
- `date_from` (date, optional): Start date
- `date_to` (date, optional): End date
- `limit` (integer, optional): Number of top performers to return (default: 10)

**Example Request**:
```http
GET /api/v1/settlements/Kayole/performance?module=digitization&limit=10 HTTP/1.1
Host: app.spatialcollective.com
Authorization: Bearer dpw_api_key_xxxxxxxxxxxxx
Content-Type: application/json
```

#### Response

```json
{
  "success": true,
  "data": {
    "settlement": "Kayole",
    "module": "digitization",
    "period": {
      "start_date": "2025-12-08",
      "end_date": "2025-12-19"
    },
    "settlement_stats": {
      "total_youth": 25,
      "active_youth": 23,
      "total_buildings_mapped": 50000,
      "average_quality_score": 85.5,
      "completion_rate": 88.0
    },
    "top_performers": [
      {
        "youth_id": 123,
        "osm_username": "mapper_john",
        "full_name": "John Doe",
        "buildings_mapped": 2400,
        "quality_score": 92.5,
        "rank": 1
      },
      {
        "youth_id": 456,
        "osm_username": "mapper_jane",
        "full_name": "Jane Smith",
        "buildings_mapped": 2350,
        "quality_score": 95.0,
        "rank": 2
      }
    ]
  }
}
```

---

### 5. Webhook for Real-Time Updates (Optional)

**Endpoint**: Training Hub will provide this endpoint for DPW to call

**Purpose**: DPW App pushes updates when assignment status changes (optional but recommended for real-time updates).

#### DPW App Sends to Training Hub

**Training Hub Webhook URL**: `POST https://learn.spatialcollective.co.ke/api/webhooks/dpw/assignment-update`

**Request from DPW**:
```json
{
  "event": "assignment.validated",
  "timestamp": "2025-12-10T14:20:00Z",
  "data": {
    "assignment_id": "ASN-2025-002",
    "youth_id": 123,
    "osm_username": "mapper_john",
    "status": "approved",
    "quality_score": 100.0,
    "validator_name": "Jane Validator",
    "amount_earned": 1000.00,
    "payment_status": "pending"
  }
}
```

**Training Hub Response**:
```json
{
  "success": true,
  "message": "Webhook received and processed"
}
```

**Supported Events**:
- `assignment.created`
- `assignment.submitted`
- `assignment.validated`
- `assignment.approved`
- `assignment.rejected`
- `payment.processed`

---

## 📊 Data Mapping

### Youth Identification

The Training Hub uses the following fields to identify youth:

| Training Hub Field | DPW App Field | Type | Notes |
|-------------------|---------------|------|-------|
| `youth_id` | `youth_id` or `user_id` | Integer | Primary identifier |
| `osm_username` | `osm_username` | String | OpenStreetMap username |
| `settlement` | `settlement_name` | String | Settlement location |
| `program_type` | `module` or `program_type` | String | digitization, mobile_mapping, etc. |

### Module Names Mapping

| Training Hub | DPW App | Description |
|--------------|---------|-------------|
| `digitization` | `digitization` or `mapping` | Building mapping with OSM |
| `mobile_mapping` | `mobile_mapping` or `field_mapping` | Field data collection |
| `household_survey` | `household_survey` or `surveys` | Household data collection |
| `microtasking` | `microtasking` or `validation` | Task validation |

### Status Values

| Field | Possible Values |
|-------|----------------|
| `assignment.status` | `pending`, `in_progress`, `submitted`, `pending_validation`, `approved`, `rejected` |
| `payment_status` | `pending`, `processing`, `paid`, `failed` |
| `quality_level` | `excellent` (90-100), `good` (75-89), `fair` (60-74), `poor` (<60) |

---

## 🔄 Integration Use Cases

### Use Case 1: Work Dashboard Performance Display

**Scenario**: Youth logs into Training Hub and navigates to Work Dashboard

**Flow**:
1. Training Hub gets `youth_id` from authenticated session
2. Calls `GET /api/v1/youth/performance/{youth_id}?module=digitization`
3. Displays:
   - Total buildings from OSM (Training Hub calculates)
   - Assignment completion from DPW (shows structure)
   - Quality scores from DPW
   - Payment status from DPW
   - Settlement ranking from DPW

### Use Case 2: Daily Performance Tracking

**Scenario**: Youth wants to see today's work progress

**Flow**:
1. Training Hub calls OSM API to get today's building count
2. Training Hub calls `GET /api/v1/youth/daily-summary/{youth_id}/{today}`
3. Displays combined view:
   - OSM buildings: 150 (from OSM API)
   - DPW assignment: "Kayole South Zone C" - 150/200 (75%)
   - Combined progress bar showing alignment

### Use Case 3: Performance History

**Scenario**: Youth reviews past work weeks

**Flow**:
1. Training Hub calls `GET /api/v1/youth/performance/{youth_id}?include_history=true&date_from=2025-12-08&date_to=2025-12-19`
2. Displays timeline with:
   - Daily building counts
   - Quality scores per day
   - Earnings progression
   - Validation status

### Use Case 4: Settlement Leaderboard

**Scenario**: Display top performers in settlement

**Flow**:
1. Training Hub calls `GET /api/v1/settlements/Kayole/performance?limit=10`
2. Shows leaderboard with:
   - Top 10 mappers
   - Current user's rank
   - Buildings mapped comparison
   - Quality score comparison

---

## ⚙️ Technical Requirements

### API Specifications

**Protocol**: HTTPS only (TLS 1.2+)  
**Format**: JSON  
**Encoding**: UTF-8  
**Date Format**: ISO 8601 (e.g., `2025-12-10T14:20:00Z`)  
**Timezone**: UTC (Training Hub converts to EAT for display)

### Rate Limiting

**Recommended Limits**:
- 100 requests per minute per API key
- 1000 requests per hour per API key
- Burst: 10 requests per second

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704551400
```

### Caching

**Training Hub Caching Strategy**:
- Performance summary: 5 minutes
- Daily summary: 2 minutes
- Settlement leaderboard: 10 minutes

**DPW App Caching Recommendations**:
- Include `Cache-Control` headers
- Support `ETag` for conditional requests
- Return `304 Not Modified` when data unchanged

### Error Handling

**Standard Error Format**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

**Error Codes**:
- `YOUTH_NOT_FOUND` (404)
- `INVALID_MODULE` (400)
- `INVALID_DATE_RANGE` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

### Performance Requirements

**Target Response Times**:
- Single youth performance: < 500ms
- Daily summary: < 200ms
- Settlement leaderboard: < 1 second
- 95th percentile: < 2 seconds

### Data Freshness

**Update Frequencies**:
- Assignment status: Real-time (webhook) or 5-minute polling
- Quality scores: Updated when validator completes
- Payment status: Updated when payment processed
- Settlement rankings: Updated hourly

---

## 🧪 Testing & Validation

### Test Data Requirements

Please provide test accounts:

**Test Youth Account #1**:
- `youth_id`: 999
- `osm_username`: test_mapper_complete
- `settlement`: Kayole
- `module`: digitization
- Has: 10 completed assignments, mix of quality scores, paid status

**Test Youth Account #2**:
- `youth_id`: 998
- `osm_username`: test_mapper_pending
- `settlement`: Kariobangi Machakos
- `module`: digitization
- Has: 5 pending validations, 3 approved, 2 rejected

**Test Youth Account #3**:
- `youth_id`: 997
- `osm_username`: test_mapper_new
- `settlement`: Mji wa Huruma
- `module`: digitization
- Has: No assignments yet (new mapper)

### Test Endpoints

**Staging Environment**:
```
Base URL: https://staging.app.spatialcollective.com/api
API Key: test_api_key_staging_xxxxx
```

**Postman Collection**: Please provide a Postman collection for testing

---

## 📋 Implementation Checklist

### DPW App Team Tasks

- [ ] Create API endpoints (4 endpoints)
- [ ] Implement authentication (Bearer token)
- [ ] Set up CORS for Training Hub domains
- [ ] Generate API keys (staging + production)
- [ ] Create test data accounts
- [ ] Implement rate limiting
- [ ] Add response caching
- [ ] Implement error handling
- [ ] Create API documentation
- [ ] Provide Postman collection
- [ ] Set up monitoring and logging
- [ ] Deploy to staging
- [ ] Share staging credentials
- [ ] Performance testing (response times)
- [ ] Deploy to production
- [ ] Share production credentials

### Training Hub Team Tasks (Our Side)

- [ ] Create DPW integration service
- [ ] Add API key to environment variables
- [ ] Implement API client with retry logic
- [ ] Add caching layer (Redis)
- [ ] Create performance dashboard UI
- [ ] Test with staging API
- [ ] Handle error scenarios
- [ ] Add loading states
- [ ] Implement webhook receiver (optional)
- [ ] Test with production API
- [ ] Monitor integration health

---

## 🔒 Security Considerations

### API Key Management

**Storage**:
- API keys stored in Vercel environment variables
- Never exposed in client-side code
- Rotated quarterly

**Access Control**:
- Read-only access for Training Hub
- No write/update permissions needed
- Limited to youth performance data only

### Data Privacy

**PII Handling**:
- Full names only used for display (never stored)
- OSM usernames are public data
- Payment amounts aggregated (no individual transaction details)
- Validator names for context only

**Data Retention**:
- Training Hub caches for max 10 minutes
- No persistent storage of DPW data
- Real-time fetch from DPW as source of truth

### Network Security

**Requirements**:
- HTTPS only (no HTTP fallback)
- TLS 1.2 or higher
- Valid SSL certificates
- CORS restricted to Training Hub domains

---

## 📞 Support & Contact

### Training Hub Team

**Technical Lead**: SC Development Team  
**Email**: dev@spatialcollective.co.ke  
**Platform**: https://learn.spatialcollective.co.ke

### DPW App Team

**Technical Lead**: [To be provided]  
**Email**: [To be provided]  
**Platform**: https://app.spatialcollective.com

### Integration Timeline

**Estimated Implementation**: 2-3 weeks  
**Phases**:
1. Week 1: API endpoint development (DPW team)
2. Week 2: Integration implementation (Training Hub team)
3. Week 3: Testing and deployment

---

## 📚 Appendix

### Example Integration Code (Training Hub Side)

```typescript
// src/lib/dpw-service.ts
import axios from 'axios';

const DPW_API_URL = process.env.DPW_API_URL;
const DPW_API_KEY = process.env.DPW_API_KEY;

export async function getYouthPerformance(
  youthId: number,
  options?: {
    module?: string;
    settlement?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  try {
    const params = new URLSearchParams();
    if (options?.module) params.append('module', options.module);
    if (options?.settlement) params.append('settlement', options.settlement);
    if (options?.dateFrom) params.append('date_from', options.dateFrom);
    if (options?.dateTo) params.append('date_to', options.dateTo);

    const response = await axios.get(
      `${DPW_API_URL}/v1/youth/performance/${youthId}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${DPW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('[DPW] Error fetching performance:', error);
    throw error;
  }
}
```

### Sample Dashboard Display

**Work Dashboard Enhanced View**:
```
┌─────────────────────────────────────────┐
│ Today's Progress                         │
│                                          │
│ 150 / 200 buildings                     │
│ ████████████░░░░ 75%                    │
│                                          │
│ Assignment: Kayole South Zone C         │
│ Status: In Progress                      │
│ Quality: Pending validation              │
├─────────────────────────────────────────┤
│ Week 2 Performance                       │
│                                          │
│ Assignments: 5                           │
│ Buildings: 1,000                         │
│ Avg Quality: 90.0%                       │
│ Earnings: KES 5,000                      │
├─────────────────────────────────────────┤
│ Overall Stats                            │
│                                          │
│ Days Worked: 12/20                       │
│ Total Buildings: 2,400                   │
│ Quality Score: 87.5%                     │
│ Settlement Rank: #5 of 25               │
└─────────────────────────────────────────┘
```

---

**Document End**

**Questions?** Contact: dev@spatialcollective.co.ke  
**Last Updated**: January 6, 2026  
**Next Review**: February 6, 2026

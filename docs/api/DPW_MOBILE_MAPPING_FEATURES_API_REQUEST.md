# DPW Manager API - Mobile Mapping Features Request

**Date:** February 2, 2026  
**Requesting System:** SC Learning Platform (learn.spatialcollective.co.ke)  
**Target System:** DPW Manager (app.spatialcollective.com)  
**Priority:** HIGH  
**Purpose:** Enable payment tracking, performance analytics, and dispute resolution for mobile mapping youth

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Payment Breakdown API](#payment-breakdown-api)
4. [Performance Metrics API](#performance-metrics-api)
5. [Badge & Achievements API](#badge--achievements-api)
6. [Dispute/Query Submission API](#disputequery-submission-api)
7. [Query Status & Response API](#query-status--response-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Testing Scenarios](#testing-scenarios)

---

## Overview

### Objective
The SC Learning Platform requires real-time access to payment, performance, and dispute data for 181 mobile mapping youth participants across 3 settlements (Kayole Soweto, Kariobangi Machakos, Mji wa Huruma).

### Use Cases
1. **Youth Dashboard:** Display payment breakdown, quality scores, and earnings
2. **Performance Tracking:** Show youth their ranking and quality metrics
3. **Dispute Resolution:** Allow youth to submit and track payment/work disputes
4. **Badge System:** Award and display achievement badges based on performance

### Integration Pattern
- **Authentication:** X-API-Key header (same as existing DPW sync)
- **Data Format:** JSON request/response
- **Timezone:** Africa/Nairobi (EAT, UTC+3)
- **Character Encoding:** UTF-8

---

## Authentication

### API Key Header
All requests must include:

```http
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

**Note:** Same API key currently used for `/api/external/dpw-sync` endpoint.

### Request Headers (Standard)
```http
Content-Type: application/json
X-API-Key: <LEARNING_PLATFORM_API_KEY>
Accept: application/json
```

### Error Response (Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

---

## Payment Breakdown API

### Endpoint
```
GET /api/v1/youth/{youth_id}/payment/breakdown
```

### Description
Returns detailed payment breakdown for a specific youth, including base pay, quality pay, performance bonuses, and per-work-day earnings.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `youth_id` | string | Yes | Youth identifier (e.g., `KAY1278MK`, `KAR119BN`, `HUR728CM`) |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `current` | Time period: `today`, `week`, `month`, `current`, `all` |
| `settlement` | string | No | null | Filter by settlement name |
| `include_daily` | boolean | No | `true` | Include per-work-day breakdown |

### Request Example
```http
GET /api/v1/youth/KAY1278MK/payment/breakdown?period=current&include_daily=true
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Response Schema
```json
{
  "success": true,
  "data": {
    "youth_id": "KAY1278MK",
    "full_name": "Michelle Kinya",
    "settlement": "Kayole Soweto",
    "program_type": "mobile_mapping",
    "payment_summary": {
      "total_earnings": 15000.00,
      "base_pay": 10000.00,
      "quality_pay": 3000.00,
      "performance_bonus": 2000.00,
      "currency": "KES"
    },
    "period_info": {
      "period_type": "current",
      "start_date": "2026-01-15",
      "end_date": "2026-02-07",
      "work_days_completed": 15,
      "total_work_days": 20,
      "days_remaining": 5
    },
    "today_stats": {
      "date": "2026-02-02",
      "pois_submitted": 12,
      "quality_score": 95.5,
      "estimated_earnings": 750.00,
      "breakdown": {
        "base_pay": 500.00,
        "quality_pay": 200.00,
        "performance_bonus": 50.00
      }
    },
    "daily_breakdown": [
      {
        "work_day": 1,
        "date": "2026-01-15",
        "pois_submitted": 15,
        "quality_score": 92.0,
        "attendance": true,
        "base_pay": 500.00,
        "quality_pay": 150.00,
        "performance_bonus": 0,
        "total_earnings": 650.00,
        "payment_formula": "Base: 500 (fixed) + Quality: (92% × 200) = 184 + Performance: 0 (threshold not met)"
      },
      {
        "work_day": 2,
        "date": "2026-01-16",
        "pois_submitted": 18,
        "quality_score": 95.5,
        "attendance": true,
        "base_pay": 500.00,
        "quality_pay": 191.00,
        "performance_bonus": 100.00,
        "total_earnings": 791.00,
        "payment_formula": "Base: 500 (fixed) + Quality: (95.5% × 200) = 191 + Performance: 100 (exceeded 15 POIs)"
      }
      // ... more days
    ],
    "payment_rules": {
      "base_pay_per_day": 500.00,
      "quality_pay_max": 200.00,
      "quality_pay_formula": "quality_score × quality_pay_max",
      "performance_thresholds": [
        { "threshold": 15, "bonus": 100 },
        { "threshold": 20, "bonus": 200 }
      ],
      "minimum_quality_score": 70.0,
      "currency": "KES"
    }
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Field Descriptions

#### `payment_summary`
- **total_earnings:** Total amount earned for the period (KES)
- **base_pay:** Fixed daily rate × days worked
- **quality_pay:** Variable pay based on quality score
- **performance_bonus:** Extra pay for exceeding performance thresholds
- **currency:** Always "KES" (Kenyan Shilling)

#### `today_stats`
- **pois_submitted:** Points of Interest (POIs) submitted today (count)
- **quality_score:** Percentage score (0-100) based on data quality validation
- **estimated_earnings:** Projected earnings for today (calculated but not final)

#### `daily_breakdown[]`
- **work_day:** Sequential work day number (1-20)
- **date:** ISO 8601 date (YYYY-MM-DD)
- **pois_submitted:** Number of POIs/forms submitted that day
- **quality_score:** Quality percentage for that day's work
- **attendance:** Boolean - was present/submitted work
- **payment_formula:** Human-readable explanation of how payment was calculated

#### `payment_rules`
- **base_pay_per_day:** Fixed amount per work day
- **quality_pay_max:** Maximum quality bonus per day
- **quality_pay_formula:** Formula used to calculate quality pay
- **performance_thresholds:** Array of POI thresholds and bonuses
- **minimum_quality_score:** Minimum score to receive payment

### Error Responses

#### Youth Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "YOUTH_NOT_FOUND",
    "message": "Youth with ID 'KAY9999XX' not found in DPW Manager",
    "details": "No payment records exist for this youth_id"
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

#### No Payment Data (200 - but empty)
```json
{
  "success": true,
  "data": {
    "youth_id": "KAY1278MK",
    "full_name": "Michelle Kinya",
    "settlement": "Kayole Soweto",
    "program_type": "mobile_mapping",
    "payment_summary": {
      "total_earnings": 0,
      "base_pay": 0,
      "quality_pay": 0,
      "performance_bonus": 0,
      "currency": "KES"
    },
    "period_info": {
      "period_type": "current",
      "work_days_completed": 0,
      "total_work_days": 20,
      "days_remaining": 20
    },
    "daily_breakdown": [],
    "message": "No payment data available yet. Youth has not submitted any work."
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

---

## Performance Metrics API

### Endpoint
```
GET /api/v1/youth/{youth_id}/performance
```

### Description
Returns performance metrics including quality score, attendance rate, ranking position, and comparison with peers.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `youth_id` | string | Yes | Youth identifier |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scope` | string | No | `settlement` | Leaderboard scope: `settlement`, `global` |
| `period` | string | No | `all_time` | Time period: `all_time`, `current_work_period` |

### Request Example
```http
GET /api/v1/youth/KAY1278MK/performance?scope=settlement
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Response Schema
```json
{
  "success": true,
  "data": {
    "youth_id": "KAY1278MK",
    "full_name": "Michelle Kinya",
    "settlement": "Kayole Soweto",
    "program_type": "mobile_mapping",
    "performance_metrics": {
      "quality_score": {
        "current": 94.5,
        "average": 92.3,
        "trend": "improving",
        "percentage_change": "+2.4"
      },
      "attendance_rate": {
        "current": 95.0,
        "days_present": 19,
        "total_days": 20,
        "percentage": 95.0
      },
      "overall_score": 94.0,
      "last_updated": "2026-02-02T14:00:00+03:00"
    },
    "rankings": {
      "settlement_rank": {
        "position": 3,
        "total_participants": 100,
        "percentile": 97,
        "scope": "Kayole Soweto"
      },
      "global_rank": {
        "position": 8,
        "total_participants": 181,
        "percentile": 95.6,
        "scope": "All Settlements"
      }
    },
    "leaderboard": {
      "scope": "settlement",
      "settlement": "Kayole Soweto",
      "top_10": [
        {
          "rank": 1,
          "youth_id": "KAY2544DG",
          "full_name": "Denis Gitahi",
          "quality_score": 98.2,
          "attendance_rate": 100.0,
          "overall_score": 99.1,
          "is_current_user": false
        },
        {
          "rank": 2,
          "youth_id": "KAY868JN",
          "full_name": "Joy Nzomo",
          "quality_score": 96.8,
          "attendance_rate": 100.0,
          "overall_score": 98.4,
          "is_current_user": false
        },
        {
          "rank": 3,
          "youth_id": "KAY1278MK",
          "full_name": "Michelle Kinya",
          "quality_score": 94.5,
          "attendance_rate": 95.0,
          "overall_score": 94.8,
          "is_current_user": true
        }
        // ... up to rank 10
      ]
    },
    "badges_earned": [
      {
        "badge_id": "quality_champion",
        "name": "Quality Champion",
        "description": "Maintained 90%+ quality score for 10 consecutive days",
        "icon_url": "https://app.spatialcollective.com/assets/badges/quality_champion.png",
        "earned_at": "2026-01-25T10:00:00+03:00",
        "tier": "gold"
      },
      {
        "badge_id": "perfect_attendance",
        "name": "Perfect Attendance",
        "description": "100% attendance for a full work period",
        "icon_url": "https://app.spatialcollective.com/assets/badges/perfect_attendance.png",
        "earned_at": "2026-01-30T16:00:00+03:00",
        "tier": "platinum"
      }
    ],
    "comparison": {
      "quality_score_vs_avg": "+2.2",
      "attendance_vs_avg": "+10.5",
      "rank_change_last_week": "+2 positions"
    }
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Field Descriptions

#### `performance_metrics`
- **quality_score.current:** Latest quality score (0-100)
- **quality_score.average:** Average over entire work period
- **quality_score.trend:** Direction: `improving`, `stable`, `declining`
- **quality_score.percentage_change:** Change from previous period
- **attendance_rate:** Percentage of days attended (0-100)
- **overall_score:** Weighted combination of quality + attendance

#### `rankings`
- **settlement_rank:** Position within youth's own settlement
- **global_rank:** Position across all 181 mobile mappers
- **percentile:** Percentage of mappers below this youth (higher is better)

#### `leaderboard.top_10[]`
- **rank:** Position (1-10)
- **is_current_user:** Boolean to highlight current youth
- **overall_score:** Combined quality + attendance score

#### `badges_earned[]`
- **badge_id:** Unique identifier for programmatic use
- **name:** Display name
- **description:** How badge was earned
- **icon_url:** Full URL to badge icon image (PNG/SVG)
- **earned_at:** ISO 8601 timestamp when awarded
- **tier:** Badge level: `bronze`, `silver`, `gold`, `platinum`

---

## Badge & Achievements API

### Endpoint
```
GET /api/v1/youth/{youth_id}/badges
```

### Description
Returns all available badges, earned status, and progress toward unlocking locked badges.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `youth_id` | string | Yes | Youth identifier |

### Request Example
```http
GET /api/v1/youth/KAY1278MK/badges
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Response Schema
```json
{
  "success": true,
  "data": {
    "youth_id": "KAY1278MK",
    "total_badges": 12,
    "earned_count": 4,
    "locked_count": 8,
    "badges": [
      {
        "badge_id": "quality_champion",
        "name": "Quality Champion",
        "description": "Maintain 90%+ quality score for 10 consecutive days",
        "icon_url": "https://app.spatialcollective.com/assets/badges/quality_champion.png",
        "tier": "gold",
        "status": "unlocked",
        "earned_at": "2026-01-25T10:00:00+03:00",
        "progress": {
          "current": 10,
          "required": 10,
          "percentage": 100
        }
      },
      {
        "badge_id": "speed_demon",
        "name": "Speed Demon",
        "description": "Submit 25+ POIs in a single day",
        "icon_url": "https://app.spatialcollective.com/assets/badges/speed_demon.png",
        "tier": "silver",
        "status": "locked",
        "earned_at": null,
        "progress": {
          "current": 18,
          "required": 25,
          "percentage": 72,
          "hint": "7 more POIs needed in one day!"
        }
      },
      {
        "badge_id": "perfect_attendance",
        "name": "Perfect Attendance",
        "description": "100% attendance for entire work period (20 days)",
        "icon_url": "https://app.spatialcollective.com/assets/badges/perfect_attendance.png",
        "tier": "platinum",
        "status": "unlocked",
        "earned_at": "2026-01-30T16:00:00+03:00",
        "progress": {
          "current": 20,
          "required": 20,
          "percentage": 100
        }
      },
      {
        "badge_id": "consistency_king",
        "name": "Consistency King",
        "description": "Submit work every day for 15 consecutive days",
        "icon_url": "https://app.spatialcollective.com/assets/badges/consistency_king.png",
        "tier": "gold",
        "status": "unlocked",
        "earned_at": "2026-01-29T12:00:00+03:00",
        "progress": {
          "current": 15,
          "required": 15,
          "percentage": 100
        }
      },
      {
        "badge_id": "top_performer",
        "name": "Top Performer",
        "description": "Rank in top 10 of your settlement",
        "icon_url": "https://app.spatialcollective.com/assets/badges/top_performer.png",
        "tier": "platinum",
        "status": "locked",
        "earned_at": null,
        "progress": {
          "current": 3,
          "required": 10,
          "percentage": 30,
          "hint": "Currently rank #3 - keep it up!"
        }
      }
      // ... more badges
    ],
    "recent_unlocks": [
      {
        "badge_id": "perfect_attendance",
        "name": "Perfect Attendance",
        "earned_at": "2026-01-30T16:00:00+03:00"
      }
    ]
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Badge Tiers & Point Values
| Tier | Points | Color | Rarity |
|------|--------|-------|--------|
| Bronze | 10 | #CD7F32 | Common |
| Silver | 25 | #C0C0C0 | Uncommon |
| Gold | 50 | #FFD700 | Rare |
| Platinum | 100 | #E5E4E2 | Epic |

### Suggested Badge Categories

#### Performance Badges
- **Speed Demon:** Submit 25+ POIs in one day (Silver)
- **Marathon Mapper:** Submit 100+ total POIs (Gold)
- **Elite Mapper:** Submit 200+ total POIs (Platinum)

#### Quality Badges
- **Quality Champion:** 90%+ quality for 10 consecutive days (Gold)
- **Perfectionist:** Achieve 100% quality score (Platinum)
- **Quality Streak:** 85%+ quality for 15 days (Silver)

#### Attendance Badges
- **Perfect Attendance:** 100% attendance (Platinum)
- **Consistency King/Queen:** Work 15 consecutive days (Gold)
- **Early Bird:** Submit work before 10 AM for 10 days (Bronze)

#### Ranking Badges
- **Top Performer:** Rank in top 10 settlement (Platinum)
- **Rising Star:** Improve rank by 10+ positions (Gold)
- **Settlement Champion:** #1 in settlement (Platinum)

#### Miscellaneous
- **First Steps:** Complete first work day (Bronze)
- **Team Player:** Help another youth troubleshoot (Silver)
- **Data Hero:** Contribute to 1000+ settlement POIs (Gold)

---

## Dispute/Query Submission API

### Endpoint
```
POST /api/v1/youth/queries/submit
```

### Description
Submit a dispute, question, or issue from youth to DPW Manager support team.

### Request Headers
```http
Content-Type: application/json
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Request Body Schema
```json
{
  "youth_id": "KAY1278MK",
  "category": "payment_dispute",
  "subject": "Missing payment for work day 10",
  "message": "I submitted 15 POIs on January 25th but my payment dashboard shows 0 earnings for that day. Please investigate.",
  "work_day": 10,
  "date": "2026-01-25",
  "attachments": [
    {
      "filename": "screenshot_payment.png",
      "data": "base64_encoded_string_here",
      "mime_type": "image/png",
      "size_bytes": 145623
    }
  ],
  "metadata": {
    "settlement": "Kayole Soweto",
    "submitted_from": "mobile_app",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "102.212.123.45"
  }
}
```

### Field Descriptions

#### Required Fields
- **youth_id:** Youth identifier (string)
- **category:** Query type (enum, see below)
- **subject:** Brief summary (string, max 200 chars)
- **message:** Detailed description (string, max 2000 chars)

#### Optional Fields
- **work_day:** Related work day number (integer 1-20, null if not applicable)
- **date:** Related date (ISO 8601 date string, null if not applicable)
- **attachments:** Array of file attachments (max 3 files, 5MB each)

#### Category Enum Values
```javascript
[
  "payment_dispute",      // Payment calculation incorrect
  "work_day_dispute",     // Work not recorded/showing
  "odk_technical",        // ODK Collect app issues
  "general_question",     // General inquiry
  "quality_score_query",  // Quality score concerns
  "attendance_issue",     // Attendance not recorded
  "other"                 // Other issues
]
```

### Response Schema (Success)
```json
{
  "success": true,
  "data": {
    "query_id": "QRY-2026-02-02-1234",
    "youth_id": "KAY1278MK",
    "category": "payment_dispute",
    "subject": "Missing payment for work day 10",
    "status": "pending",
    "submitted_at": "2026-02-02T14:30:00+03:00",
    "estimated_response_time": "24-48 hours",
    "ticket_number": "SC-MM-1234",
    "assigned_to": null,
    "message": "Your query has been submitted successfully. Our support team will review and respond within 24-48 hours."
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Error Response (Validation Failed)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "category",
        "error": "Invalid category. Must be one of: payment_dispute, work_day_dispute, odk_technical, general_question, quality_score_query, attendance_issue, other"
      },
      {
        "field": "message",
        "error": "Message is required and must not be empty"
      }
    ]
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

---

## Query Status & Response API

### Endpoint
```
GET /api/v1/youth/{youth_id}/queries
```

### Description
Retrieve all queries submitted by youth, including status and responses.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `youth_id` | string | Yes | Youth identifier |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | `all` | Filter by status: `all`, `pending`, `in_progress`, `resolved`, `closed` |
| `limit` | integer | No | 20 | Max queries to return |
| `offset` | integer | No | 0 | Pagination offset |

### Request Example
```http
GET /api/v1/youth/KAY1278MK/queries?status=all&limit=10
X-API-Key: <LEARNING_PLATFORM_API_KEY>
```

### Response Schema
```json
{
  "success": true,
  "data": {
    "youth_id": "KAY1278MK",
    "total_queries": 5,
    "pending_count": 1,
    "resolved_count": 4,
    "queries": [
      {
        "query_id": "QRY-2026-02-02-1234",
        "category": "payment_dispute",
        "subject": "Missing payment for work day 10",
        "status": "resolved",
        "priority": "high",
        "submitted_at": "2026-02-02T14:30:00+03:00",
        "updated_at": "2026-02-02T18:45:00+03:00",
        "resolved_at": "2026-02-02T18:45:00+03:00",
        "response_time_hours": 4.25,
        "assigned_to": {
          "name": "Support Team",
          "role": "Payment Specialist"
        },
        "messages": [
          {
            "message_id": "MSG-001",
            "sender_type": "youth",
            "sender_name": "Michelle Kinya",
            "message": "I submitted 15 POIs on January 25th but my payment dashboard shows 0 earnings for that day. Please investigate.",
            "timestamp": "2026-02-02T14:30:00+03:00",
            "attachments": [
              {
                "filename": "screenshot_payment.png",
                "url": "https://app.spatialcollective.com/attachments/abc123.png",
                "mime_type": "image/png"
              }
            ]
          },
          {
            "message_id": "MSG-002",
            "sender_type": "admin",
            "sender_name": "Payment Team",
            "message": "Thank you for reporting this. We found a sync issue on January 25th. Your 15 POIs have been recorded and payment of KES 750 has been added to your account. You should see this reflected in your dashboard within 1 hour.",
            "timestamp": "2026-02-02T18:45:00+03:00",
            "attachments": []
          }
        ],
        "resolution": {
          "resolved_by": "Payment Team",
          "resolution_note": "Sync issue fixed, payment credited",
          "action_taken": "Manual payment adjustment: +750 KES"
        }
      },
      {
        "query_id": "QRY-2026-01-28-5678",
        "category": "odk_technical",
        "subject": "ODK Collect won't download forms",
        "status": "pending",
        "priority": "medium",
        "submitted_at": "2026-01-28T09:15:00+03:00",
        "updated_at": "2026-01-28T09:15:00+03:00",
        "resolved_at": null,
        "response_time_hours": null,
        "assigned_to": {
          "name": "Technical Support",
          "role": "IT Specialist"
        },
        "messages": [
          {
            "message_id": "MSG-003",
            "sender_type": "youth",
            "sender_name": "Michelle Kinya",
            "message": "When I tap 'Get Blank Form' in ODK Collect, it says 'Connection failed'. I have internet connection. What should I do?",
            "timestamp": "2026-01-28T09:15:00+03:00",
            "attachments": []
          }
        ],
        "resolution": null
      }
      // ... more queries
    ]
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5,
    "has_more": false
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Query Status Flow
```
pending → in_progress → resolved → closed
                ↓
            cancelled (if needed)
```

### Status Definitions
- **pending:** Submitted, awaiting review
- **in_progress:** Being investigated by support team
- **resolved:** Issue fixed, response provided
- **closed:** Youth confirmed resolution or auto-closed after 7 days
- **cancelled:** Youth cancelled the query

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Optional detailed explanation or array of validation errors"
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_YOUTH_ID` | Youth ID format invalid |
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 403 | `FORBIDDEN` | API key valid but lacks permissions |
| 404 | `YOUTH_NOT_FOUND` | Youth ID not found in system |
| 404 | `QUERY_NOT_FOUND` | Query ID doesn't exist |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Temporary service issue |

### Example Error Responses

#### Invalid Youth ID Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_YOUTH_ID",
    "message": "Youth ID must match pattern: KAY*, KAR*, or HUR* followed by alphanumeric characters",
    "details": "Provided: 'INVALID123' does not match expected format"
  },
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

#### Rate Limit Exceeded
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": "Limit: 100 requests per minute. Retry after: 45 seconds"
  },
  "retry_after": 45,
  "timestamp": "2026-02-02T14:30:00+03:00"
}
```

---

## Rate Limiting

### Limits
- **Payment Breakdown API:** 100 requests/minute per API key
- **Performance API:** 50 requests/minute per API key
- **Badges API:** 50 requests/minute per API key
- **Query Submission:** 10 requests/minute per youth_id (prevent spam)
- **Query List:** 20 requests/minute per API key

### Rate Limit Headers
All responses include:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1706876400
```

---

## Testing Scenarios

### Test Youth IDs (Recommended)
Please use these youth IDs for testing (real users with data):

```
Kayole Soweto:
- KAY1278MK (Michelle Kinya) - Active, high performer
- KAY2544DG (Denis Gitahi) - Active, top rank
- KAY868JN (Joy Nzomo) - Active, consistent quality

Kariobangi Machakos:
- KAR119BN (Bill Njiru) - Active
- KAR078KM (Kelvin Mulela) - Active

Mji wa Huruma:
- HUR185RN (Richard Njuguna) - Active
- HUR728CM (Catherine Mararo) - Active
```

### Test Scenarios

#### Scenario 1: New Youth (No Data)
```
GET /api/v1/youth/KAY9999XX/payment/breakdown
Expected: 200 OK with zero earnings, empty daily_breakdown
```

#### Scenario 2: High Performer
```
GET /api/v1/youth/KAY2544DG/performance
Expected: 200 OK with rank #1 or #2, multiple badges
```

#### Scenario 3: Multiple Queries
```
GET /api/v1/youth/KAY1278MK/queries
Expected: 200 OK with array of queries in various statuses
```

#### Scenario 4: Invalid Youth ID
```
GET /api/v1/youth/INVALID123/payment/breakdown
Expected: 400 Bad Request with INVALID_YOUTH_ID error
```

#### Scenario 5: Query Submission
```
POST /api/v1/youth/queries/submit
Body: Valid payment dispute
Expected: 201 Created with query_id
```

---

## Appendix A: Sample Use Cases

### Use Case 1: Youth Checks Today's Earnings
```
User: Michelle (KAY1278MK)
Action: Opens payment page
Request: GET /api/v1/youth/KAY1278MK/payment/breakdown?period=current
Display: Shows today's POIs (12), quality (95.5%), estimated earnings (750 KES)
```

### Use Case 2: Youth Views Ranking
```
User: Denis (KAY2544DG)
Action: Opens performance tab
Request: GET /api/v1/youth/KAY2544DG/performance?scope=settlement
Display: Rank #1 in Kayole Soweto, 99.1% overall score, leaderboard
```

### Use Case 3: Youth Submits Payment Dispute
```
User: Michelle (KAY1278MK)
Action: Clicks "Report Issue" in resolve center
Request: POST /api/v1/youth/queries/submit with payment_dispute category
Display: Confirmation with ticket number SC-MM-1234
```

### Use Case 4: Youth Checks Query Status
```
User: Michelle (KAY1278MK)
Action: Opens resolve center history
Request: GET /api/v1/youth/KAY1278MK/queries
Display: List of queries with statuses, shows resolved dispute with admin response
```

---

## Appendix B: Data Calculation Logic

### Quality Score Calculation
```
quality_score = (
  (completeness_score × 0.4) +
  (accuracy_score × 0.4) +
  (timeliness_score × 0.2)
) × 100

Where:
- completeness_score: % of required fields filled
- accuracy_score: % of fields passing validation
- timeliness_score: submission within expected timeframe
```

### Overall Performance Score
```
overall_score = (
  (quality_score × 0.7) +
  (attendance_rate × 0.3)
)
```

### Leaderboard Ranking
```
Sorted by: overall_score (descending)
Tiebreaker: total_pois_submitted (descending)
Second tiebreaker: earliest_submission_date (ascending)
```

---

## Contact & Support

### Questions About This Specification
- **Email:** tech@spatialcollective.co.ke
- **System:** SC Learning Platform Team

### Implementation Timeline
- **Required by:** February 15, 2026
- **Testing period:** February 16-20, 2026
- **Go-live:** February 21, 2026

### API Key Setup
Please provide API credentials for:
- **Staging environment:** test.app.spatialcollective.com
- **Production environment:** app.spatialcollective.com

---

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Status:** Awaiting DPW Manager Team Implementation  
**Next Steps:** DPW team reviews and provides implementation timeline

# Spatial Collective Email API

REST API for fetching emails from domain mailboxes (`@spatialcollective.co.ke`).

## Base URL
```
https://email-api.spatialcollective.co.ke/api
```

## Authentication
All endpoints (except `/health`) require an API key header:
```
X-API-Key: 06682c28d538516b9920423822798612
```

## Endpoints

### Health Check
```http
GET /api/health
```
No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "service": "Spatial Collective Email API",
  "timestamp": "2026-01-12T20:19:31.261887"
}
```

---

### Get Emails
Fetch emails from a user's mailbox.

```http
POST /api/emails
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "email": "user@spatialcollective.co.ke",
  "password": "user_email_password",
  "folder": "INBOX",     // optional, default: INBOX
  "limit": 20,           // optional, default: 20, max: 100
  "unread_only": false   // optional, default: false
}
```

**Response:**
```json
{
  "success": true,
  "folder": "INBOX",
  "total": 5,
  "emails": [
    {
      "id": "123",
      "from": "noreply@spatialcollective.co.ke",
      "to": "user@spatialcollective.co.ke",
      "subject": "Welcome to Tasking Manager",
      "date": "2026-01-12T15:30:00+03:00",
      "is_read": false,
      "preview": "Welcome to Spatial Collective Tasking Manager..."
    }
  ]
}
```

---

### Get Single Email (Full Content)
```http
POST /api/email/{email_id}
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "email": "user@spatialcollective.co.ke",
  "password": "user_email_password",
  "folder": "INBOX"
}
```

**Response:**
```json
{
  "success": true,
  "email": {
    "id": "123",
    "from": "noreply@spatialcollective.co.ke",
    "to": "user@spatialcollective.co.ke",
    "cc": "",
    "subject": "Welcome to Tasking Manager",
    "date": "2026-01-12T15:30:00+03:00",
    "body": "Full email body content...",
    "attachments": [
      {
        "filename": "document.pdf",
        "content_type": "application/pdf",
        "size": 12345
      }
    ]
  }
}
```

---

### Get Folder List
```http
POST /api/folders
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "email": "user@spatialcollective.co.ke",
  "password": "user_email_password"
}
```

**Response:**
```json
{
  "success": true,
  "folders": ["INBOX", "Sent", "Drafts", "Trash", "Junk"]
}
```

---

### Get Unread Count
```http
POST /api/unread-count
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

**Request Body:**
```json
{
  "email": "user@spatialcollective.co.ke",
  "password": "user_email_password",
  "folder": "INBOX"
}
```

**Response:**
```json
{
  "success": true,
  "folder": "INBOX",
  "unread_count": 3
}
```

---

## JavaScript Example (for learn.spatialcollective.co.ke)

```javascript
const EMAIL_API_URL = 'https://email-api.spatialcollective.co.ke/api';
const API_KEY = '06682c28d538516b9920423822798612';

async function fetchUserEmails(userEmail, userPassword) {
  try {
    const response = await fetch(`${EMAIL_API_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        limit: 20,
        unread_only: false
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.emails;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    throw error;
  }
}

async function getUnreadCount(userEmail, userPassword) {
  const response = await fetch(`${EMAIL_API_URL}/unread-count`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      email: userEmail,
      password: userPassword
    })
  });
  
  const data = await response.json();
  return data.unread_count || 0;
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Missing required fields |
| 401 | Unauthorized - Invalid API key or email credentials |
| 404 | Not Found - Email not found |
| 500 | Server Error |

**Error Response Format:**
```json
{
  "error": "Error description"
}
```

---

## Setup Required

### 1. Add DNS Record
Add an A record in Cloudflare:
```
email-api.spatialcollective.co.ke -> 169.255.58.54
```

### 2. Get SSL Certificate
```bash
sudo certbot certonly --webroot -w /var/www/html -d email-api.spatialcollective.co.ke
```

### 3. Enable Nginx config
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Security Notes

1. **API Key**: Keep the API key secure. Only share with your dashboard backend.
2. **User Credentials**: The API requires user email passwords for authentication.
3. **CORS**: Only requests from `learn.spatialcollective.co.ke` are allowed.
4. **SSL**: Always use HTTPS in production.

---

## Service Management

```bash
# Check status
sudo systemctl status email-api

# Restart
sudo systemctl restart email-api

# View logs
sudo journalctl -u email-api -f
```

### Account List

| Username | Name | Email |
|----------|------|-------|
| KAY1498DO | David Ouma | kay1498do@spatialcollective.co.ke |
| KAY1154SO | Steven Odhiambo | kay1154so@spatialcollective.co.ke |
| KAY2579JN | Jane Njuguna | kay2579jn@spatialcollective.co.ke |
| KAY129SL | Selina Lipukah | kay129sl@spatialcollective.co.ke |
| KAY2603GK | Gilbert Karigo | kay2603gk@spatialcollective.co.ke |
| KAY1725LK | Lynn Waweru | kay1725lk@spatialcollective.co.ke |
| KAR115SO | Sophie Gesare | kar115so@spatialcollective.co.ke |
| KAR268SM | Samuel Matheka | kar268sm@spatialcollective.co.ke |
| KAR399JM | Josephat Mwanthi | kar399jm@spatialcollective.co.ke |
| KAR119BN | Bill Njiru | kar119bn@spatialcollective.co.ke |
| KAR078KM | Kelvin Mulela | kar078km@spatialcollective.co.ke |
| KAR225CT | Charity Titus | kar225ct@spatialcollective.co.ke |
| KAR083JK | Joel Kihuria | kar083jk@spatialcollective.co.ke |
| KAR327EM | Eddis Maina | kar327em@spatialcollective.co.ke |
| KAR339PM | Peter Muia | kar339pm@spatialcollective.co.ke |
| KAR187SM | Samuel Mutuku | kar187sm@spatialcollective.co.ke |
| KAR322FK | Festus Kaluki | kar322fk@spatialcollective.co.ke |
| KAR298DK | Diana Kasyula | kar298dk@spatialcollective.co.ke |
| KAR369JJ | Jeremiah James | kar369jj@spatialcollective.co.ke |
| KAR158KK | Kelvin Kinyatta | kar158kk@spatialcollective.co.ke |
| HUR455MM | Martin Mbugua | hur455mm@spatialcollective.co.ke |
| HUR801DN | Dennis Njuguna | hur801dn@spatialcollective.co.ke |
| HUR765JN | John Ngigi | hur765jn@spatialcollective.co.ke |
| HUR185RN | Richard Njuguna | hur185rn@spatialcollective.co.ke |
| HUR756SD | Somo Duba | hur756sd@spatialcollective.co.ke |
| HUR768SW | Stephen Wanjiru | hur768sw@spatialcollective.co.ke |
| KAY2714DV | Doreen Vutiti | kay2714dv@spatialcollective.co.ke |
| KAY2705AO | Austine Ongonga | kay2705ao@spatialcollective.co.ke |
| KAY2333OO | Oketch Ochieng | kay2333oo@spatialcollective.co.ke |
| KAY1395MO | Mercy Moraa | kay1395mo@spatialcollective.co.ke |
| KAY251BK | Brian Karani | kay251bk@spatialcollective.co.ke |
| KAY2391LN | Lilian Naliaka | kay2391ln@spatialcollective.co.ke |
| KAY2284SM | Selah Muema | kay2284sm@spatialcollective.co.ke |
| KAY209BM | Ben Mutua | kay209bm@spatialcollective.co.ke |
| KAY2805JK | Joe Kimani | kay2805jk@spatialcollective.co.ke |
| HUR728CM | Catherine Mararo | hur728cm@spatialcollective.co.ke |
| HUR777BW | Beatrice Wanjiru | hur777bw@spatialcollective.co.ke |
| HUR715CW | Charles Waithira | hur715cw@spatialcollective.co.ke |
| KAR405DM | Denis Musau | kar405dm@spatialcollective.co.ke |

---

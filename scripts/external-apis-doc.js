/**
 * External APIs Documentation for Spatial Collective Learn Platform
 * 
 * This document identifies all external API dependencies used in the codebase.
 */

const EXTERNAL_APIS = {
  // ============================================
  // 1. OPENSTREETMAP API
  // ============================================
  osm: {
    name: 'OpenStreetMap API (Private Instance)',
    baseUrl: process.env.NEXT_PUBLIC_OSM_SERVER_URL || 'https://api.openstreetmap.org',
    endpoints: [
      {
        path: '/api/0.6/changesets',
        method: 'GET',
        description: 'Fetch user changesets for building count',
        params: ['user', 'time', 'closed'],
        rateLimit: '1 request per second'
      },
      {
        path: '/api/0.6/changeset/{id}/download',
        method: 'GET',
        description: 'Download changeset diff to count buildings',
        rateLimit: '1 request per second'
      }
    ],
    usedIn: [
      'src/lib/osm-service.ts',
      'src/app/api/work/stats/daily/route.ts',
      'src/app/api/work/stats/refresh/route.ts'
    ],
    authentication: 'None (public API)',
    rateLimiting: 'Built-in rate limiting with 1s delays',
    caching: 'Redis (5 min TTL) + Memory fallback'
  },

  // ============================================
  // 2. EMAIL API
  // ============================================
  email: {
    name: 'Spatial Collective Email API',
    baseUrl: process.env.EMAIL_API_URL || 'https://tasks.spatialcollective.co.ke/email-api',
    endpoints: [
      {
        path: '/emails',
        method: 'GET',
        description: 'Fetch user email inbox',
        params: ['folder', 'limit', 'offset']
      },
      {
        path: '/email/{id}',
        method: 'GET',
        description: 'Fetch single email content'
      },
      {
        path: '/unread-count',
        method: 'GET',
        description: 'Get unread email count'
      },
      {
        path: '/folders',
        method: 'GET',
        description: 'Get available email folders'
      }
    ],
    usedIn: [
      'src/app/api/messages/inbox/route.ts',
      'src/app/api/messages/[id]/route.ts',
      'src/app/api/messages/unread-count/route.ts',
      'src/app/api/messages/folders/route.ts'
    ],
    authentication: {
      type: 'Basic Auth via API Key',
      apiKey: 'EMAIL_API_KEY environment variable',
      userCredentials: 'work_email + youth_id (as password)'
    }
  },

  // ============================================
  // 3. HOT TASKING MANAGER
  // ============================================
  hotTm: {
    name: 'HOT Tasking Manager',
    baseUrl: 'https://tasks.hotosm.org',
    usage: 'Referenced in training materials for task selection',
    usedIn: [
      'src/data/mapper-training.ts'
    ],
    authentication: 'OAuth via OSM account',
    note: 'Not directly called - users access manually'
  },

  // ============================================
  // 4. REDIS (OPTIONAL CACHING)
  // ============================================
  redis: {
    name: 'Redis Cache',
    connectionUrl: process.env.REDIS_URL,
    purpose: 'Caching OSM API responses to prevent rate limiting',
    usedIn: [
      'src/lib/osm-service.ts'
    ],
    fallback: 'In-memory Map cache if Redis unavailable',
    ttl: '5 minutes'
  },

  // ============================================
  // 5. NEON POSTGRESQL (Primary Database)
  // ============================================
  database: {
    name: 'Neon PostgreSQL (Serverless)',
    connectionUrl: 'DATABASE_URL or POSTGRES_URL_NON_POOLING',
    usedIn: [
      'src/app/api/_lib/database.ts',
      'src/lib/db.ts',
      'api/src/config/database.ts'
    ],
    poolConfig: {
      max: 10,
      idleTimeout: 30000,
      connectionTimeout: 10000
    }
  }
};

// ============================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',           // Neon PostgreSQL connection string
  'JWT_SECRET',             // Token signing secret (min 32 chars)
  'NEXT_PUBLIC_OSM_SERVER_URL', // OSM API base URL
];

const OPTIONAL_ENV_VARS = [
  'REDIS_URL',              // Redis connection for caching
  'EMAIL_API_URL',          // Email service base URL
  'EMAIL_API_KEY',          // Email API authentication key
  'DB_POOL_MAX',            // Database pool size (default: 10)
  'JWT_EXPIRES_IN',         // Token expiry (default: 24h)
];

// Export for documentation
module.exports = {
  EXTERNAL_APIS,
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS
};

// If run directly, print summary
if (require.main === module) {
  console.log('🌐 EXTERNAL API DEPENDENCIES');
  console.log('='.repeat(50));
  
  Object.entries(EXTERNAL_APIS).forEach(([key, api]) => {
    console.log(`\n📡 ${api.name}`);
    console.log(`   Base URL: ${api.baseUrl || 'N/A'}`);
    if (api.endpoints) {
      console.log(`   Endpoints: ${api.endpoints.length}`);
      api.endpoints.forEach(ep => {
        console.log(`     - ${ep.method} ${ep.path}`);
      });
    }
    console.log(`   Used in: ${api.usedIn?.length || 0} files`);
  });
  
  console.log('\n\n🔑 REQUIRED ENVIRONMENT VARIABLES');
  console.log('='.repeat(50));
  REQUIRED_ENV_VARS.forEach(v => console.log(`   - ${v}`));
  
  console.log('\n📋 OPTIONAL ENVIRONMENT VARIABLES');
  console.log('='.repeat(50));
  OPTIONAL_ENV_VARS.forEach(v => console.log(`   - ${v}`));
}

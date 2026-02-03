/**
 * Mock DPW API Server for Testing
 * Returns mock data matching DPW API spec for mobile mapping features
 * 
 * Start with: node scripts/mock-dpw-server.js
 * Port: 3002
 */

const http = require('http');
const url = require('url');

const PORT = 3002;

// Mock data
const MOCK_YOUTH_DATA = {
  'KAY2544DG': {
    settlement: 'Kayole Soweto',
    work_days: 4,
    total_pois: 180,
    avg_quality: 95.5,
    rank: 3,
  },
  'KAR008CM': {
    settlement: 'Kariobangi Machakos',
    work_days: 2,
    total_pois: 76,
    avg_quality: 87.2,
    rank: 15,
  },
  'HUR792SW': {
    settlement: 'Mji wa Huruma',
    work_days: 0,
    total_pois: 0,
    avg_quality: 0,
    rank: 999,
  },
};

function generatePaymentData(youthId) {
  const youth = MOCK_YOUTH_DATA[youthId];
  if (!youth) {
    return {
      success: false,
      error: {
        code: 'YOUTH_NOT_FOUND',
        message: `Youth ${youthId} not found in system`,
      },
    };
  }

  const dailyBreakdown = [];
  for (let i = 0; i < youth.work_days; i++) {
    const date = new Date('2026-01-15');
    date.setDate(date.getDate() + i);
    
    const poisSubmitted = 40 + Math.floor(Math.random() * 20);
    const qualityScore = 85 + Math.random() * 15;
    const basePay = 760;
    let qualityBonus = 0;
    
    if (qualityScore >= 90) qualityBonus = 228;
    else if (qualityScore >= 70) qualityBonus = 152;
    else if (qualityScore >= 60) qualityBonus = 76;
    
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0],
      pois_submitted: poisSubmitted,
      quality_score: Number(qualityScore.toFixed(1)),
      base_pay: basePay,
      quality_bonus: qualityBonus,
      earnings: basePay + qualityBonus,
    });
  }

  return {
    success: true,
    data: {
      youth_id: youthId,
      settlement: youth.settlement,
      total_earnings: dailyBreakdown.reduce((sum, day) => sum + day.earnings, 0),
      work_days_completed: youth.work_days,
      daily_breakdown: dailyBreakdown,
      payment_formula: {
        base_pay: 760,
        quality_bonus_tiers: {
          excellent: { min: 90, rate: 0.30, amount: 228 },
          good: { min: 70, rate: 0.20, amount: 152 },
          fair: { min: 60, rate: 0.10, amount: 76 },
        },
        daily_target_pois: 10,
      },
      message: youth.work_days === 0 ? 'No payment data available yet. Submit ODK forms to start earning!' : undefined,
      last_updated: new Date().toISOString(),
      sync_status: 'synced',
    },
  };
}

function generatePerformanceData(youthId) {
  const youth = MOCK_YOUTH_DATA[youthId];
  if (!youth) {
    return {
      success: false,
      error: {
        code: 'YOUTH_NOT_FOUND',
        message: `Youth ${youthId} not found in system`,
      },
    };
  }

  const attendanceRate = youth.work_days > 0 ? (youth.work_days / 20) * 100 : 0;
  const overallScore = (youth.avg_quality * 0.7) + (attendanceRate * 0.3);

  const top10 = [
    { rank: 1, youth_id: 'KAY1234XX', overall_score: 97.2, quality_score: 96.5, attendance_rate: 100, total_pois: 210 },
    { rank: 2, youth_id: 'KAY5678YY', overall_score: 95.8, quality_score: 95.2, attendance_rate: 98, total_pois: 195 },
    { rank: 3, youth_id: youthId, overall_score: overallScore, quality_score: youth.avg_quality, attendance_rate: attendanceRate, total_pois: youth.total_pois },
  ];

  return {
    success: true,
    data: {
      youth_id: youthId,
      settlement: youth.settlement,
      personal_metrics: {
        quality_score: youth.avg_quality,
        attendance_rate: attendanceRate,
        total_pois_submitted: youth.total_pois,
        avg_pois_per_day: youth.work_days > 0 ? youth.total_pois / youth.work_days : 0,
        overall_score: overallScore,
      },
      settlement_ranking: {
        settlement: youth.settlement,
        total_participants: 95,
        youth_rank: youth.rank,
        top_10: top10,
      },
      last_updated: new Date().toISOString(),
      sync_status: 'synced',
    },
  };
}

function generateQueriesData(youthId) {
  return {
    success: true,
    data: {
      youth_id: youthId,
      settlement: MOCK_YOUTH_DATA[youthId]?.settlement || 'Unknown',
      total_queries: 2,
      pending_queries: 1,
      queries: [
        {
          query_id: 'QRY-2026-01-20-001',
          category: 'payment',
          subject: 'Missing quality bonus for Jan 15',
          message: 'I had 95% quality but only received base pay.',
          priority: 'high',
          status: 'pending',
          submitted_at: '2026-01-20T10:30:00Z',
          attachments: [],
          messages: [],
        },
        {
          query_id: 'QRY-2026-01-18-002',
          category: 'technical',
          subject: 'ODK app crash',
          message: 'App crashes when submitting large forms.',
          priority: 'medium',
          status: 'resolved',
          submitted_at: '2026-01-18T14:15:00Z',
          resolved_at: '2026-01-19T09:00:00Z',
          resolution_notes: 'Issue fixed in ODK app version 2024.1.2. Please update.',
          attachments: [],
          messages: [
            { message_id: '1', sender: 'youth', message: 'App crashes when submitting large forms.', timestamp: '2026-01-18T14:15:00Z' },
            { message_id: '2', sender: 'admin', message: 'We are investigating this issue. Thank you for reporting.', timestamp: '2026-01-18T16:00:00Z' },
          ],
        },
      ],
    },
  };
}

function handleQuerySubmit(body) {
  return {
    success: true,
    data: {
      query_id: `QRY-2026-02-03-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      message: 'Query submitted successfully. You will receive a response within 24 hours.',
      submitted_at: new Date().toISOString(),
    },
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== '806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  // Route: GET /api/v1/youth/:youth_id/payment/breakdown
  const paymentMatch = pathname.match(/^\/api\/v1\/youth\/([A-Z0-9]+)\/payment\/breakdown$/);
  if (paymentMatch && req.method === 'GET') {
    const youthId = paymentMatch[1];
    const response = generatePaymentData(youthId);
    res.writeHead(response.success ? 200 : 404);
    res.end(JSON.stringify(response));
    return;
  }

  // Route: GET /api/v1/youth/:youth_id/performance
  const performanceMatch = pathname.match(/^\/api\/v1\/youth\/([A-Z0-9]+)\/performance$/);
  if (performanceMatch && req.method === 'GET') {
    const youthId = performanceMatch[1];
    const response = generatePerformanceData(youthId);
    res.writeHead(response.success ? 200 : 404);
    res.end(JSON.stringify(response));
    return;
  }

  // Route: GET /api/v1/youth/:youth_id/queries
  const queriesMatch = pathname.match(/^\/api\/v1\/youth\/([A-Z0-9]+)\/queries$/);
  if (queriesMatch && req.method === 'GET') {
    const youthId = queriesMatch[1];
    const response = generateQueriesData(youthId);
    res.writeHead(200);
    res.end(JSON.stringify(response));
    return;
  }

  // Route: POST /api/v1/youth/queries/submit
  if (pathname === '/api/v1/youth/queries/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const response = handleQuerySubmit(data);
        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }));
      }
    });
    return;
  }

  // 404 - Not Found
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
});

server.listen(PORT, () => {
  console.log(`🎭 Mock DPW API Server running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/v1/youth/{youth_id}/payment/breakdown`);
  console.log(`  GET  /api/v1/youth/{youth_id}/performance`);
  console.log(`  GET  /api/v1/youth/{youth_id}/queries`);
  console.log(`  POST /api/v1/youth/queries/submit`);
  console.log(`\nAPI Key: 806920718fb09a005ce0672fb9cf202995ef4c42e4b7582db7c5e15881d29bd3`);
  console.log(`\nMock youth IDs: KAY2544DG, KAR008CM, HUR792SW`);
});

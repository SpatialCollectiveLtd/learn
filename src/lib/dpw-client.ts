import type {
  ApiResponse,
  UserProfile,
  AdminProfile,
  UserListResponse,
  AttendanceResponse,
  PerformanceResponse,
  PaymentsResponseV4,
  Settlement,
  Module,
  Trainer,
} from '@/app/api/_lib/types';

const DPW_API_URL = process.env.DPW_API_URL || process.env.DPW_MANAGER_BASE_URL;
const DPW_API_SECRET = process.env.DPW_API_SECRET || process.env.DPW_MANAGER_API_KEY;

// Simple in-memory cache for reference data (60s TTL)
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number = 60_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

class DpwClientError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'DpwClientError';
  }
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/**
 * Authenticated fetch to DPW App API.
 * All calls use the server-to-server shared secret.
 * Implements exponential backoff on 429 (rate limit) responses per DPW handoff.
 */
async function dpwFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!DPW_API_URL) throw new Error('DPW_API_URL environment variable is not configured');
  if (!DPW_API_SECRET) throw new Error('DPW_API_SECRET environment variable is not configured');

  const url = `${DPW_API_URL}${path}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DPW_API_SECRET}`,
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(10_000),
    });

    // Exponential backoff on 429
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get('retry-after');
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.success) {
      const error = !body.success ? body.error : { code: 'UNKNOWN', message: 'DPW API error' };
      throw new DpwClientError(response.status, error.code, error.message);
    }

    return body.data;
  }

  throw new DpwClientError(429, 'RATE_LIMITED', 'DPW API rate limit exceeded after retries');
}

// === Auth ===

export async function authenticateYouth(youthId: string): Promise<UserProfile> {
  return dpwFetch<UserProfile>('/api/learn/auth/youth', {
    method: 'POST',
    body: JSON.stringify({ youth_id: youthId }),
  });
}

export async function verifyLaunchToken(token: string): Promise<AdminProfile> {
  return dpwFetch<AdminProfile>('/api/learn/auth/verify-launch-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// === Users ===

export async function getUser(userId: string): Promise<UserProfile> {
  return dpwFetch<UserProfile>(`/api/learn/users/${encodeURIComponent(userId)}`);
}

export async function listUsers(params: Record<string, string> = {}): Promise<UserListResponse> {
  const qs = new URLSearchParams(params).toString();
  return dpwFetch<UserListResponse>(`/api/learn/users${qs ? `?${qs}` : ''}`);
}

// === Attendance ===

export async function getUserAttendance(
  userId: string,
  from?: string,
  to?: string
): Promise<AttendanceResponse> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return dpwFetch<AttendanceResponse>(
    `/api/learn/users/${encodeURIComponent(userId)}/attendance${qs ? `?${qs}` : ''}`
  );
}

// === Performance ===

export async function getUserPerformance(userId: string): Promise<PerformanceResponse> {
  return dpwFetch<PerformanceResponse>(
    `/api/learn/users/${encodeURIComponent(userId)}/performance`
  );
}

// === Payments ===

export async function getUserPayments(
  userId: string,
  opts?: { from?: string; to?: string }
): Promise<PaymentsResponseV4> {
  const params = new URLSearchParams();
  if (opts?.from) params.set('from', opts.from);
  if (opts?.to) params.set('to', opts.to);
  const qs = params.toString();
  return dpwFetch<PaymentsResponseV4>(
    `/api/learn/users/${encodeURIComponent(userId)}/payments${qs ? `?${qs}` : ''}`
  );
}

// === Reference Data (cached) ===

export async function getSettlements(): Promise<Settlement[]> {
  const cached = getCached<Settlement[]>('settlements');
  if (cached) return cached;
  const data = await dpwFetch<Settlement[]>('/api/learn/settlements');
  setCache('settlements', data);
  return data;
}

export async function getModules(): Promise<Module[]> {
  const cached = getCached<Module[]>('modules');
  if (cached) return cached;
  const data = await dpwFetch<Module[]>('/api/learn/modules');
  setCache('modules', data);
  return data;
}

export async function getTrainers(): Promise<Trainer[]> {
  const cached = getCached<Trainer[]>('trainers');
  if (cached) return cached;
  const data = await dpwFetch<Trainer[]>('/api/learn/trainers');
  setCache('trainers', data);
  return data;
}

export { DpwClientError };

// === Training Completion Webhook (Option B from handoff) ===

/**
 * Notify DPW that a user has completed all training steps for a module.
 * Fire-and-forget — logged but does not block the training progress response.
 */
export async function notifyDpwTrainingComplete(
  userId: string,
  moduleType: string,
  completedAt: string
): Promise<void> {
  try {
    await dpwFetch('/api/webhooks/learn/training-complete', {
      method: 'POST',
      body: JSON.stringify({
        event: 'training.module_completed',
        user_id: userId,
        module_type: moduleType,
        completed_at: completedAt,
        source: 'learn',
      }),
    });
  } catch (error) {
    // Log but don't fail the training progress response
    console.error(`Failed to notify DPW of training completion for ${userId}/${moduleType}:`, error);
  }
}

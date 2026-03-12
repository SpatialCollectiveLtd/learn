/**
 * Shared client-side helpers for youth frontend pages.
 * All youth pages should use these functions for auth, session reading,
 * and calling the supported API contracts.
 */

export interface YouthSession {
  token: string;
  userId: string;
  fullName: string;
  role: 'youth' | 'trainer' | 'admin';
  settlement: string | null;
  module: string | null;
  moduleAssignment: string | null;
  userType: 'youth' | 'staff';
}

/** Read the current youth session from localStorage. Returns null if absent or invalid. */
export function getYouthSession(): YouthSession | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  if (!token || !userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return { token, ...parsed } as YouthSession;
  } catch {
    return null;
  }
}

/** Clears all session keys and redirects to the login page. */
export function clearYouthSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userType');
}

/** Fetch wrapper that includes the youth Bearer token. */
async function youthFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface TrainingProgressData {
  progress: Record<string, number[]>;
  totalCompleted: number;
}

/** GET /api/training/progress — returns all module progress for the current user. */
export async function getTrainingProgress(token: string): Promise<TrainingProgressData | null> {
  try {
    const res = await youthFetch(token, '/api/training/progress');
    const data = await res.json();
    if (data.success) return data.data;
  } catch {
    // network error — caller handles null
  }
  return null;
}

/** POST /api/training/progress — records completion of a step. */
export async function markStepComplete(
  token: string,
  moduleType: string,
  stepId: number
): Promise<{ success: boolean; error?: string; missingStep?: number }> {
  try {
    const res = await youthFetch(token, '/api/training/progress', {
      method: 'POST',
      body: JSON.stringify({ moduleType, stepId }),
    });
    const data = await res.json();
    if (data.success) return { success: true };
    return {
      success: false,
      error: data.error?.message || 'Failed to mark step complete',
      missingStep: data.error?.missingStep,
    };
  } catch {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/** GET /api/youth/osm-username — fetches the current user's OSM username from Learn DB. */
export async function getOsmUsername(token: string): Promise<string | null> {
  try {
    const res = await youthFetch(token, '/api/youth/osm-username');
    const data = await res.json();
    if (data.success) return data.data.osmUsername;
  } catch {
    // silently fail
  }
  return null;
}

/** PUT /api/youth/osm-username — updates the current user's OSM username in Learn DB. */
export async function updateOsmUsername(
  token: string,
  osmUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await youthFetch(token, '/api/youth/osm-username', {
      method: 'PUT',
      body: JSON.stringify({ osmUsername }),
    });
    const data = await res.json();
    if (data.success) return { success: true };
    return { success: false, error: data.error?.message || 'Failed to save OSM username' };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

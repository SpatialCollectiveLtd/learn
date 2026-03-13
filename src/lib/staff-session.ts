export interface StaffSession {
  token: string;
  userId: string;
  fullName: string;
  email?: string | null;
  role: 'trainer' | 'admin';
  settlement: string | null;
  userType: 'staff';
  module: null;
  moduleAssignment: null;
}

interface StoredStaffUser {
  userId: string;
  fullName: string;
  email?: string | null;
  role: string;
  settlement: string | null;
}

function isStaffRole(role: string): role is StaffSession['role'] {
  return role === 'trainer' || role === 'admin';
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  if (!token || !userData) return null;

  try {
    const parsed = JSON.parse(userData) as StoredStaffUser;
    if (!isStaffRole(parsed.role)) return null;

    return {
      token,
      userId: parsed.userId,
      fullName: parsed.fullName,
      email: parsed.email ?? null,
      role: parsed.role,
      settlement: parsed.settlement ?? null,
      userType: 'staff',
      module: null,
      moduleAssignment: null,
    };
  } catch {
    return null;
  }
}

export function saveStaffSession(token: string, user: Omit<StaffSession, 'token'>): void {
  localStorage.setItem('token', token);
  localStorage.setItem('userData', JSON.stringify(user));
  localStorage.setItem('userType', 'staff');
}

export function clearStaffSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userType');
}
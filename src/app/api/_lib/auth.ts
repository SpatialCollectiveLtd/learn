import jwt from 'jsonwebtoken';
import type { LearnTokenPayload } from './types';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET;

function getSecret(): string {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured and at least 32 characters');
  }
  return JWT_SECRET;
}

/**
 * Verify a Learn JWT token. Works for both youth and staff tokens.
 * Returns the decoded payload with userId, role, etc.
 */
export function verifyToken(token: string): LearnTokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret()) as LearnTokenPayload;
    if (!decoded.userId || !decoded.role) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract and verify token from Authorization header.
 * Returns null if no valid token found.
 */
export function verifyAuthHeader(authHeader: string | null): LearnTokenPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(authHeader.substring(7));
  } catch {
    return null;
  }
}

/**
 * Sign a Learn JWT with the given payload.
 */
export function signToken(payload: LearnTokenPayload, expiresIn: string = '24h'): string {
  return jwt.sign(payload as object, getSecret(), { expiresIn } as jwt.SignOptions);
}

/**
 * Require a specific role. Returns true if the user has the required role.
 */
export function hasRole(token: LearnTokenPayload, ...roles: string[]): boolean {
  return roles.includes(token.role);
}

// Legacy aliases — these will be removed once all routes are migrated
export function verifyYouthToken(token: string): LearnTokenPayload {
  const decoded = verifyToken(token);
  return { ...decoded, youthId: decoded.userId } as any;
}

export function verifyStaffToken(token: string): LearnTokenPayload {
  const decoded = verifyToken(token);
  return { ...decoded, staffId: decoded.userId } as any;
}

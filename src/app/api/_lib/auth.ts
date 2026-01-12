import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify and decode a youth JWT token
 * @param token - JWT token string
 * @returns Decoded token payload with youthId
 * @throws Error if token is invalid or expired
 */
export function verifyYouthToken(token: string): { youthId: string; [key: string]: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode a staff JWT token
 * @param token - JWT token string
 * @returns Decoded token payload with staffId and role
 * @throws Error if token is invalid or expired
 */
export function verifyStaffToken(token: string): { staffId: string; role: string; [key: string]: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

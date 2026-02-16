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

/**
 * Sign and create a JWT token
 * @param payload - Token payload object
 * @param expiresIn - Token expiration (default: 24h)  
 * @returns Signed JWT token string
 */
export function signToken(payload: string | object | Buffer, expiresIn: string = '24h'): string {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Failed to sign token');
  }
}

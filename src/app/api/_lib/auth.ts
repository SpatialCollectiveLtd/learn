import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';


export function verifyYouthToken(token: string): { youthId: string; [key: string]: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}


export function verifyStaffToken(token: string): { staffId: string; role: string; [key: string]: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}


export function signToken(payload: string | object | Buffer, expiresIn: string = '24h'): string {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Failed to sign token');
  }
}

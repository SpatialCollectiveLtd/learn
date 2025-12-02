import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  youthId?: string;
  staffId?: string;
  programType?: string;
  role?: string;
  userType: 'youth' | 'staff';
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).userType = decoded.userType;

    if (decoded.youthId) {
      (req as any).youthId = decoded.youthId;
      (req as any).programType = decoded.programType;
    }

    if (decoded.staffId) {
      (req as any).staffId = decoded.staffId;
      (req as any).role = decoded.role;
    }

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to authenticate youth only
 */
export const authenticateYouth = (req: Request, res: Response, next: NextFunction): void => {
  authenticateToken(req, res, () => {
    if ((req as any).userType !== 'youth') {
      res.status(403).json({
        success: false,
        message: 'This endpoint is for youth only',
      });
      return;
    }
    next();
  });
};

/**
 * Middleware to authenticate staff only
 */
export const authenticateStaff = (req: Request, res: Response, next: NextFunction): void => {
  authenticateToken(req, res, () => {
    if ((req as any).userType !== 'staff') {
      res.status(403).json({
        success: false,
        message: 'This endpoint is for staff only',
      });
      return;
    }
    next();
  });
};

/**
 * Middleware to authenticate admin only
 */
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  authenticateStaff(req, res, () => {
    if ((req as any).role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'This endpoint is for administrators only',
      });
      return;
    }
    next();
  });
};

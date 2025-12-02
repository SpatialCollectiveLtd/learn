import { Request, Response } from 'express';
import { YouthModel } from '../models/YouthModel';
import { AuthLogModel } from '../models/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class YouthAuthController {
  /**
   * Authenticate youth by Youth ID
   */
  static async authenticate(req: Request, res: Response): Promise<void> {
    try {
      const { youthId } = req.body;

      if (!youthId) {
        res.status(400).json({
          success: false,
          message: 'Youth ID is required',
        });
        return;
      }

      // Validate format (YT followed by 3+ digits)
      const youthIdPattern = /^YT\d{3,}$/i;
      if (!youthIdPattern.test(youthId.toUpperCase())) {
        await AuthLogModel.log({
          userId: youthId,
          userType: 'youth',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Invalid Youth ID format',
        });

        res.status(400).json({
          success: false,
          message: 'Invalid Youth ID format. Youth ID should be in format: YT### (e.g., YT001)',
        });
        return;
      }

      // Find youth in database
      const youth = await YouthModel.findById(youthId.toUpperCase());

      if (!youth) {
        await AuthLogModel.log({
          userId: youthId.toUpperCase(),
          userType: 'youth',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Youth ID not found',
        });

        res.status(404).json({
          success: false,
          message: 'Youth ID not recognized. Please contact your program coordinator.',
        });
        return;
      }

      if (!youth.is_active) {
        await AuthLogModel.log({
          userId: youth.youth_id,
          userType: 'youth',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Youth account is inactive',
        });

        res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact your program coordinator.',
        });
        return;
      }

      // Update last login
      await YouthModel.updateLastLogin(youth.youth_id);

      // Check if youth has signed contract
      const hasContract = await YouthModel.hasSignedContract(youth.youth_id);

      // Generate JWT token
      // @ts-ignore - JWT types are overly strict about expiresIn
      const token: string = jwt.sign(
        {
          youthId: youth.youth_id,
          programType: youth.program_type,
          userType: 'youth',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful authentication
      await AuthLogModel.log({
        userId: youth.youth_id,
        userType: 'youth',
        action: 'login',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          youth: {
            youthId: youth.youth_id,
            fullName: youth.full_name,
            programType: youth.program_type,
            hasSignedContract: hasContract,
          },
        },
      });
    } catch (error) {
      console.error('Youth authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during authentication',
      });
    }
  }

  /**
   * Get youth profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const youthId = (req as any).youthId;

      const youthWithContract = await YouthModel.findWithContractStatus(youthId);

      if (!youthWithContract) {
        res.status(404).json({
          success: false,
          message: 'Youth not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: youthWithContract,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching profile',
      });
    }
  }

  /**
   * Verify token
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const youthId = (req as any).youthId;

      res.status(200).json({
        success: true,
        data: {
          youthId,
          valid: true,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  }
}

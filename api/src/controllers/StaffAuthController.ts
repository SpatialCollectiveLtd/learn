import { Request, Response } from 'express';
import { StaffModel } from '../models/StaffModel';
import { AuthLogModel } from '../models/AuthLogModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class StaffAuthController {
  /**
   * Authenticate staff by Staff ID
   */
  static async authenticate(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.body;

      if (!staffId) {
        res.status(400).json({
          success: false,
          message: 'Staff ID is required',
        });
        return;
      }

      // Validate format (SC followed by 3+ digits)
      const staffIdPattern = /^SC\d{3,}$/i;
      if (!staffIdPattern.test(staffId.toUpperCase())) {
        await AuthLogModel.log({
          userId: staffId,
          userType: 'staff',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Invalid Staff ID format',
        });

        res.status(400).json({
          success: false,
          message: 'Invalid Staff ID format. Staff ID should be in format: SC### (e.g., SC001)',
        });
        return;
      }

      // Find staff in database
      const staff = await StaffModel.findById(staffId.toUpperCase());

      if (!staff) {
        await AuthLogModel.log({
          userId: staffId.toUpperCase(),
          userType: 'staff',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Staff ID not found',
        });

        res.status(404).json({
          success: false,
          message: 'Staff ID not recognized. Please contact your administrator to register your Staff ID.',
        });
        return;
      }

      if (!staff.is_active) {
        await AuthLogModel.log({
          userId: staff.staff_id,
          userType: 'staff',
          action: 'login',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: 'Staff account is inactive',
        });

        res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact your administrator.',
        });
        return;
      }

      // Update last login
      await StaffModel.updateLastLogin(staff.staff_id);

      // Generate JWT token
      // @ts-ignore - JWT types are overly strict about expiresIn
      const token: string = jwt.sign(
        {
          staffId: staff.staff_id,
          role: staff.role,
          userType: 'staff',
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful authentication
      await AuthLogModel.log({
        userId: staff.staff_id,
        userType: 'staff',
        action: 'login',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful. Welcome to Validator Training.',
        data: {
          token,
          staff: {
            staffId: staff.staff_id,
            fullName: staff.full_name,
            role: staff.role,
          },
        },
      });
    } catch (error) {
      console.error('Staff authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during authentication',
      });
    }
  }

  /**
   * Get all staff members (admin only)
   */
  static async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      const staff = await StaffModel.findAll();

      res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (error) {
      console.error('Get all staff error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching staff',
      });
    }
  }

  /**
   * Register new staff member (admin only)
   */
  static async registerStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, fullName, email, role } = req.body;

      // Validate required fields
      if (!staffId || !fullName || !role) {
        res.status(400).json({
          success: false,
          message: 'Staff ID, full name, and role are required',
        });
        return;
      }

      // Validate format
      const staffIdPattern = /^SC\d{3,}$/i;
      if (!staffIdPattern.test(staffId.toUpperCase())) {
        res.status(400).json({
          success: false,
          message: 'Invalid Staff ID format. Use format: SC### (e.g., SC001)',
        });
        return;
      }

      // Check if already exists
      const existing = await StaffModel.findById(staffId.toUpperCase());
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'Staff ID already registered',
        });
        return;
      }

      // Create staff member
      const staff = await StaffModel.create({
        staffId: staffId.toUpperCase(),
        fullName,
        email,
        role,
      });

      res.status(201).json({
        success: true,
        message: `Staff ID ${staff.staff_id} registered successfully for ${staff.full_name}`,
        data: staff,
      });
    } catch (error) {
      console.error('Register staff error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while registering staff',
      });
    }
  }

  /**
   * Deactivate staff member (admin only)
   */
  static async deactivateStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId } = req.params;

      const staff = await StaffModel.findById(staffId.toUpperCase());
      if (!staff) {
        res.status(404).json({
          success: false,
          message: 'Staff not found',
        });
        return;
      }

      await StaffModel.deactivate(staffId.toUpperCase());

      res.status(200).json({
        success: true,
        message: `Staff ID ${staffId.toUpperCase()} has been deactivated`,
      });
    } catch (error) {
      console.error('Deactivate staff error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while deactivating staff',
      });
    }
  }
}

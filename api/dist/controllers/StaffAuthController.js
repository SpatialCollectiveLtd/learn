"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffAuthController = void 0;
const StaffModel_1 = require("../models/StaffModel");
const AuthLogModel_1 = require("../models/AuthLogModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
class StaffAuthController {
    static async authenticate(req, res) {
        try {
            const { staffId } = req.body;
            if (!staffId) {
                res.status(400).json({
                    success: false,
                    message: 'Staff ID is required',
                });
                return;
            }
            const staffIdPattern = /^SC\d{3,}$/i;
            if (!staffIdPattern.test(staffId.toUpperCase())) {
                await AuthLogModel_1.AuthLogModel.log({
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
            const staff = await StaffModel_1.StaffModel.findById(staffId.toUpperCase());
            if (!staff) {
                await AuthLogModel_1.AuthLogModel.log({
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
                await AuthLogModel_1.AuthLogModel.log({
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
            await StaffModel_1.StaffModel.updateLastLogin(staff.staff_id);
            const token = jsonwebtoken_1.default.sign({
                staffId: staff.staff_id,
                role: staff.role,
                userType: 'staff',
            }, JWT_SECRET, { expiresIn: '24h' });
            await AuthLogModel_1.AuthLogModel.log({
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
        }
        catch (error) {
            console.error('Staff authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred during authentication',
            });
        }
    }
    static async getAllStaff(req, res) {
        try {
            const staff = await StaffModel_1.StaffModel.findAll();
            res.status(200).json({
                success: true,
                data: staff,
            });
        }
        catch (error) {
            console.error('Get all staff error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching staff',
            });
        }
    }
    static async registerStaff(req, res) {
        try {
            const { staffId, fullName, email, role } = req.body;
            if (!staffId || !fullName || !role) {
                res.status(400).json({
                    success: false,
                    message: 'Staff ID, full name, and role are required',
                });
                return;
            }
            const staffIdPattern = /^SC\d{3,}$/i;
            if (!staffIdPattern.test(staffId.toUpperCase())) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid Staff ID format. Use format: SC### (e.g., SC001)',
                });
                return;
            }
            const existing = await StaffModel_1.StaffModel.findById(staffId.toUpperCase());
            if (existing) {
                res.status(409).json({
                    success: false,
                    message: 'Staff ID already registered',
                });
                return;
            }
            const staff = await StaffModel_1.StaffModel.create({
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
        }
        catch (error) {
            console.error('Register staff error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while registering staff',
            });
        }
    }
    static async deactivateStaff(req, res) {
        try {
            const { staffId } = req.params;
            const staff = await StaffModel_1.StaffModel.findById(staffId.toUpperCase());
            if (!staff) {
                res.status(404).json({
                    success: false,
                    message: 'Staff not found',
                });
                return;
            }
            await StaffModel_1.StaffModel.deactivate(staffId.toUpperCase());
            res.status(200).json({
                success: true,
                message: `Staff ID ${staffId.toUpperCase()} has been deactivated`,
            });
        }
        catch (error) {
            console.error('Deactivate staff error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while deactivating staff',
            });
        }
    }
}
exports.StaffAuthController = StaffAuthController;
//# sourceMappingURL=StaffAuthController.js.map
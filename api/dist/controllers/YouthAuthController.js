"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouthAuthController = void 0;
const YouthModel_1 = require("../models/YouthModel");
const AuthLogModel_1 = require("../models/AuthLogModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
class YouthAuthController {
    static async authenticate(req, res) {
        try {
            const { youthId } = req.body;
            if (!youthId) {
                res.status(400).json({
                    success: false,
                    message: 'Youth ID is required',
                });
                return;
            }
            const youthIdPattern = /^YT\d{3,}$/i;
            if (!youthIdPattern.test(youthId.toUpperCase())) {
                await AuthLogModel_1.AuthLogModel.log({
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
            const youth = await YouthModel_1.YouthModel.findById(youthId.toUpperCase());
            if (!youth) {
                await AuthLogModel_1.AuthLogModel.log({
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
                await AuthLogModel_1.AuthLogModel.log({
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
            await YouthModel_1.YouthModel.updateLastLogin(youth.youth_id);
            const hasContract = await YouthModel_1.YouthModel.hasSignedContract(youth.youth_id);
            const token = jsonwebtoken_1.default.sign({
                youthId: youth.youth_id,
                programType: youth.program_type,
                userType: 'youth',
            }, JWT_SECRET, { expiresIn: '24h' });
            await AuthLogModel_1.AuthLogModel.log({
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
        }
        catch (error) {
            console.error('Youth authentication error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred during authentication',
            });
        }
    }
    static async getProfile(req, res) {
        try {
            const youthId = req.youthId;
            const youthWithContract = await YouthModel_1.YouthModel.findWithContractStatus(youthId);
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
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching profile',
            });
        }
    }
    static async verifyToken(req, res) {
        try {
            const youthId = req.youthId;
            res.status(200).json({
                success: true,
                data: {
                    youthId,
                    valid: true,
                },
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
    }
}
exports.YouthAuthController = YouthAuthController;
//# sourceMappingURL=YouthAuthController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateAdmin = exports.authenticateStaff = exports.authenticateYouth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token is required',
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userType = decoded.userType;
        if (decoded.youthId) {
            req.youthId = decoded.youthId;
            req.programType = decoded.programType;
        }
        if (decoded.staffId) {
            req.staffId = decoded.staffId;
            req.role = decoded.role;
        }
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateYouth = (req, res, next) => {
    (0, exports.authenticateToken)(req, res, () => {
        if (req.userType !== 'youth') {
            res.status(403).json({
                success: false,
                message: 'This endpoint is for youth only',
            });
            return;
        }
        next();
    });
};
exports.authenticateYouth = authenticateYouth;
const authenticateStaff = (req, res, next) => {
    (0, exports.authenticateToken)(req, res, () => {
        if (req.userType !== 'staff') {
            res.status(403).json({
                success: false,
                message: 'This endpoint is for staff only',
            });
            return;
        }
        next();
    });
};
exports.authenticateStaff = authenticateStaff;
const authenticateAdmin = (req, res, next) => {
    (0, exports.authenticateStaff)(req, res, () => {
        if (req.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'This endpoint is for administrators only',
            });
            return;
        }
        next();
    });
};
exports.authenticateAdmin = authenticateAdmin;
//# sourceMappingURL=auth.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLogModel = void 0;
const database_1 = require("../config/database");
class AuthLogModel {
    static async log(data) {
        await database_1.Database.query(`INSERT INTO auth_logs (user_identifier, user_type, success, ip_address, user_agent, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`, [
            data.userId,
            data.userType,
            data.success,
            data.ipAddress || null,
            data.userAgent || null,
            data.errorMessage || null,
        ]);
    }
    static async getUserLogs(userId, limit = 50) {
        const result = await database_1.Database.query(`SELECT * FROM auth_logs 
       WHERE user_identifier = $1 
       ORDER BY created_at DESC 
       LIMIT $2`, [userId, limit]);
        return result.rows;
    }
    static async getAllLogs(limit = 100) {
        const result = await database_1.Database.query(`SELECT * FROM auth_logs 
       ORDER BY created_at DESC 
       LIMIT $1`, [limit]);
        return result.rows;
    }
    static async getFailedAttempts(userId, minutes = 15) {
        const result = await database_1.Database.query(`SELECT COUNT(*) as count FROM auth_logs 
       WHERE user_id = $1 
       AND success = FALSE 
       AND action = 'login'
       AND created_at > NOW() - INTERVAL '${minutes} minutes'`, [userId]);
        return parseInt(result.rows[0]?.count || '0');
    }
}
exports.AuthLogModel = AuthLogModel;
//# sourceMappingURL=AuthLogModel.js.map
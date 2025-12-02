"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffModel = void 0;
const database_1 = require("../config/database");
class StaffModel {
    static async findById(staffId) {
        const result = await database_1.Database.query('SELECT * FROM staff_members WHERE staff_id = $1', [staffId]);
        return result.rows[0] || null;
    }
    static async findByEmail(email) {
        const result = await database_1.Database.query('SELECT * FROM staff_members WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    static async updateLastLogin(staffId) {
        await database_1.Database.query('UPDATE staff_members SET last_login = CURRENT_TIMESTAMP WHERE staff_id = $1', [staffId]);
    }
    static async create(data) {
        const result = await database_1.Database.query(`INSERT INTO staff_members (staff_id, full_name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [data.staffId, data.fullName, data.email || null, data.role]);
        return result.rows[0];
    }
    static async findAll() {
        const result = await database_1.Database.query('SELECT * FROM staff_members WHERE is_active = TRUE ORDER BY full_name');
        return result.rows;
    }
    static async deactivate(staffId) {
        await database_1.Database.query('UPDATE staff_members SET is_active = FALSE WHERE staff_id = $1', [staffId]);
    }
    static async isActive(staffId) {
        const result = await database_1.Database.query('SELECT is_active FROM staff_members WHERE staff_id = $1', [staffId]);
        return result.rows[0]?.is_active || false;
    }
}
exports.StaffModel = StaffModel;
//# sourceMappingURL=StaffModel.js.map
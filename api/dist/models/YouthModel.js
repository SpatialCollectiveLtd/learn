"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouthModel = void 0;
const database_1 = require("../config/database");
class YouthModel {
    static async findById(youthId) {
        const result = await database_1.Database.query('SELECT * FROM youth_participants WHERE youth_id = $1', [youthId]);
        return result.rows[0] || null;
    }
    static async findByEmail(email) {
        const result = await database_1.Database.query('SELECT * FROM youth_participants WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    static async findByProgramType(programType) {
        const result = await database_1.Database.query('SELECT * FROM youth_participants WHERE program_type = $1 AND is_active = TRUE ORDER BY full_name', [programType]);
        return result.rows;
    }
    static async findWithContractStatus(youthId) {
        const result = await database_1.Database.query('SELECT * FROM youth_contract_status WHERE youth_id = $1', [youthId]);
        return result.rows[0] || null;
    }
    static async hasSignedContract(youthId) {
        const result = await database_1.Database.query('SELECT has_signed_contract FROM youth_participants WHERE youth_id = $1', [youthId]);
        return result.rows[0]?.has_signed_contract || false;
    }
    static async updateLastLogin(youthId) {
        await database_1.Database.query('UPDATE youth_participants SET last_login = CURRENT_TIMESTAMP WHERE youth_id = $1', [youthId]);
    }
    static async create(data) {
        const result = await database_1.Database.query(`INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [data.youthId, data.fullName, data.email || null, data.phoneNumber || null, data.programType]);
        return result.rows[0];
    }
    static async findAll() {
        const result = await database_1.Database.query('SELECT * FROM youth_participants ORDER BY created_at DESC');
        return result.rows;
    }
    static async deactivate(youthId) {
        await database_1.Database.query('UPDATE youth_participants SET is_active = FALSE WHERE youth_id = $1', [youthId]);
    }
}
exports.YouthModel = YouthModel;
//# sourceMappingURL=YouthModel.js.map
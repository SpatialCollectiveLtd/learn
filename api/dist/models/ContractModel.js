"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractModel = void 0;
const database_1 = require("../config/database");
class ContractModel {
    static async getActiveTemplate(programType) {
        const result = await database_1.Database.query(`SELECT * FROM contract_templates 
       WHERE program_type = $1 AND is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 1`, [programType]);
        return result.rows[0] || null;
    }
    static async findById(templateId) {
        const result = await database_1.Database.query('SELECT * FROM contract_templates WHERE template_id = $1', [templateId]);
        return result.rows[0] || null;
    }
    static async createSignedContract(data) {
        const result = await database_1.Database.query(`INSERT INTO signed_contracts (youth_id, template_id, signature_data, ip_address, user_agent, pdf_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            data.youthId,
            data.templateId,
            data.signatureData,
            data.ipAddress || null,
            data.userAgent || null,
            data.pdfUrl || null,
        ]);
        return result.rows[0];
    }
    static async getSignedContract(youthId) {
        const result = await database_1.Database.query(`SELECT sc.*, ct.title, ct.version, ct.program_type, y.full_name as youth_name
       FROM signed_contracts sc
       JOIN contract_templates ct ON sc.template_id = ct.template_id
       JOIN youth_participants y ON sc.youth_id = y.youth_id
       WHERE sc.youth_id = $1 AND sc.is_valid = TRUE
       ORDER BY sc.signed_at DESC
       LIMIT 1`, [youthId]);
        return result.rows[0] || null;
    }
    static async getAllSignedContracts() {
        const result = await database_1.Database.query(`SELECT sc.*, ct.title, ct.version, ct.program_type, y.full_name as youth_name, y.email
       FROM signed_contracts sc
       JOIN contract_templates ct ON sc.template_id = ct.template_id
       JOIN youth_participants y ON sc.youth_id = y.youth_id
       WHERE sc.is_valid = TRUE
       ORDER BY sc.signed_at DESC`);
        return result.rows;
    }
    static async getStatistics() {
        const result = await database_1.Database.query('SELECT * FROM contract_statistics ORDER BY program_type');
        return result.rows;
    }
    static async invalidateContract(contractId, staffId, reason) {
        await database_1.Database.query(`UPDATE signed_contracts 
       SET is_valid = FALSE, invalidated_at = CURRENT_TIMESTAMP, 
           invalidated_by = $2, invalidation_reason = $3
       WHERE contract_id = $1`, [contractId, staffId, reason]);
    }
    static async createTemplate(data) {
        await database_1.Database.query('UPDATE contract_templates SET is_active = FALSE WHERE program_type = $1', [data.programType]);
        const result = await database_1.Database.query(`INSERT INTO contract_templates (program_type, version, title, content, pdf_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [data.programType, data.version, data.title, data.content, data.pdfUrl || null, data.createdBy]);
        return result.rows[0];
    }
}
exports.ContractModel = ContractModel;
//# sourceMappingURL=ContractModel.js.map
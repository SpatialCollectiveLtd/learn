import { Database } from './database';
import { ContractTemplate, SignedContract } from './types';

export class ContractModel {
  /**
   * Get active contract template by program type
   */
  static async getTemplateByProgramType(programType: string): Promise<ContractTemplate | null> {
    const result = await Database.query<ContractTemplate>(
      `SELECT template_id, program_type, version, title, content, pdf_url, is_active, created_by, created_at, updated_at
       FROM contract_templates 
       WHERE program_type = $1 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [programType]
    );
    return result.rows[0] || null;
  }

  /**
   * Create signed contract
   */
  static async createSignedContract(data: {
    youthId: string;
    templateId: string;
    signatureData: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<SignedContract> {
    const result = await Database.query<SignedContract>(
      `INSERT INTO signed_contracts (youth_id, template_id, signature_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.youthId,
        data.templateId,
        data.signatureData,
        data.ipAddress || null,
        data.userAgent || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Get signed contract by youth ID
   */
  static async getSignedContractByYouthId(youthId: string): Promise<SignedContract | null> {
    const result = await Database.query<SignedContract>(
      `SELECT * FROM signed_contracts 
       WHERE youth_id = $1 AND is_valid = true
       ORDER BY signed_at DESC
       LIMIT 1`,
      [youthId]
    );
    return result.rows[0] || null;
  }

  /**
   * Invalidate contract
   */
  static async invalidateContract(
    contractId: string,
    invalidatedBy: string,
    reason?: string
  ): Promise<void> {
    await Database.query(
      `UPDATE signed_contracts 
       SET is_valid = false, 
           invalidated_at = CURRENT_TIMESTAMP,
           invalidated_by = $2,
           invalidation_reason = $3
       WHERE contract_id = $1`,
      [contractId, invalidatedBy, reason || null]
    );
  }

  /**
   * Get all templates
   */
  static async getAllTemplates(activeOnly: boolean = true): Promise<ContractTemplate[]> {
    const query = activeOnly
      ? 'SELECT * FROM contract_templates WHERE is_active = true ORDER BY created_at DESC'
      : 'SELECT * FROM contract_templates ORDER BY created_at DESC';
    
    const result = await Database.query<ContractTemplate>(query);
    return result.rows;
  }
}

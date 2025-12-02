import { Database } from '../config/database';
import { ContractTemplate } from '../types';

export class ContractModel {
  /**
   * Get active template for program type
   */
  static async getActiveTemplate(programType: string): Promise<ContractTemplate | null> {
    const result = await Database.query<ContractTemplate>(
      `SELECT * FROM contract_templates 
       WHERE program_type = $1 AND is_active = TRUE 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [programType]
    );
    return result.rows[0] || null;
  }

  /**
   * Get template by ID
   */
  static async findById(templateId: string): Promise<ContractTemplate | null> {
    const result = await Database.query<ContractTemplate>(
      'SELECT * FROM contract_templates WHERE template_id = $1',
      [templateId]
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
    pdfUrl?: string;
  }): Promise<any> {
    const result = await Database.query(
      `INSERT INTO signed_contracts (youth_id, template_id, signature_data, ip_address, user_agent, pdf_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.youthId,
        data.templateId,
        data.signatureData,
        data.ipAddress || null,
        data.userAgent || null,
        data.pdfUrl || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Get signed contract for youth
   */
  static async getSignedContract(youthId: string): Promise<any | null> {
    const result = await Database.query(
      `SELECT sc.*, ct.title, ct.version, ct.program_type, y.full_name as youth_name
       FROM signed_contracts sc
       JOIN contract_templates ct ON sc.template_id = ct.template_id
       JOIN youth_participants y ON sc.youth_id = y.youth_id
       WHERE sc.youth_id = $1 AND sc.is_valid = TRUE
       ORDER BY sc.signed_at DESC
       LIMIT 1`,
      [youthId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all signed contracts (admin)
   */
  static async getAllSignedContracts(): Promise<any[]> {
    const result = await Database.query(
      `SELECT sc.*, ct.title, ct.version, ct.program_type, y.full_name as youth_name, y.email
       FROM signed_contracts sc
       JOIN contract_templates ct ON sc.template_id = ct.template_id
       JOIN youth_participants y ON sc.youth_id = y.youth_id
       WHERE sc.is_valid = TRUE
       ORDER BY sc.signed_at DESC`
    );
    return result.rows;
  }

  /**
   * Get contract statistics
   */
  static async getStatistics(): Promise<any[]> {
    const result = await Database.query(
      'SELECT * FROM contract_statistics ORDER BY program_type'
    );
    return result.rows;
  }

  /**
   * Invalidate contract
   */
  static async invalidateContract(
    contractId: string,
    staffId: string,
    reason: string
  ): Promise<void> {
    await Database.query(
      `UPDATE signed_contracts 
       SET is_valid = FALSE, invalidated_at = CURRENT_TIMESTAMP, 
           invalidated_by = $2, invalidation_reason = $3
       WHERE contract_id = $1`,
      [contractId, staffId, reason]
    );
  }

  /**
   * Create or update contract template
   */
  static async createTemplate(data: {
    programType: string;
    version: string;
    title: string;
    content: string;
    pdfUrl?: string;
    createdBy: string;
  }): Promise<ContractTemplate> {
    // Deactivate previous templates for this program type
    await Database.query(
      'UPDATE contract_templates SET is_active = FALSE WHERE program_type = $1',
      [data.programType]
    );

    // Create new template
    const result = await Database.query<ContractTemplate>(
      `INSERT INTO contract_templates (program_type, version, title, content, pdf_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.programType, data.version, data.title, data.content, data.pdfUrl || null, data.createdBy]
    );
    return result.rows[0];
  }
}

import { Database } from './database';
import { YouthParticipant, YouthWithContract } from './types';

export class YouthModel {
  /**
   * Find youth by ID
   */
  static async findById(youthId: string): Promise<YouthParticipant | null> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE youth_id = $1',
      [youthId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find youth by email
   */
  static async findByEmail(email: string): Promise<YouthParticipant | null> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all youth by program type
   */
  static async findByProgramType(programType: string): Promise<YouthParticipant[]> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE program_type = $1 AND is_active = TRUE ORDER BY full_name',
      [programType]
    );
    return result.rows;
  }

  /**
   * Get youth with contract status
   */
  static async findWithContractStatus(youthId: string): Promise<YouthWithContract | null> {
    const result = await Database.query<YouthWithContract>(
      'SELECT * FROM youth_contract_status WHERE youth_id = $1',
      [youthId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if youth has signed contract
   */
  static async hasSignedContract(youthId: string): Promise<boolean> {
    const result = await Database.query<{ has_signed_contract: boolean }>(
      'SELECT has_signed_contract FROM youth_participants WHERE youth_id = $1',
      [youthId]
    );
    return result.rows[0]?.has_signed_contract || false;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(youthId: string): Promise<void> {
    await Database.query(
      'UPDATE youth_participants SET last_login = CURRENT_TIMESTAMP WHERE youth_id = $1',
      [youthId]
    );
  }

  /**
   * Create new youth participant
   */
  static async create(data: {
    youthId: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    programType: string;
  }): Promise<YouthParticipant> {
    const result = await Database.query<YouthParticipant>(
      `INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.youthId, data.fullName, data.email || null, data.phoneNumber || null, data.programType]
    );
    return result.rows[0];
  }

  /**
   * Get all youth (admin only)
   */
  static async findAll(): Promise<YouthParticipant[]> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * Deactivate youth participant
   */
  static async deactivate(youthId: string): Promise<void> {
    await Database.query(
      'UPDATE youth_participants SET is_active = FALSE WHERE youth_id = $1',
      [youthId]
    );
  }
}

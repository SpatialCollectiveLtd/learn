import { Database } from './database';
import { YouthParticipant, YouthWithContract } from './types';

export class YouthModel {
  
  static async findById(youthId: string): Promise<YouthParticipant | null> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE youth_id = $1',
      [youthId]
    );
    return result.rows[0] || null;
  }

  
  static async findByEmail(email: string): Promise<YouthParticipant | null> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  
  static async findByProgramType(programType: string): Promise<YouthParticipant[]> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants WHERE program_type = $1 AND is_active = TRUE ORDER BY full_name',
      [programType]
    );
    return result.rows;
  }

  
  static async findWithContractStatus(youthId: string): Promise<YouthWithContract | null> {
    const result = await Database.query<YouthWithContract>(
      'SELECT * FROM youth_contract_status WHERE youth_id = $1',
      [youthId]
    );
    return result.rows[0] || null;
  }

  
  static async hasSignedContract(youthId: string): Promise<boolean> {
    const result = await Database.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM signed_contracts WHERE youth_id = $1 AND is_valid = true',
      [youthId]
    );
    return result.rows[0]?.count > 0;
  }

  
  static async updateLastLogin(youthId: string): Promise<void> {
    await Database.query(
      'UPDATE youth_participants SET last_login = CURRENT_TIMESTAMP WHERE youth_id = $1',
      [youthId]
    );
  }

  
  static async updateOsmUsername(youthId: string, osmUsername: string): Promise<void> {
    await Database.query(
      'UPDATE youth_participants SET osm_username = $1, updated_at = CURRENT_TIMESTAMP WHERE youth_id = $2',
      [osmUsername, youthId]
    );
  }

  
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

  
  static async findAll(): Promise<YouthParticipant[]> {
    const result = await Database.query<YouthParticipant>(
      'SELECT * FROM youth_participants ORDER BY created_at DESC'
    );
    return result.rows;
  }

  
  static async deactivate(youthId: string): Promise<void> {
    await Database.query(
      'UPDATE youth_participants SET is_active = FALSE WHERE youth_id = $1',
      [youthId]
    );
  }
}

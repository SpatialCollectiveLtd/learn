import { Database } from '../config/database';
import { StaffMember } from '../types';

export class StaffModel {
  
  static async findById(staffId: string): Promise<StaffMember | null> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE staff_id = $1',
      [staffId]
    );
    return result.rows[0] || null;
  }

  
  static async findByEmail(email: string): Promise<StaffMember | null> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  
  static async updateLastLogin(staffId: string): Promise<void> {
    await Database.query(
      'UPDATE staff_members SET last_login = CURRENT_TIMESTAMP WHERE staff_id = $1',
      [staffId]
    );
  }

  
  static async create(data: {
    staffId: string;
    fullName: string;
    email?: string;
    role: 'validator' | 'admin';
  }): Promise<StaffMember> {
    const result = await Database.query<StaffMember>(
      `INSERT INTO staff_members (staff_id, full_name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.staffId, data.fullName, data.email || null, data.role]
    );
    return result.rows[0];
  }

  
  static async findAll(): Promise<StaffMember[]> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE is_active = TRUE ORDER BY full_name'
    );
    return result.rows;
  }

  
  static async deactivate(staffId: string): Promise<void> {
    await Database.query(
      'UPDATE staff_members SET is_active = FALSE WHERE staff_id = $1',
      [staffId]
    );
  }

  
  static async isActive(staffId: string): Promise<boolean> {
    const result = await Database.query<{ is_active: boolean }>(
      'SELECT is_active FROM staff_members WHERE staff_id = $1',
      [staffId]
    );
    return result.rows[0]?.is_active || false;
  }
}

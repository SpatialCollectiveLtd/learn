import { Database } from './database';
import { StaffMember } from './types';

export class StaffModel {
  /**
   * Find staff by ID
   */
  static async findById(staffId: string): Promise<StaffMember | null> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE staff_id = $1',
      [staffId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find staff by email
   */
  static async findByEmail(email: string): Promise<StaffMember | null> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(staffId: string): Promise<void> {
    await Database.query(
      'UPDATE staff_members SET last_login = CURRENT_TIMESTAMP WHERE staff_id = $1',
      [staffId]
    );
  }

  /**
   * Create new staff member
   */
  static async create(data: {
    staffId: string;
    fullName: string;
    email?: string;
    phoneNumber?: string | null;
    role: 'trainer' | 'admin' | 'superadmin';
    createdBy?: string;
  }): Promise<StaffMember> {
    const result = await Database.query<StaffMember>(
      `INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.staffId, 
        data.fullName, 
        data.email || null, 
        data.phoneNumber || null, 
        data.role,
        data.createdBy || null
      ]
    );
    return result.rows[0];
  }

  /**
   * Get all staff members
   */
  static async findAll(): Promise<StaffMember[]> {
    const result = await Database.query<StaffMember>(
      'SELECT * FROM staff_members WHERE is_active = TRUE ORDER BY full_name'
    );
    return result.rows;
  }

  /**
   * Delete staff member permanently
   */
  static async delete(staffId: string): Promise<void> {
    await Database.query(
      'DELETE FROM staff_members WHERE staff_id = $1',
      [staffId]
    );
  }

  /**
   * Deactivate staff member
   */
  static async deactivate(staffId: string): Promise<void> {
    await Database.query(
      'UPDATE staff_members SET is_active = FALSE WHERE staff_id = $1',
      [staffId]
    );
  }

  /**
   * Check if staff ID exists and is active
   */
  static async isActive(staffId: string): Promise<boolean> {
    const result = await Database.query<{ is_active: boolean }>(
      'SELECT is_active FROM staff_members WHERE staff_id = $1',
      [staffId]
    );
    return result.rows[0]?.is_active || false;
  }
}

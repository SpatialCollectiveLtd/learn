import { Database } from './database';

export class AuthLogModel {
  /**
   * Create authentication log entry
   */
  static async log(data: {
    userId: string;
    userType: 'youth' | 'staff';
    action: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
  }): Promise<void> {
    await Database.query(
      `INSERT INTO auth_logs (user_id, user_type, action, success, ip_address, user_agent, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.userId,
        data.userType,
        data.action,
        data.success,
        data.ipAddress || null,
        data.userAgent || null,
        data.errorMessage || null,
      ]
    );
  }

  /**
   * Get logs for a specific user
   */
  static async getUserLogs(userId: string, limit: number = 50): Promise<any[]> {
    const result = await Database.query(
      `SELECT * FROM auth_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  /**
   * Get all logs (admin only)
   */
  static async getAllLogs(limit: number = 100): Promise<any[]> {
    const result = await Database.query(
      `SELECT * FROM auth_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get failed login attempts
   */
  static async getFailedAttempts(userId: string, minutes: number = 15): Promise<number> {
    const result = await Database.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM auth_logs
       WHERE user_id = $1
       AND success = FALSE
       AND action = 'login'
       AND created_at > NOW() - INTERVAL '${minutes} minutes'`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || '0');
  }
}

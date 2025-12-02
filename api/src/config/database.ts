import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'),
  queueLimit: 0,
});

// Test database connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
  });

// Database helper functions
export class Database {
  /**
   * Execute a query
   */
  static async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    const start = Date.now();
    try {
      // Convert PostgreSQL $1, $2 placeholders to MySQL ? placeholders
      let mysqlQuery = text;
      if (params && params.length > 0) {
        // Replace $n with ? in reverse order to avoid replacing $10 before $1
        for (let i = params.length; i >= 1; i--) {
          mysqlQuery = mysqlQuery.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
        }
      }
      
      const [rows, fields] = await pool.query(mysqlQuery, params || []);
      const duration = Date.now() - start;
      console.log('Executed query', { text: mysqlQuery.substring(0, 100), duration, rows: (rows as any[]).length || 0 });
      
      // Return in PostgreSQL format { rows: [] } for compatibility
      return { rows: rows as T[] };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool for transactions
   */
  static async getConnection(): Promise<mysql.PoolConnection> {
    return await pool.getConnection();
  }

  /**
   * Execute a transaction
   */
  static async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Close all database connections
   */
  static async close(): Promise<void> {
    await pool.end();
    console.log('Database pool closed');
  }
}

export default pool;

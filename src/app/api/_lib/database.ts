import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool for Neon (lazy initialization)
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Neon
      },
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

// Database helper functions
export class Database {
  /**
   * Execute a query
   */
  static async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    const start = Date.now();
    try {
      const result = await getPool().query(text, params || []);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rows.length });

      return { rows: result.rows as T[] };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Get a connection from the pool for transactions
   */
  static async getConnection(): Promise<PoolClient> {
    return await getPool().connect();
  }

  /**
   * Execute a transaction
   */
  static async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close all database connections
   */
  static async close(): Promise<void> {
    if (pool) {
      await pool.end();
      console.log('PostgreSQL pool closed');
    }
  }
}

export default pool;

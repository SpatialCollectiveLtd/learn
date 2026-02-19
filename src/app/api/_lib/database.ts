import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();


let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.learn_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      
      
      throw new Error('DATABASE_URL environment variable is not set');
    }

    

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, 
      },
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    
    pool.on('error', (err) => {
      
    });
  }
  return pool;
}


export class Database {
  
  static async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    const start = Date.now();
    try {
      const result = await getPool().query(text, params || []);
      const duration = Date.now() - start;
      

      return { rows: result.rows as T[] };
    } catch (error) {
      
      throw error;
    }
  }

  
  static async getConnection(): Promise<PoolClient> {
    return await getPool().connect();
  }

  
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

  
  static async close(): Promise<void> {
    if (pool) {
      await pool.end();
      
    }
  }
}

export default pool;

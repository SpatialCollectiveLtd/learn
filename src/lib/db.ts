import { Pool, PoolClient } from 'pg';


let pool: Pool | null = null;


function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, 
      },
      max: 10, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    
    pool.on('error', (err) => {
      
    });
  }
  return pool;
}


export async function testConnection() {
  try {
    
    const currentPool = getPool();
    const client = await currentPool.connect();
    const result = await client.query('SELECT NOW()');
    
    client.release();
    return true;
  } catch (error) {
    
    return false;
  }
}


export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const currentPool = getPool();
    const result = await currentPool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    
    throw error;
  }
}


export async function execute(sql: string, params?: any[]) {
  try {
    const currentPool = getPool();
    const result = await currentPool.query(sql, params);
    return result;
  } catch (error) {
    
    throw error;
  }
}


export async function getClient(): Promise<PoolClient> {
  const currentPool = getPool();
  return await currentPool.connect();
}


export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    
  }
}


export default { getPool, closePool };

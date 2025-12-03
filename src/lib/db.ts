import { Pool, PoolClient } from 'pg';

// Lazy-loaded pool
let pool: Pool | null = null;

// Function to get or create pool
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('🔧 Creating PostgreSQL pool for Neon database');

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Neon
      },
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

// Test connection function
export async function testConnection() {
  try {
    console.log('🔍 Testing PostgreSQL connection to Neon...');

    const currentPool = getPool();
    const client = await currentPool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query helper
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const currentPool = getPool();
    const result = await currentPool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Execute mutation helper (INSERT, UPDATE, DELETE)
export async function execute(sql: string, params?: any[]) {
  try {
    const currentPool = getPool();
    const result = await currentPool.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database execution error:', error);
    throw error;
  }
}

// Get a client for transactions
export async function getClient(): Promise<PoolClient> {
  const currentPool = getPool();
  return await currentPool.connect();
}

// Close pool
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// Export getPool for default export (lazy evaluation)
export default { getPool, closePool };

import mysql from 'mysql2/promise';

// Lazy-loaded pool
let pool: mysql.Pool | null = null;

// Function to get or create pool
function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306', 10),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
      multipleStatements: true, // Enable multi-statement queries
    };
    
    console.log('🔧 Creating pool with config:', {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database
    });
    
    pool = mysql.createPool(config);
  }
  return pool;
}

// Test connection function
export async function testConnection() {
  try {
    console.log('🔍 Testing connection with:', {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      database: process.env.DATABASE_NAME
    });
    
    const currentPool = getPool();
    const connection = await currentPool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
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
    const [rows] = await currentPool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Execute mutation helper (INSERT, UPDATE, DELETE)
export async function execute(sql: string, params?: any[]) {
  try {
    const currentPool = getPool();
    const [result] = await currentPool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Database execution error:', error);
    throw error;
  }
}

// Export getPool for default export (lazy evaluation)
export default { getPool };

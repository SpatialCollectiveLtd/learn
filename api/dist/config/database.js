"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = promise_1.default.createPool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_MAX || '10'),
    queueLimit: 0,
});
pool.getConnection()
    .then((connection) => {
    console.log('✅ Database connected successfully');
    connection.release();
})
    .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
});
class Database {
    static async query(text, params) {
        const start = Date.now();
        try {
            let mysqlQuery = text;
            if (params && params.length > 0) {
                for (let i = params.length; i >= 1; i--) {
                    mysqlQuery = mysqlQuery.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
                }
            }
            const [rows, fields] = await pool.query(mysqlQuery, params || []);
            const duration = Date.now() - start;
            console.log('Executed query', { text: mysqlQuery.substring(0, 100), duration, rows: rows.length || 0 });
            return { rows: rows };
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
    static async getConnection() {
        return await pool.getConnection();
    }
    static async transaction(callback) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async close() {
        await pool.end();
        console.log('Database pool closed');
    }
}
exports.Database = Database;
exports.default = pool;
//# sourceMappingURL=database.js.map
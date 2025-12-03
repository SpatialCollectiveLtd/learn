"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});
pool.query('SELECT NOW()')
    .then((result) => {
    console.log('✅ PostgreSQL (Neon) connected successfully at:', result.rows[0].now);
})
    .catch((err) => {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(-1);
});
class Database {
    static async query(text, params) {
        const start = Date.now();
        try {
            const result = await pool.query(text, params || []);
            const duration = Date.now() - start;
            console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rows.length });
            return { rows: result.rows };
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
    static async getConnection() {
        return await pool.connect();
    }
    static async transaction(callback) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    static async close() {
        await pool.end();
        console.log('PostgreSQL pool closed');
    }
}
exports.Database = Database;
exports.default = pool;
//# sourceMappingURL=database.js.map
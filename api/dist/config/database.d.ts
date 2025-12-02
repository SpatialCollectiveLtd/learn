import mysql from 'mysql2/promise';
declare const pool: mysql.Pool;
export declare class Database {
    static query<T = any>(text: string, params?: any[]): Promise<{
        rows: T[];
    }>;
    static getConnection(): Promise<mysql.PoolConnection>;
    static transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T>;
    static close(): Promise<void>;
}
export default pool;
//# sourceMappingURL=database.d.ts.map
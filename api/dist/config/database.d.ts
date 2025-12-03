import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
export declare class Database {
    static query<T = any>(text: string, params?: any[]): Promise<{
        rows: T[];
    }>;
    static getConnection(): Promise<PoolClient>;
    static transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    static close(): Promise<void>;
}
export default pool;
//# sourceMappingURL=database.d.ts.map
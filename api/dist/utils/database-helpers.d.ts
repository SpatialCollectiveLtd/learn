export declare function convertMySQLResult<T = any>(result: [any[], any]): {
    rows: T[];
};
export declare function pgToMySQL(query: string, params: any[]): [string, any[]];
//# sourceMappingURL=database-helpers.d.ts.map
export declare class AuthLogModel {
    static log(data: {
        userId: string;
        userType: 'youth' | 'staff';
        action: string;
        success: boolean;
        ipAddress?: string;
        userAgent?: string;
        errorMessage?: string;
    }): Promise<void>;
    static getUserLogs(userId: string, limit?: number): Promise<any[]>;
    static getAllLogs(limit?: number): Promise<any[]>;
    static getFailedAttempts(userId: string, minutes?: number): Promise<number>;
}
//# sourceMappingURL=AuthLogModel.d.ts.map
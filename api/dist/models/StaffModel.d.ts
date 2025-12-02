import { StaffMember } from '../types';
export declare class StaffModel {
    static findById(staffId: string): Promise<StaffMember | null>;
    static findByEmail(email: string): Promise<StaffMember | null>;
    static updateLastLogin(staffId: string): Promise<void>;
    static create(data: {
        staffId: string;
        fullName: string;
        email?: string;
        role: 'validator' | 'admin';
    }): Promise<StaffMember>;
    static findAll(): Promise<StaffMember[]>;
    static deactivate(staffId: string): Promise<void>;
    static isActive(staffId: string): Promise<boolean>;
}
//# sourceMappingURL=StaffModel.d.ts.map
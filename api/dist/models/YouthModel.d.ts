import { YouthParticipant, YouthWithContract } from '../types';
export declare class YouthModel {
    static findById(youthId: string): Promise<YouthParticipant | null>;
    static findByEmail(email: string): Promise<YouthParticipant | null>;
    static findByProgramType(programType: string): Promise<YouthParticipant[]>;
    static findWithContractStatus(youthId: string): Promise<YouthWithContract | null>;
    static hasSignedContract(youthId: string): Promise<boolean>;
    static updateLastLogin(youthId: string): Promise<void>;
    static create(data: {
        youthId: string;
        fullName: string;
        email?: string;
        phoneNumber?: string;
        programType: string;
    }): Promise<YouthParticipant>;
    static findAll(): Promise<YouthParticipant[]>;
    static deactivate(youthId: string): Promise<void>;
}
//# sourceMappingURL=YouthModel.d.ts.map
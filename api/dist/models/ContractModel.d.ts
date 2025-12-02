import { ContractTemplate } from '../types';
export declare class ContractModel {
    static getActiveTemplate(programType: string): Promise<ContractTemplate | null>;
    static findById(templateId: string): Promise<ContractTemplate | null>;
    static createSignedContract(data: {
        youthId: string;
        templateId: string;
        signatureData: string;
        ipAddress?: string;
        userAgent?: string;
        pdfUrl?: string;
    }): Promise<any>;
    static getSignedContract(youthId: string): Promise<any | null>;
    static getAllSignedContracts(): Promise<any[]>;
    static getStatistics(): Promise<any[]>;
    static invalidateContract(contractId: string, staffId: string, reason: string): Promise<void>;
    static createTemplate(data: {
        programType: string;
        version: string;
        title: string;
        content: string;
        pdfUrl?: string;
        createdBy: string;
    }): Promise<ContractTemplate>;
}
//# sourceMappingURL=ContractModel.d.ts.map
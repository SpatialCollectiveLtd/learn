import { Request, Response } from 'express';
export declare class ContractController {
    static getContractTemplate(req: Request, res: Response): Promise<void>;
    static signContract(req: Request, res: Response): Promise<void>;
    static getSignedContract(req: Request, res: Response): Promise<void>;
    static getAllSignedContracts(req: Request, res: Response): Promise<void>;
    static getStatistics(req: Request, res: Response): Promise<void>;
    private static generateContractPDF;
}
//# sourceMappingURL=ContractController.d.ts.map
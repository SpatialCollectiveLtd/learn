import { Request, Response } from 'express';
export declare class StaffAuthController {
    static authenticate(req: Request, res: Response): Promise<void>;
    static getAllStaff(req: Request, res: Response): Promise<void>;
    static registerStaff(req: Request, res: Response): Promise<void>;
    static deactivateStaff(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=StaffAuthController.d.ts.map
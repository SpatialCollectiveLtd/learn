"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractController = void 0;
const ContractModel_1 = require("../models/ContractModel");
const YouthModel_1 = require("../models/YouthModel");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ContractController {
    static async getContractTemplate(req, res) {
        try {
            const youthId = req.youthId;
            const youth = await YouthModel_1.YouthModel.findById(youthId);
            if (!youth) {
                res.status(404).json({
                    success: false,
                    message: 'Youth not found',
                });
                return;
            }
            const template = await ContractModel_1.ContractModel.getActiveTemplate(youth.program_type);
            if (!template) {
                res.status(404).json({
                    success: false,
                    message: 'No active contract template found for your program',
                });
                return;
            }
            let content = template.content;
            content = content.replace(/\[YOUTH NAME\]/g, youth.full_name);
            content = content.replace(/\[YOUTH_ID\]/g, youth.youth_id);
            content = content.replace(/\[DATE\]/g, new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
            res.status(200).json({
                success: true,
                data: {
                    templateId: template.template_id,
                    programType: template.program_type,
                    title: template.title,
                    version: template.version,
                    content,
                },
            });
        }
        catch (error) {
            console.error('Get contract template error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching contract template',
            });
        }
    }
    static async signContract(req, res) {
        try {
            const youthId = req.youthId;
            const { templateId, signatureData } = req.body;
            if (!templateId || !signatureData) {
                res.status(400).json({
                    success: false,
                    message: 'Template ID and signature data are required',
                });
                return;
            }
            const existingContract = await ContractModel_1.ContractModel.getSignedContract(youthId);
            if (existingContract) {
                res.status(409).json({
                    success: false,
                    message: 'You have already signed the contract',
                    data: {
                        signedAt: existingContract.signed_at,
                    },
                });
                return;
            }
            const youth = await YouthModel_1.YouthModel.findById(youthId);
            const template = await ContractModel_1.ContractModel.findById(templateId);
            if (!youth || !template) {
                res.status(404).json({
                    success: false,
                    message: 'Youth or template not found',
                });
                return;
            }
            const pdfUrl = await this.generateContractPDF(youth, template, signatureData);
            const signedContract = await ContractModel_1.ContractModel.createSignedContract({
                youthId,
                templateId,
                signatureData,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                pdfUrl,
            });
            res.status(201).json({
                success: true,
                message: 'Contract signed successfully',
                data: {
                    contractId: signedContract.contract_id,
                    signedAt: signedContract.signed_at,
                    pdfUrl: signedContract.pdf_url,
                },
            });
        }
        catch (error) {
            console.error('Sign contract error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while signing contract',
            });
        }
    }
    static async getSignedContract(req, res) {
        try {
            const youthId = req.youthId;
            const contract = await ContractModel_1.ContractModel.getSignedContract(youthId);
            if (!contract) {
                res.status(404).json({
                    success: false,
                    message: 'No signed contract found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: contract,
            });
        }
        catch (error) {
            console.error('Get signed contract error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching signed contract',
            });
        }
    }
    static async getAllSignedContracts(req, res) {
        try {
            const contracts = await ContractModel_1.ContractModel.getAllSignedContracts();
            res.status(200).json({
                success: true,
                data: contracts,
            });
        }
        catch (error) {
            console.error('Get all contracts error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching contracts',
            });
        }
    }
    static async getStatistics(req, res) {
        try {
            const stats = await ContractModel_1.ContractModel.getStatistics();
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching statistics',
            });
        }
    }
    static async generateContractPDF(youth, template, signatureData) {
        const uploadDir = process.env.UPLOAD_DIR || './uploads/contracts';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `contract_${youth.youth_id}_${Date.now()}.pdf`;
        const filepath = path_1.default.join(uploadDir, filename);
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const stream = fs_1.default.createWriteStream(filepath);
            doc.pipe(stream);
            doc.fontSize(20).text(template.title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text('Spatial Collective Ltd', { align: 'center' });
            doc.moveDown(2);
            let content = template.content;
            content = content.replace(/\[YOUTH NAME\]/g, youth.full_name);
            content = content.replace(/\[YOUTH_ID\]/g, youth.youth_id);
            content = content.replace(/\[DATE\]/g, new Date().toLocaleDateString());
            content = content.replace(/#{1,6}\s/g, '');
            content = content.replace(/\*\*/g, '');
            content = content.replace(/\*/g, '');
            content = content.replace(/---/g, '');
            doc.fontSize(10).text(content, {
                align: 'justify',
                lineGap: 5,
            });
            doc.moveDown(2);
            doc.fontSize(12).text('PARTICIPANT SIGNATURE:', { underline: true });
            doc.moveDown(0.5);
            try {
                const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                doc.image(buffer, {
                    fit: [200, 100],
                    align: 'left',
                });
            }
            catch (err) {
                console.error('Error adding signature to PDF:', err);
            }
            doc.moveDown(2);
            doc.fontSize(10).text(`Youth ID: ${youth.youth_id}`);
            doc.text(`Name: ${youth.full_name}`);
            doc.text(`Signed on: ${new Date().toLocaleString()}`);
            doc.end();
            stream.on('finish', () => {
                resolve(`/uploads/contracts/${filename}`);
            });
            stream.on('error', reject);
        });
    }
}
exports.ContractController = ContractController;
//# sourceMappingURL=ContractController.js.map
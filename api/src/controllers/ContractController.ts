import { Request, Response } from 'express';
import { ContractModel } from '../models/ContractModel';
import { YouthModel } from '../models/YouthModel';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ContractController {
  /**
   * Get active contract template for program type
   */
  static async getContractTemplate(req: Request, res: Response): Promise<void> {
    try {
      const youthId = (req as any).youthId;

      // Get youth to determine program type
      const youth = await YouthModel.findById(youthId);
      if (!youth) {
        res.status(404).json({
          success: false,
          message: 'Youth not found',
        });
        return;
      }

      // Get active template for program type
      const template = await ContractModel.getActiveTemplate(youth.program_type);
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'No active contract template found for your program',
        });
        return;
      }

      // Replace placeholders in content
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
    } catch (error) {
      console.error('Get contract template error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching contract template',
      });
    }
  }

  /**
   * Sign contract with digital signature
   */
  static async signContract(req: Request, res: Response): Promise<void> {
    try {
      const youthId = (req as any).youthId;
      const { templateId, signatureData } = req.body;

      if (!templateId || !signatureData) {
        res.status(400).json({
          success: false,
          message: 'Template ID and signature data are required',
        });
        return;
      }

      // Check if already signed
      const existingContract = await ContractModel.getSignedContract(youthId);
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

      // Get youth and template data
      const youth = await YouthModel.findById(youthId);
      const template = await ContractModel.findById(templateId);

      if (!youth || !template) {
        res.status(404).json({
          success: false,
          message: 'Youth or template not found',
        });
        return;
      }

      // Generate PDF
      const pdfUrl = await this.generateContractPDF(youth, template, signatureData);

      // Save signed contract
      const signedContract = await ContractModel.createSignedContract({
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
    } catch (error) {
      console.error('Sign contract error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while signing contract',
      });
    }
  }

  /**
   * Get signed contract
   */
  static async getSignedContract(req: Request, res: Response): Promise<void> {
    try {
      const youthId = (req as any).youthId;

      const contract = await ContractModel.getSignedContract(youthId);

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
    } catch (error) {
      console.error('Get signed contract error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching signed contract',
      });
    }
  }

  /**
   * Get all signed contracts (admin only)
   */
  static async getAllSignedContracts(req: Request, res: Response): Promise<void> {
    try {
      const contracts = await ContractModel.getAllSignedContracts();

      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      console.error('Get all contracts error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching contracts',
      });
    }
  }

  /**
   * Get contract statistics (admin only)
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await ContractModel.getStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching statistics',
      });
    }
  }

  /**
   * Generate signed contract PDF
   */
  private static async generateContractPDF(
    youth: any,
    template: any,
    signatureData: string
  ): Promise<string> {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/contracts';
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `contract_${youth.youth_id}_${Date.now()}.pdf`;
    const filepath = path.join(uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text(template.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Spatial Collective Ltd', { align: 'center' });
      doc.moveDown(2);

      // Contract content
      let content = template.content;
      content = content.replace(/\[YOUTH NAME\]/g, youth.full_name);
      content = content.replace(/\[YOUTH_ID\]/g, youth.youth_id);
      content = content.replace(/\[DATE\]/g, new Date().toLocaleDateString());

      // Remove markdown formatting for PDF
      content = content.replace(/#{1,6}\s/g, '');
      content = content.replace(/\*\*/g, '');
      content = content.replace(/\*/g, '');
      content = content.replace(/---/g, '');

      doc.fontSize(10).text(content, {
        align: 'justify',
        lineGap: 5,
      });

      doc.moveDown(2);

      // Signature section
      doc.fontSize(12).text('PARTICIPANT SIGNATURE:', { underline: true });
      doc.moveDown(0.5);

      // Add signature image (base64)
      try {
        const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        // @ts-ignore - pdfkit types issue with align property
        doc.image(buffer, {
          fit: [200, 100],
          align: 'left',
        });
      } catch (err) {
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

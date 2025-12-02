import { Router } from 'express';
import { ContractController } from '../controllers/ContractController';
import { authenticateYouth, authenticateAdmin } from '../middleware/auth';

const router = Router();

// Youth routes (require youth authentication)
router.get('/template', authenticateYouth, ContractController.getContractTemplate);
router.post('/sign', authenticateYouth, ContractController.signContract);
router.get('/signed', authenticateYouth, ContractController.getSignedContract);

// Admin routes
router.get('/all', authenticateAdmin, ContractController.getAllSignedContracts);
router.get('/statistics', authenticateAdmin, ContractController.getStatistics);

export default router;

import { Router } from 'express';
import { StaffAuthController } from '../controllers/StaffAuthController';
import { authenticateStaff, authenticateAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/authenticate', StaffAuthController.authenticate);

// Admin only routes
router.get('/all', authenticateAdmin, StaffAuthController.getAllStaff);
router.post('/register', authenticateAdmin, StaffAuthController.registerStaff);
router.delete('/:staffId', authenticateAdmin, StaffAuthController.deactivateStaff);

export default router;

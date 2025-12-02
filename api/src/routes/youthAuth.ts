import { Router } from 'express';
import { YouthAuthController } from '../controllers/YouthAuthController';
import { authenticateYouth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/authenticate', YouthAuthController.authenticate);

// Protected routes (require youth authentication)
router.get('/profile', authenticateYouth, YouthAuthController.getProfile);
router.get('/verify', authenticateYouth, YouthAuthController.verifyToken);

export default router;

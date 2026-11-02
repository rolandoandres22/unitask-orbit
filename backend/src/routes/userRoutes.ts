import { Router } from 'express';
import { getProfile } from '../controllers/userController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
router.get('/perfil', authenticateToken, getProfile);

export default router;
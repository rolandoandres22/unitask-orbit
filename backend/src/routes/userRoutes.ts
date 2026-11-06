import { Router } from 'express';
import { getProfile, updateProfile, updatePassword } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/perfil', authenticateToken, getProfile);
router.put('/perfil', authenticateToken, updateProfile);
router.put('/perfil/password', authenticateToken, updatePassword);

export default router;
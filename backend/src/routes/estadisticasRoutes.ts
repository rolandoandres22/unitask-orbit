import { Router } from 'express';
import { getEstadisticas } from '../controllers/estadisticasController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/estadisticas', authenticateToken, getEstadisticas);

export default router;
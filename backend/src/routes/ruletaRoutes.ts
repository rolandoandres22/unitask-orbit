import { Router } from 'express';
import { getConsejoAleatorio } from '../controllers/ruletaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/consejos/aleatorio', authenticateToken, getConsejoAleatorio);

export default router;
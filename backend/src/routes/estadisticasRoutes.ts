import { Router } from 'express';
// Importación del controlador para la obtención de estadísticas
import { getEstadisticas } from '../controllers/estadisticasController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación obligatoria mediante token JWT

const router = Router();// Inicialización del enrutador de Express

router.get('/estadisticas', authenticateToken, getEstadisticas);// Obtiene el resumen de estadisticas

export default router;
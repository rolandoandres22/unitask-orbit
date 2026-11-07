import { Router } from 'express';
// Importación del controlador de la ruleta
import { getConsejoAleatorio } from '../controllers/ruletaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación para validar el token JWT

const router = Router();// Inicialización del enrutador de Express

router.get('/consejos/aleatorio', authenticateToken, getConsejoAleatorio);// Obtiene un consejo al azar de la base de datos

export default router;
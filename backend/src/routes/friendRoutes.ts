import { Router } from 'express';
// Importación de controladores para la gestión de amigos
import { getFriends, getPendingRequests, sendRequest, respondRequest, removeFriend } from '../controllers/friendController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación obligatoria mediante Token JWT

const router = Router();// Inicialización del enrutador de Express

router.use(authenticateToken);

router.get('/', getFriends);// trae todos los amigos aceptados
router.get('/solicitudes', getPendingRequests);// trae solicitudes pendientes recibidas
router.post('/solicitud', sendRequest);// envia solicitud de amistad
router.patch('/solicitudes/:id', respondRequest);// acepta o rechaza una solicitud
router.delete('/:id', removeFriend);// elimina un amigo de la red

export default router;
import { Router } from 'express';
import { 
  getFriends, 
  getPendingRequests, 
  sendRequest, 
  respondRequest, 
  removeFriend 
} from '../controllers/friendController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getFriends);                           // trae todos los amigos aceptados
router.get('/solicitudes', getPendingRequests);         // trae solicitudes pendientes recibidas
router.post('/solicitud', sendRequest);                 // envia solicitud de amistad
router.patch('/solicitudes/:id', respondRequest);       // acepta o rechaza una solicitud
router.delete('/:id', removeFriend);                    // elimina un amigo de la red

export default router;
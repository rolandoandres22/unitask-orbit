import { Router } from 'express';
import { 
  getMyGroups, 
  createGroup, 
  inviteFriend, 
  getPendingInvites, 
  respondInvite, getMembers 
} from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas las rutas de grupos requieren token de autenticación
router.use(authenticateToken);

// 1. Obtener la lista de grupos activos del usuario autenticado
router.get('/', getMyGroups);

// 2. Crear un nuevo grupo de trabajo
router.post('/', createGroup);

// 3. Invitar a un amigo al grupo
router.post('/invitar', inviteFriend);

// 4. Obtener invitaciones de grupo pendientes enviadas al usuario
router.get('/invitaciones/pendientes', getPendingInvites);

// 5. Aceptar o rechazar una invitación a un grupo
router.post('/responder-invitacion', respondInvite);

// Endpoint para traer integrantes
router.get('/:id/miembros', authenticateToken, getMembers);

export default router;
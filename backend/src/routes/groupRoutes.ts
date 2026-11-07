import { Router } from 'express';
// Importación de controladores para la gestión de grupos
import { getMyGroups, createGroup, inviteFriend, getPendingInvites, respondInvite, getMembers } from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación para validar el token JWT

const router = Router();// Inicialización del enrutador de Express


router.use(authenticateToken);// Todas las rutas de grupos requieren token de autenticación


router.get('/', getMyGroups);//obtener la lista de grupos activos del usuario autenticado
router.post('/', createGroup);//crear un nuevo grupo de trabajo
router.post('/invitar', inviteFriend);//invitar a un amigo al grupo
router.get('/invitaciones/pendientes', getPendingInvites);//obtener invitaciones de grupo pendientes enviadas al usuario
router.post('/responder-invitacion', respondInvite);//aceptar o rechazar una invitación a un grupo
router.get('/:id/miembros', authenticateToken, getMembers);//endpoint para traer integrantes
// Exportación del enrutador
export default router;
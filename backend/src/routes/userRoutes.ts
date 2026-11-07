import { Router } from 'express';
// Importación de los controladores del usuario
import { getProfile, updateProfile, updatePassword } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación para proteger las rutas mediante JWT

const router = Router();
router.get('/perfil', authenticateToken, getProfile);// Obtiene la información del perfil
router.put('/perfil', authenticateToken, updateProfile);// Actualiza los datos generales del perfil
router.put('/perfil/password', authenticateToken, updatePassword);// Cambia la contraseña del usuario

export default router;
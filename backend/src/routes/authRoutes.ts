import { Router } from 'express';
// Importación de los controladores de autenticación (Registro e Inicio de Sesión)
import { register, login } from '../controllers/authController.js';
// Inicialización del enrutador de Express
const router = Router();

router.post('/register', register);// Endpoint para el registro
router.post('/login', login);// Endpoint para la autenticación e inicio de sesión

export default router;
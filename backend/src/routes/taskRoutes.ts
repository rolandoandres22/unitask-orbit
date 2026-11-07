import { Router } from 'express';
// Importación de los controladores de tareas desde taskController
import { getTasks, createTask, updateTask, completeTask, cancelTask, deleteTask } from '../controllers/taskController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';// Middleware de autenticación para validar el token JWT

const router = Router();// Inicialización del enrutador de Express para el módulo de tareas

router.use(authenticateToken);// Aplica la verificación del token

router.get('/', getTasks);//trae todas las tareas
router.post('/', createTask);//crea una tarea
router.put('/:id', updateTask);//edita una tarea
router.patch('/:id/completar', completeTask);//para marcar como completada(edita el estado)
router.patch('/:id/cancelar', cancelTask); // para marcar como cancelada(edita el estado)
router.delete('/:id', deleteTask);// elimina una tarea

export default router;
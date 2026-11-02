import { Router } from 'express';
import { getTasks, createTask, updateTask, completeTask, cancelTask, deleteTask } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getTasks);//trae todas las tareas
router.post('/', createTask);//crea una tarea
router.put('/:id', updateTask);//edita una tarea
router.patch('/:id/completar', completeTask);//para marcar como completada(edita el estado)
router.patch('/:id/cancelar', cancelTask); // para marcar como cancelada(edita el estado)
router.delete('/:id', deleteTask);// elimina una tarea

export default router;
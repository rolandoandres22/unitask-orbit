import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import * as taskService from '../services/taskService.js';

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { data, error } = await taskService.getTasksByUser(userId);
    
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { titulo, descripcion, fecha_inicio, fecha_limite, prioridad, tipo, id_grupo, id_usuario_asignado } = req.body;

    if (!titulo || !fecha_limite) {
      return res.status(400).json({ error: 'El título y la fecha límite son obligatorios' });
    }

    if (tipo === 'GRUPAL') {
      if (!id_grupo || !id_usuario_asignado) {
        return res.status(400).json({ error: 'Debes seleccionar un grupo y un responsable' });
      }

      const { data, error } = await taskService.createGroupTask(
        id_grupo,
        id_usuario_asignado,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_limite,
        prioridad
      );

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json(data[0]);
    }

    // Tarea Individual por defecto
    const { data, error } = await taskService.createTask(
      userId,
      titulo,
      descripcion,
      fecha_inicio,
      fecha_limite,
      prioridad
    );

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const completeTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id, id_tarea } = req.params as { id?: string; id_tarea?: string };
    const idTarea = id || id_tarea;

    if (!idTarea) {
      return res.status(400).json({ error: 'Se requiere el ID de la tarea' });
    }

    const result = await taskService.completeTask(idTarea, userId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error al completar tarea:', error.message);
    return res.status(400).json({ error: error.message });
  }
};


export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    
    // Casteamos params para asegurar a TypeScript que es un string
    const { id, id_tarea } = req.params as { id?: string; id_tarea?: string };
    const taskId = id || id_tarea;

    if (!taskId) {
      return res.status(400).json({ error: 'Se requiere el ID de la tarea' });
    }

    const { titulo, descripcion, fecha_inicio, fecha_limite, prioridad } = req.body;

    const { data, error } = await taskService.updateTask(taskId, userId, {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_limite,
      prioridad
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// CANCELAR TAREA (SOFT DELETE / UPDATE ESTADO)
export const cancelTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id, id_tarea } = req.params as { id?: string; id_tarea?: string };
    const taskId = id || id_tarea;

    if (!taskId) {
      return res.status(400).json({ error: 'Se requiere el ID de la tarea' });
    }

    const { data, error } = await taskService.cancelTask(taskId, userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Tarea cancelada exitosamente', data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// ELIMINAR TAREA (HARD DELETE / DELETE FISICO)
export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id, id_tarea } = req.params as { id?: string; id_tarea?: string };
    const taskId = id || id_tarea;

    if (!taskId) {
      return res.status(400).json({ error: 'Se requiere el ID de la tarea' });
    }

    const { error } = await taskService.deleteTask(taskId, userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Tarea eliminada permanentemente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
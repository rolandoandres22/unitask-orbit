import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import * as friendService from '../services/friendService';

export const getFriends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { data, error } = await friendService.getFriendsByUser(userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { data, error } = await friendService.getPendingRequests(userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const sendRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id_destino } = req.body;

    if (!id_destino) {
      return res.status(400).json({ error: 'Se requiere el ID de usuario de destino' });
    }

    const { data, error } = await friendService.sendFriendRequest(userId, id_destino);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const respondRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id } = req.params as { id: string };
    const { estado } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID de la solicitud' });
    }

    if (!estado || !['ACEPTAR', 'RECHAZAR'].includes(estado)) {
      return res.status(400).json({ error: 'El estado debe ser ACEPTAR o RECHAZAR' });
    }

    const result = await friendService.respondToRequest(id, userId, estado);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const removeFriend = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const { id } = req.params as { id: string };

    if (!id) {
      return res.status(400).json({ error: 'Se requiere el ID del amigo a eliminar' });
    }

    const { error } = await friendService.removeFriend(userId, id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Amigo eliminado correctamente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id || req.user.id_usuario;
    const query = req.query.q as string;

    if (!query) return res.json([]);

    const { data, error } = await friendService.searchUsers(query, userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
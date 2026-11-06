import { Request, Response } from 'express';
import * as estadisticasService from '../services/estadisticasService.js';

export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.id_usuario;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const data = await estadisticasService.getEstadisticasUsuario(userId);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
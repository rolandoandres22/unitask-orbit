import { Request, Response } from 'express';
// Importación del servicio de métricas y estadísticas
import * as estadisticasService from '../services/estadisticasService.js';

//Obtiene las métricas del estudiante
export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.id_usuario;// Extraer el UUID del usuario autenticado
    if (!userId) {// Validar si la petición cuenta con credenciales válidas
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    // Invocación al servicio que calcula las métricas y ejecuta los procedimientos almacenados
    const data = await estadisticasService.getEstadisticasUsuario(userId);
    return res.status(200).json(data);// Retornar las estadísticas calculadas con código HTTP 200 ok
  } catch (err: any) {
    return res.status(500).json({ error: err.message });// Retornar error interno del servidor
  }
};
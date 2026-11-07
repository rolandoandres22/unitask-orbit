import { Request, Response } from 'express';
// Importación de la capa de servicio con la lógica de negocio para grupos
import * as groupService from '../services/groupService.js';

//Obtiene el listado de miembros activos de un grupo
export const getMembers = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Llama al servicio para consultar los miembros con estado ACEPTADA
    const miembros = await groupService.getGroupMembers(id);
    
    return res.status(200).json({
      ok: true,
      data: miembros
    });
  } catch (error: any) {
    console.error('Error al obtener miembros del grupo:', error);
    return res.status(500).json({ error: 'Error interno al consultar los integrantes' });
  }
};
//Consulta la lista de grupos activos a los que pertenece el usuario
export const getMyGroups = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { data, error } = await groupService.getMyGroups(userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
};
//Crea un nuevo grupo de estudio y asigna automáticamente al usuario como LÍDER
export const createGroup = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { nombre_grupo, descripcion } = req.body;
  // Validación de campo obligatorio
  if (!nombre_grupo) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }

  const { data, error } = await groupService.createGroup(userId, nombre_grupo, descripcion);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ data });
};
//Invita a un amigo a unirse a un grupo
export const inviteFriend = async (req: any, res: Response) => {
  const { id_grupo, id_usuario_invitado } = req.body;

  const { data, error } = await groupService.inviteFriendToGroup(id_grupo, id_usuario_invitado);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
};
//Obtiene las invitaciones a grupos pendientes
export const getPendingInvites = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { data, error } = await groupService.getPendingGroupInvites(userId);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
};
//Responde a una invitación de grupo enviada al usuario
export const respondInvite = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id_grupo_miembro, estado } = req.body; // 'ACEPTADA' o 'RECHAZADA'

  const { data, error } = await groupService.respondGroupInvite(id_grupo_miembro, userId, estado);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
};
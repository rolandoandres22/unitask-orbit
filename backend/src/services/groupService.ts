import { supabaseAdmin } from '../config/db.js';

export const getGroupMembers = async (id_grupo: string) => {
  const { data, error } = await supabaseAdmin
    .from('grupo_miembros')
    .select(`
      rol,
      estado_invitacion,
      usuarios (
        id_usuario,
        nombre_completo,
        user_tag
      )
    `)
    .eq('id_grupo', id_grupo)
    .eq('estado_invitacion', 'ACEPTADA'); // Se usa la columna exacta de tu esquema

  if (error) throw error;

  return data.map((item: any) => ({
    id_usuario: item.usuarios.id_usuario,
    nombre_completo: item.usuarios.nombre_completo,
    user_tag: item.usuarios.user_tag,
    rol: item.rol
  }));
};

/**
 * Obtener grupos a los que pertenece el usuario con estado ACEPTADA
 */
export const getMyGroups = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('grupo_miembros')
    .select(`
      id_grupo,
      rol,
      grupos (
        id_grupo,
        nombre_grupo,
        descripcion,
        id_lider,
        fecha_creacion
      )
    `)
    .eq('id_usuario', userId)
    .eq('estado_invitacion', 'ACEPTADA');

  if (error) return { data: null, error };

  const groupsFormatted = data.map((item: any) => ({
    id_grupo: item.grupos.id_grupo,
    nombre_grupo: item.grupos.nombre_grupo,
    descripcion: item.grupos.descripcion,
    id_lider: item.grupos.id_lider,
    rol: item.rol
  }));

  return { data: groupsFormatted, error: null };
};

/**
 * Crear un nuevo grupo y agregar al creador automáticamente como LIDER y ACEPTADA
 */
export const createGroup = async (userId: string, nombreGrupo: string, descripcion?: string) => {
  // 1. Insertar el grupo
  const { data: grupo, error: groupError } = await supabaseAdmin
    .from('grupos')
    .insert([
      {
        nombre_grupo: nombreGrupo,
        descripcion: descripcion || null,
        id_lider: userId
      }
    ])
    .select()
    .single();

  if (groupError || !grupo) return { data: null, error: groupError };

  // 2. Registrar al creador en grupo_miembros como LIDER
  const { error: memberError } = await supabaseAdmin
    .from('grupo_miembros')
    .insert([
      {
        id_grupo: grupo.id_grupo,
        id_usuario: userId,
        rol: 'LIDER',
        estado_invitacion: 'ACEPTADA'
      }
    ]);

  if (memberError) return { data: null, error: memberError };

  return { data: grupo, error: null };
};

/**
 * Invitar a un amigo al grupo (Inserta en grupo_miembros con estado PENDIENTE)
 */
export const inviteFriendToGroup = async (idGrupo: string, idUsuarioInvitado: string) => {
  const { data, error } = await supabaseAdmin
    .from('grupo_miembros')
    .insert([
      {
        id_grupo: idGrupo,
        id_usuario: idUsuarioInvitado,
        rol: 'MIEMBRO',
        estado_invitacion: 'PENDIENTE'
      }
    ])
    .select();

  return { data, error };
};

/**
 * Obtener solicitudes de grupo pendientes enviadas al usuario actual (Columna derecha)
 */
export const getPendingGroupInvites = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('grupo_miembros')
    .select(`
      id_grupo_miembro,
      id_grupo,
      grupos (
        nombre_grupo,
        usuarios!grupos_id_lider_fkey (
          nombre_completo,
          user_tag
        )
      )
    `)
    .eq('id_usuario', userId)
    .eq('estado_invitacion', 'PENDIENTE');

  if (error) return { data: null, error };

  const invitesFormatted = data.map((item: any) => ({
    id_grupo_miembro: item.id_grupo_miembro,
    id_grupo: item.id_grupo,
    nombre_grupo: item.grupos?.nombre_grupo || 'GRUPO',
    lider_nombre: item.grupos?.usuarios?.nombre_completo || 'LÍDER',
    lider_tag: item.grupos?.usuarios?.user_tag || '------'
  }));

  return { data: invitesFormatted, error: null };
};

/**
 * Responder invitación a grupo (ACEPTADA o RECHAZADA)
 */
export const respondGroupInvite = async (idGrupoMiembro: number, userId: string, estado: 'ACEPTADA' | 'RECHAZADA') => {
  const { data, error } = await supabaseAdmin
    .from('grupo_miembros')
    .update({ estado_invitacion: estado })
    .eq('id_grupo_miembro', idGrupoMiembro)
    .eq('id_usuario', userId)
    .select();

  return { data, error };
};
import { supabaseAdmin } from '../config/db.js';

// OBTENER LISTADO DE AMIGOS ACEPTADOS (CON RANGO)
export const getFriendsByUser = async (userId: string) => {
  //Consulta la tabla "amistades" realizando JOINs dobles hacia la tabla "usuarios" solicitante y receptor
  const { data, error } = await supabaseAdmin
    .from('amistades')
    .select(`
      id_amistad,
      id_usuario_solicitante,
      id_usuario_receptor,
      solicitante:usuarios!id_usuario_solicitante(
        id_usuario, 
        nombre_completo, 
        user_tag,
        rangos:id_rango(id_rango, nombre_rango)
      ),
      receptor:usuarios!id_usuario_receptor(
        id_usuario, 
        nombre_completo, 
        user_tag,
        rangos:id_rango(id_rango, nombre_rango)
      )
    `)
    .eq('estado_solicitud', 'ACEPTADA')
    // Filtra las relaciones donde el usuario activo sea el solicitante O el receptor
    .or(`id_usuario_solicitante.eq.${userId},id_usuario_receptor.eq.${userId}`);

  if (error) return { data: null, error };
  // Formatear el listado determinando de qué lado del vínculo está el amigo
  const friendsFormatted = data.map((rel: any) => {
    // Si el usuario actual es el solicitante, el amigo es el receptor o al reves
    const friend = rel.id_usuario_solicitante === userId ? rel.receptor : rel.solicitante;
    const nombreRango = friend?.rangos?.nombre_rango || 'E';

    return {
      id_usuario: friend.id_usuario,
      nombre_completo: friend.nombre_completo,
      user_tag: friend.user_tag,
      rango: `RANGO ${nombreRango}`
    };
  });

  return { data: friendsFormatted, error: null };
};

// OBTENER SOLICITUDES PENDIENTES RECIBIDAS
export const getPendingRequests = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('amistades')
    .select(`
      id_amistad,
      solicitante:usuarios!id_usuario_solicitante(id_usuario, nombre_completo, user_tag)
    `)
    .eq('id_usuario_receptor', userId)
    .eq('estado_solicitud', 'PENDIENTE');

  if (error) return { data: null, error };

  const requestsFormatted = data.map((req: any) => ({
    id_solicitud: req.id_amistad,
    solicitante_id: req.solicitante.id_usuario,
    solicitante_nombre: req.solicitante.nombre_completo,
    solicitante_tag: req.solicitante.user_tag
  }));

  return { data: requestsFormatted, error: null };
};

// ENVIAR SOLICITUD DE AMISTAD
export const sendFriendRequest = async (solicitanteId: string, receptorId: string) => {
  if (solicitanteId === receptorId) {// validación para evitar auto-solicitudes
    return { data: null, error: { message: 'No puedes enviarte una solicitud a ti mismo' } };
  }

  return await supabaseAdmin
    .from('amistades')
    .insert([
      { 
        id_usuario_solicitante: solicitanteId, 
        id_usuario_receptor: receptorId, 
        estado_solicitud: 'PENDIENTE' 
      }
    ])
    .select();
};

// RESPONDER SOLICITUD (ACEPTAR / RECHAZAR)
export const respondToRequest = async (idAmistad: string, userId: string, estado: 'ACEPTAR' | 'RECHAZAR') => {
  if (estado === 'RECHAZAR') {// Si la acción es RECHAZAR, elimina físicamente el registro de la tabla
    const { error } = await supabaseAdmin
      .from('amistades')
      .delete()
      .eq('id_amistad', idAmistad)
      .eq('id_usuario_receptor', userId);

    if (error) throw new Error(error.message);
    return { message: 'Solicitud rechazada' };
  }

  // Si la acción es ACEPTAR, actualiza el estado de la fila a 'ACEPTADA'
  const { data, error } = await supabaseAdmin
    .from('amistades')
    .update({ estado_solicitud: 'ACEPTADA' })
    .eq('id_amistad', idAmistad)
    .eq('id_usuario_receptor', userId)
    .select();

  if (error) throw new Error(error.message);
  return { message: 'Solicitud aceptada exitosamente', data: data[0] };
};

// ELIMINAR AMIGO O CANCELAR VÍNCULO
export const removeFriend = async (userId: string, friendId: string) => {
  return await supabaseAdmin
    .from('amistades')
    .delete()
    // Utiliza una combinación lógica AND/OR para eliminar sin importar quién fue el solicitante
    .or(`and(id_usuario_solicitante.eq.${userId},id_usuario_receptor.eq.${friendId}),and(id_usuario_solicitante.eq.${friendId},id_usuario_receptor.eq.${userId})`);
};

// BUSCAR USUARIOS GLOBALMENTE (POR NOMBRE O #TAG)
export const searchUsers = async (query: string, currentUserId: string) => {
  const cleanQuery = query.replace('#', '').trim();// Sanitiza el término eliminando el carácter '#' y espacios
  // 1. Buscar usuarios excluyendo al usuario activo
  const { data: users, error } = await supabaseAdmin
    .from('usuarios')
    .select('id_usuario, nombre_completo, user_tag')
    .neq('id_usuario', currentUserId)
    .or(`user_tag.eq.${cleanQuery},nombre_completo.ilike.%${cleanQuery}%`)
    .limit(10);

  if (error) return { data: null, error };
  // 2. Traer las relaciones de amistad del usuario
  const { data: relations } = await supabaseAdmin
    .from('amistades')
    .select('id_usuario_solicitante, id_usuario_receptor, estado_solicitud')
    .or(`id_usuario_solicitante.eq.${currentUserId},id_usuario_receptor.eq.${currentUserId}`);
  // 3. Cruzar la lista de usuarios encontrados con las relaciones
  const resultsFormatted = users.map((u: any) => {
    const rel = relations?.find(
      r => r.id_usuario_solicitante === u.id_usuario || r.id_usuario_receptor === u.id_usuario
    );

    return {
      id_usuario: u.id_usuario,
      nombre_completo: u.nombre_completo,
      user_tag: u.user_tag,
      es_amigo: rel?.estado_solicitud === 'ACEPTADA',
      solicitud_enviada: rel?.estado_solicitud === 'PENDIENTE'
    };
  });

  return { data: resultsFormatted, error: null };
};
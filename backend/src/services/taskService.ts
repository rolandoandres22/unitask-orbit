import { supabaseAdmin } from '../config/db.js';
// Consulta y unifica en una sola colección las tareas individuales y grupales asignadas a un usuario.
export const getTasksByUser = async (userId: string) => {
  // 1. Consultar tareas individuales
  const { data: tareasIndividuales, error: errorInd } = await supabaseAdmin
    .from('tareas')
    .select('*')
    .eq('id_usuario', userId);

  if (errorInd) return { error: errorInd };

  // 2. Consultar tareas grupales asignadas al usuario
  const { data: tareasGrupales, error: errorGrup } = await supabaseAdmin
    .from('tareas_grupales')
    .select(`
      id_tarea_grupal,
      id_grupo,
      id_usuario_asignado,
      titulo,
      descripcion,
      fecha_inicio,
      fecha_limite,
      fecha_completada,
      prioridad,
      estado,
      grupos (
        nombre_grupo
      )
    `)
    .eq('id_usuario_asignado', userId);

  if (errorGrup) return { error: errorGrup };

  // 3. Normalizar y mapear las tareas grupales para que coincidan con la interfaz del frontend
  const grupalesFormateadas = (tareasGrupales || []).map((tg: any) => ({
    id_tarea: tg.id_tarea_grupal,
    id_grupo: tg.id_grupo,
    nombre_grupo: tg.grupos?.nombre_grupo || 'GRUPO',
    id_usuario: tg.id_usuario_asignado,
    titulo: tg.titulo,
    descripcion: tg.descripcion,
    fecha_inicio: tg.fecha_inicio,
    fecha_limite: tg.fecha_limite,
    fecha_completada: tg.fecha_completada,
    prioridad: tg.prioridad,
    estado: tg.estado,
    tipo: 'GRUPAL'
  }));

  const individualesFormateadas = (tareasIndividuales || []).map((ti: any) => ({
    ...ti,
    tipo: 'INDIVIDUAL'
  }));

  // 4. Combinar ambas listas y ordenarlas por fecha límite ascendente
  const todasLasTareas = [...individualesFormateadas, ...grupalesFormateadas].sort((a, b) => {
    return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
  });

  return { data: todasLasTareas, error: null };
};
//Inserta una nueva tarea individual en la base de datos.
export const createTask = async (
  userId: string,
  titulo: string,
  descripcion: string,
  fecha_inicio: string,
  fecha_limite: string,
  prioridad: string
) => {
  return await supabaseAdmin
    .from('tareas')
    .insert([
      {
        id_usuario: userId,
        titulo,
        descripcion: descripcion || null,
        fecha_inicio: fecha_inicio || new Date().toISOString(),
        fecha_limite,
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE'
      }
    ])
    .select();
};
//Inserta una nueva tarea grupal en la BD tabla tareas_grupales
export const createGroupTask = async (
  idGrupo: string,
  idUsuarioAsignado: string,
  titulo: string,
  descripcion: string,
  fechaInicio: string,
  fechaLimite: string,
  prioridad: string
) => {
  return await supabaseAdmin
    .from('tareas_grupales')
    .insert([
      {
        id_grupo: idGrupo,
        id_usuario_asignado: idUsuarioAsignado,
        titulo,
        descripcion: descripcion || null,
        fecha_inicio: fechaInicio || new Date().toISOString(),
        fecha_limite: fechaLimite,
        prioridad: prioridad || 'MEDIA',
        estado: 'PENDIENTE'
      }
    ])
    .select();
};

//marca como completada tareas individuales o grupales
export const completeTask = async (idTarea: string, userId: string) => {
  // 1. Intentar actualizar en tareas individuales
  const { data: indData, error: indError } = await supabaseAdmin
    .from('tareas')
    .update({ 
      estado: 'COMPLETADA', 
      fecha_completada: new Date().toISOString() 
    })
    .eq('id_tarea', idTarea)
    .eq('id_usuario', userId)
    .select();

  // Si actualizó una fila en tareas individuales, retornar el resultado
  if (indData && indData.length > 0) {
    return { message: 'Tarea individual completada exitosamente', data: indData[0] };
  }

  // 2. Si no encontró filas en individuales, intentar completar como tarea grupal
  return await completeGroupTask(idTarea, userId);
};
//edita los datos de una tarea individual
export const updateTask = async (idTarea: string, userId: string, taskData: any) => {
  return await supabaseAdmin
    .from('tareas')
    .update(taskData)
    .eq('id_tarea', idTarea)
    .eq('id_usuario', userId)
    .select();
};

// Actualizar el estado a CANCELADA
export const cancelTask = async (idTarea: string, userId: string) => {
  return await supabaseAdmin
    .from('tareas')
    .update({ estado: 'CANCELADA' })
    .eq('id_tarea', idTarea)
    .eq('id_usuario', userId)
    .select();
};

// Borrado físico permanente de la fila, elimina de la BD
export const deleteTask = async (idTarea: string, userId: string) => {
  return await supabaseAdmin
    .from('tareas')
    .delete()
    .eq('id_tarea', idTarea)
    .eq('id_usuario', userId);
};

// COMPLETAR TAREA GRUPAL y asigna xp
export const completeGroupTask = async (idTareaGrupal: string, userId: string) => {
  const { data: tarea, error: fetchError } = await supabaseAdmin
    .from('tareas_grupales')
    .select('prioridad, estado, id_usuario_asignado')
    .eq('id_tarea_grupal', idTareaGrupal)
    .eq('id_usuario_asignado', userId)
    .single();

  if (fetchError || !tarea) {
    return { error: { message: 'Tarea grupal no encontrada o no estás asignado' } };
  }
  
  if (tarea.estado === 'COMPLETADA') {
    return { error: { message: 'La tarea grupal ya fue completada' } };
  }

  // 1. Marcar como COMPLETADA
  const { data: updatedData, error: updateError } = await supabaseAdmin
    .from('tareas_grupales')
    .update({ 
      estado: 'COMPLETADA',
      fecha_completada: new Date().toISOString()
    })
    .eq('id_tarea_grupal', idTareaGrupal)
    .select();

  if (updateError) return { error: updateError };

  // 2. Calcular XP según prioridad
  const xpGanado = tarea.prioridad === 'ALTA' ? 40 : tarea.prioridad === 'MEDIA' ? 25 : 10;
  // Obtener la experiencia acumulada actual del usuario
  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('xp_acumulado')
    .eq('id_usuario', userId)
    .single();

  const nuevoXp = (usuario?.xp_acumulado || 0) + xpGanado;

  // 3. Actualizar XP del usuario en la tabla usuarios
  await supabaseAdmin
    .from('usuarios')
    .update({ xp_acumulado: nuevoXp })
    .eq('id_usuario', userId);

  return { 
    message: 'Tarea grupal completada exitosamente', 
    xp_ganado: xpGanado, 
    nuevo_xp_total: nuevoXp,
    data: updatedData ? updatedData[0] : null 
  };
};
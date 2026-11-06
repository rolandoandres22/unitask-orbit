import { supabaseAdmin } from '../config/db.js';

export const getEstadisticasUsuario = async (userId: string) => {
  // 1. Obtener datos del usuario (XP acumulado e id_rango)
  const { data: usuario, error: userError } = await supabaseAdmin
    .from('usuarios')
    .select('xp_acumulado, id_rango')
    .eq('id_usuario', userId)
    .single();

  if (userError || !usuario) throw new Error('Usuario no encontrado');

  // 2. Consultar la tabla RANGOS directamente desde la Base de Datos
  const { data: listaRangos, error: errRangos } = await supabaseAdmin
    .from('rangos')
    .select('*')
    .order('xp_minimo', { ascending: true });

  if (errRangos) throw new Error('Error al consultar la tabla rangos');

  // 3. Traer tareas individuales
  const { data: tareasInd, error: errInd } = await supabaseAdmin
    .from('tareas')
    .select('id_tarea, estado, prioridad')
    .eq('id_usuario', userId);

  // 4. Traer tareas grupales
  const { data: tareasGrup, error: errGrup } = await supabaseAdmin
    .from('tareas_grupales')
    .select('id_tarea_grupal, estado, prioridad')
    .eq('id_usuario_asignado', userId);

  if (errInd || errGrup) throw new Error('Error al consultar métricas de tareas');

  const todasTareas = [
    ...(tareasInd || []).map(t => ({ estado: t.estado, prioridad: t.prioridad })),
    ...(tareasGrup || []).map(tg => ({ estado: tg.estado, prioridad: tg.prioridad }))
  ];

  const totalCreadas = todasTareas.length;
  const completadas = todasTareas.filter(t => t.estado === 'COMPLETADA');
  const totalCompletadas = completadas.length;
  const totalPendientes = todasTareas.filter(t => t.estado === 'PENDIENTE').length;

  const porcentajeEfectividad = totalCreadas > 0 
    ? Math.round((totalCompletadas / totalCreadas) * 100) 
    : 0;

  const completadasPorPrioridad = {
    ALTA: completadas.filter(t => t.prioridad === 'ALTA').length,
    MEDIA: completadas.filter(t => t.prioridad === 'MEDIA').length,
    BAJA: completadas.filter(t => t.prioridad === 'BAJA').length
  };

  // --- CÁLCULO DE RANGO BASADO 100% EN LA TABLA `rangos` DE LA BASE DE DATOS ---
  const xp = usuario.xp_acumulado || 0;
  
  // Buscar en qué rango encaja según xp_minimo y xp_maximo de la BD
  let rangoActual = listaRangos?.find(r => xp >= r.xp_minimo && xp <= r.xp_maximo) 
                 || listaRangos?.find(r => r.id_rango === usuario.id_rango)
                 || listaRangos?.[0];

  let porcentajeRango = 0;

  if (rangoActual) {
    const min = rangoActual.xp_minimo || 0;
    const max = rangoActual.xp_maximo || 100;
    
    // Si ya alcanzó o superó el máximo rango
    if (xp >= max) {
      porcentajeRango = 100;
    } else {
      const xpEnNivel = xp - min;
      const xpRequeridoNivel = max - min;
      porcentajeRango = Math.min(Math.max(Math.round((xpEnNivel / xpRequeridoNivel) * 100), 0), 100);
    }
  }

  // 5. Procedimientos almacenados en paralelo
  const [rachaRes, diariasRes, mesRes, evolucionRes] = await Promise.all([
    supabaseAdmin.rpc('obtener_racha_usuario', { p_id_usuario: userId }),
    supabaseAdmin.rpc('obtener_tareas_diarias_usuario', { p_id_usuario: userId }),
    supabaseAdmin.rpc('obtener_tareas_mes_usuario', { p_id_usuario: userId }),
    supabaseAdmin.rpc('obtener_evolucion_actividad_usuario', { p_id_usuario: userId })
  ]);

  return {
    resumen: {
      total_tareas: totalCreadas,
      completadas: totalCompletadas,
      pendientes: totalPendientes,
      porcentaje_efectividad: porcentajeEfectividad,
      racha_dias: rachaRes.data || 0,
      xp_total: xp,
      rango_nombre: rangoActual ? (rangoActual.nombre_rango || rangoActual.nombre) : 'RANGO E',
      rango_porcentaje: porcentajeRango,
      completadas_hoy: diariasRes.data || 0,
      completadas_mes: mesRes.data || 0
    },
    distribucion_prioridad: completadasPorPrioridad,
    evolucion_actividad: evolucionRes.data || []
  };
};
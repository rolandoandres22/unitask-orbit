import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/db.js';

export const getProfile = async (req: Request, res: Response) => {
  try {
    // 1. Extraer ID del usuario autenticado vía JWT middleware
    const userId = (req as any).user?.id || (req as any).user?.id_usuario;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // 2. Obtener perfil de usuario
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id_usuario, xp_acumulado, user_tag, nombre_completo, id_rango')
      .eq('id_usuario', userId)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const xpActual = usuario.xp_acumulado || 0;

    // 3. Consultar la escala de rangos en public.rangos
    const { data: listaRangos } = await supabaseAdmin
      .from('rangos')
      .select('*')
      .order('xp_minimo', { ascending: true });

    let rangoActual = listaRangos?.find(
      (r) => xpActual >= r.xp_minimo && xpActual <= r.xp_maximo
    );

    if (!rangoActual && listaRangos && listaRangos.length > 0) {
      rangoActual = listaRangos[listaRangos.length - 1];
    }

    const minXp = rangoActual?.xp_minimo ?? 0;
    const maxXp = rangoActual?.xp_maximo ?? 150;
    const xpEnNivel = xpActual - minXp;
    const rangoRangoXP = maxXp - minXp;
    const porcentajeProgreso = Math.min(
      100,
      Math.max(0, Math.floor((xpEnNivel / (rangoRangoXP || 1)) * 100))
    );

    // Ponderación de XP por prioridad en la BD / servicios
    const calcularXP = (prioridad: string) => {
      switch (prioridad) {
        case 'ALTA': return 40;
        case 'MEDIA': return 25;
        case 'BAJA': return 10;
        default: return 10;
      }
    };

    // 4. Misiones prioritarias reales: Consultar en paralelo Tareas Individuales y Grupales
    const [
      { data: tareasIndBD, error: errInd },
      { data: tareasGrupBD, error: errGrup },
      { data: rachaCalculada, error: errRacha }
    ] = await Promise.all([
      supabaseAdmin
        .from('tareas')
        .select('id_tarea, titulo, descripcion, fecha_limite, prioridad, estado')
        .eq('id_usuario', userId)
        .eq('estado', 'PENDIENTE'),
      supabaseAdmin
        .from('tareas_grupales')
        .select('id_tarea_grupal, titulo, descripcion, fecha_limite, prioridad, estado')
        .eq('id_usuario_asignado', userId)
        .eq('estado', 'PENDIENTE'),
      // Ejecutar la función RPC para calcular los días de racha en tiempo real
      supabaseAdmin.rpc('obtener_racha_usuario', { p_id_usuario: userId })
    ]);

    if (errInd) console.error('Error al obtener tareas individuales:', errInd.message);
    if (errGrup) console.error('Error al obtener tareas grupales:', errGrup.message);
    if (errRacha) console.error('Error al calcular racha de días:', errRacha.message);

    // Mapeo unificado de tareas individuales
    const misionesInd = (tareasIndBD || []).map((t) => ({
      id: t.id_tarea,
      titulo: t.titulo,
      descripcion: t.descripcion,
      tipo: 'INDIVIDUAL',
      xp: calcularXP(t.prioridad),
      prioridad: t.prioridad,
      fecha_limite: new Date(t.fecha_limite)
    }));

    // Mapeo unificado de tareas grupales
    const misionesGrup = (tareasGrupBD || []).map((tg) => ({
      id: tg.id_tarea_grupal,
      titulo: tg.titulo,
      descripcion: tg.descripcion,
      tipo: 'GRUPAL',
      xp: calcularXP(tg.prioridad),
      prioridad: tg.prioridad,
      fecha_limite: new Date(tg.fecha_limite)
    }));

    // Combinar ambas listas y ordenar por fecha límite (más cercanas primero)
    const todasMisiones = [...misionesInd, ...misionesGrup].sort(
      (a, b) => a.fecha_limite.getTime() - b.fecha_limite.getTime()
    );

    const hoy = new Date();

    // Formatear las misiones prioritarias (máximo 4)
    const misionesPrioritarias = todasMisiones.slice(0, 4).map((m) => {
      const esHoy = m.fecha_limite.toDateString() === hoy.toDateString();
      const fechaFormateada = esHoy
        ? `HOY ${m.fecha_limite.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : m.fecha_limite.toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase();

      return {
        id: m.id,
        titulo: m.titulo,
        descripcion: m.descripcion,
        tipo: m.tipo,
        xp: m.xp,
        prioridad: m.prioridad,
        fecha: fechaFormateada
      };
    });

    // 5. Total acumulado de tareas pendientes (Individuales + Grupales)
    const tareasPendientesCount = todasMisiones.length;

    return res.status(200).json({
      perfil: {
        nombre: usuario.nombre_completo,
        user_tag: usuario.user_tag,
        xp_acumulado: xpActual,
        rango: `RANGO ${rangoActual?.nombre_rango || 'E'}`,
        xp_minimo: minXp,
        xp_maximo: maxXp,
        porcentaje_progreso: porcentajeProgreso
      },
      resumen: {
        tareas_pendientes_hoy: tareasPendientesCount,
        grupos_activos: 0,
        racha_dias: errRacha ? 0 : (rachaCalculada ?? 0) // Racha dinámica obtenida de Supabase
      },
      misiones_prioritarias: misionesPrioritarias
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.id_usuario;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { nombre_completo } = req.body;

    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ error: 'El nombre completo es obligatorio' });
    }

    // Actualizar nombre completo en la tabla usuarios
    const { data: usuarioActualizado, error } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre_completo: nombre_completo.trim() })
      .eq('id_usuario', userId)
      .select('id_usuario, nombre_completo, email, user_tag, xp_acumulado')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.id_usuario;
    const { nueva_password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;
    if (!nueva_password || !passwordRegex.test(nueva_password)) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y un carácter especial' 
      });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: nueva_password }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
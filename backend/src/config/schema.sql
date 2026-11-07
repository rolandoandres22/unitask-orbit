-- ============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - UNITASK (CON PROCEDIMIENTOS Y TRIGGERS)
-- Ejecutable en Supabase SQL Editor para crear la BD completa desde cero.
-- ============================================================================

-- Limpieza previa para evitar conflictos de orden de dependencias
DROP TRIGGER IF EXISTS trg_actualizar_xp_tarea ON public.tareas;
DROP TRIGGER IF EXISTS trg_actualizar_xp_tarea_grupal ON public.tareas_grupales;
DROP TRIGGER IF EXISTS trg_verificar_rango_usuario ON public.usuarios;

DROP FUNCTION IF EXISTS public.fn_otorgar_xp_tarea();
DROP FUNCTION IF EXISTS public.fn_actualizar_rango_usuario();

DROP TABLE IF EXISTS public.tareas_grupales CASCADE;
DROP TABLE IF EXISTS public.grupo_miembros CASCADE;
DROP TABLE IF EXISTS public.grupos CASCADE;
DROP TABLE IF EXISTS public.amistades CASCADE;
DROP TABLE IF EXISTS public.tareas CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.rangos CASCADE;
DROP TABLE IF EXISTS public.consejos CASCADE;

-- ============================================================================
-- 1. TABLA DE RANGOS
-- ============================================================================
CREATE TABLE public.rangos (
  id_rango integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre_rango character varying NOT NULL CHECK (nombre_rango::text = ANY (ARRAY['E'::character varying, 'D'::character varying, 'C'::character varying, 'B'::character varying, 'A'::character varying, 'S'::character varying]::text[])),
  xp_minimo integer NOT NULL CHECK (xp_minimo >= 0),
  xp_maximo integer NOT NULL,
  CONSTRAINT rangos_pkey PRIMARY KEY (id_rango)
);

-- Cargar datos de Rangos del sistema (Escala Solo Leveling)
INSERT INTO public.rangos (nombre_rango, xp_minimo, xp_maximo) VALUES
('E', 0, 100),
('D', 101, 250),
('C', 251, 500),
('B', 501, 1000),
('A', 1001, 2000),
('S', 2001, 999999);

-- ============================================================================
-- 2. TABLA DE USUARIOS (Vinculada a Supabase Auth)
-- ============================================================================
CREATE TABLE public.usuarios (
  id_usuario uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL DEFAULT 'MANAGED_BY_SUPABASE_AUTH',
  nombre_completo character varying NOT NULL,
  xp_acumulado integer NOT NULL DEFAULT 0 CHECK (xp_acumulado >= 0),
  id_rango integer NOT NULL DEFAULT 1,
  fecha_registro timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_tag character varying NOT NULL UNIQUE DEFAULT SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT usuarios_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT usuarios_id_rango_fkey FOREIGN KEY (id_rango) REFERENCES public.rangos(id_rango)
);

-- ============================================================================
-- 3. TABLA DE TAREAS INDIVIDUALES
-- ============================================================================
CREATE TABLE public.tareas (
  id_tarea uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  titulo character varying NOT NULL,
  descripcion text,
  fecha_limite timestamp with time zone NOT NULL,
  prioridad character varying NOT NULL DEFAULT 'MEDIA'::character varying CHECK (prioridad::text = ANY (ARRAY['ALTA'::character varying, 'MEDIA'::character varying, 'BAJA'::character varying]::text[])),
  estado character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::character varying, 'COMPLETADA'::character varying, 'VENCIDA'::character varying, 'CANCELADA'::character varying]::text[])),
  fecha_completada timestamp with time zone,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tareas_pkey PRIMARY KEY (id_tarea),
  CONSTRAINT tareas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE
);

-- ============================================================================
-- 4. TABLA DE AMISTADES
-- ============================================================================
CREATE TABLE public.amistades (
  id_amistad integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_usuario_solicitante uuid NOT NULL,
  id_usuario_receptor uuid NOT NULL,
  estado_solicitud character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado_solicitud::text = ANY (ARRAY['PENDIENTE'::character varying, 'ACEPTADA'::character varying, 'RECHAZADA'::character varying]::text[])),
  fecha_creacion timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT amistades_pkey PRIMARY KEY (id_amistad),
  CONSTRAINT amistades_id_usuario_solicitante_fkey FOREIGN KEY (id_usuario_solicitante) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT amistades_id_usuario_receptor_fkey FOREIGN KEY (id_usuario_receptor) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT amistades_unica UNIQUE (id_usuario_solicitante, id_usuario_receptor)
);

-- ============================================================================
-- 5. TABLA DE GRUPOS
-- ============================================================================
CREATE TABLE public.grupos (
  id_grupo uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_grupo character varying NOT NULL,
  descripcion text,
  id_lider uuid NOT NULL,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT grupos_pkey PRIMARY KEY (id_grupo),
  CONSTRAINT grupos_id_lider_fkey FOREIGN KEY (id_lider) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE
);

-- ============================================================================
-- 6. TABLA DE MIEMBROS DE GRUPO
-- ============================================================================
CREATE TABLE public.grupo_miembros (
  id_grupo_miembro integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_grupo uuid NOT NULL,
  id_usuario uuid NOT NULL,
  fecha_incorporacion timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rol character varying NOT NULL DEFAULT 'MIEMBRO'::character varying CHECK (rol::text = ANY (ARRAY['LIDER'::character varying, 'MIEMBRO'::character varying]::text[])),
  estado_invitacion character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado_invitacion::text = ANY (ARRAY['PENDIENTE'::character varying, 'ACEPTADA'::character varying, 'RECHAZADA'::character varying]::text[])),
  CONSTRAINT grupo_miembros_pkey PRIMARY KEY (id_grupo_miembro),
  CONSTRAINT grupo_miembros_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupos(id_grupo) ON DELETE CASCADE,
  CONSTRAINT grupo_miembros_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT grupo_miembros_unico UNIQUE (id_grupo, id_usuario)
);

-- ============================================================================
-- 7. TABLA DE TAREAS GRUPALES
-- ============================================================================
CREATE TABLE public.tareas_grupales (
  id_tarea_grupal uuid NOT NULL DEFAULT gen_random_uuid(),
  id_grupo uuid NOT NULL,
  id_usuario_asignado uuid NOT NULL,
  titulo character varying NOT NULL,
  descripcion text,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  fecha_limite timestamp with time zone NOT NULL,
  fecha_completada timestamp with time zone,
  prioridad character varying NOT NULL DEFAULT 'MEDIA'::character varying CHECK (prioridad::text = ANY (ARRAY['ALTA'::text, 'MEDIA'::text, 'BAJA'::text])),
  estado character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado::text = ANY (ARRAY['PENDIENTE'::text, 'COMPLETADA'::text, 'VENCIDA'::text, 'CANCELADA'::text])),
  CONSTRAINT tareas_grupales_pkey PRIMARY KEY (id_tarea_grupal),
  CONSTRAINT tareas_grupales_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupos(id_grupo) ON DELETE CASCADE,
  CONSTRAINT tareas_grupales_id_usuario_asignado_fkey FOREIGN KEY (id_usuario_asignado) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE
);

-- ============================================================================
-- 8. TABLA DE CONSEJOS (RULETA ACADÉMICA)
-- ============================================================================
CREATE TABLE public.consejos (
  id_consejo integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  titulo character varying NOT NULL,
  contenido_consejo text NOT NULL,
  categoria character varying NOT NULL CHECK (categoria::text = ANY (ARRAY['ENFOQUE'::character varying, 'PLANIFICACION'::character varying, 'MOTIVACION'::character varying, 'DESCANSO'::character varying]::text[])),
  CONSTRAINT consejos_pkey PRIMARY KEY (id_consejo)
);

INSERT INTO public.consejos (titulo, contenido_consejo, categoria) VALUES
('Técnica Pomodoro', 'Estudiá durante 25 minutos seguidos y descansá 5 minutos. Repetí 4 veces y tomate un descanso largo de 15 a 30 minutos.', 'ENFOQUE'),
('Regla de los 2 minutos', 'Si una tarea académica te toma menos de dos minutos completarla, hacela inmediatamente en lugar de posponerla.', 'PLANIFICACION'),
('Descanso Visual 20-20-20', 'Cada 20 minutos de pantalla, mirá un objeto a 6 metros (20 pies) de distancia durante al menos 20 segundos para no fatigar la vista.', 'DESCANSO'),
('La Ley de Parkinson', 'El trabajo se expande hasta llenar el tiempo disponible. Ponete horarios límites strictly para terminar tus tareas más rápido.', 'MOTIVACION');

-- ============================================================================
-- 9. FUNCIONES ALMACENADAS (RPC / PROCEDIMIENTOS)
-- ============================================================================

-- A. Calcular Racha de Días Activo del Estudiante
CREATE OR REPLACE FUNCTION public.obtener_racha_usuario(p_id_usuario UUID)
RETURNS INT AS $$
DECLARE
    v_racha INT := 0;
BEGIN
    SELECT COUNT(DISTINCT DATE(fecha_completada))
    INTO v_racha
    FROM public.tareas
    WHERE id_usuario = p_id_usuario AND estado = 'COMPLETADA';
    
    RETURN COALESCE(v_racha, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Contador Tareas Completadas Hoy
CREATE OR REPLACE FUNCTION public.obtener_tareas_diarias_usuario(p_id_usuario UUID)
RETURNS INT AS $$
DECLARE
    v_total INT := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM public.tareas
    WHERE id_usuario = p_id_usuario 
      AND estado = 'COMPLETADA' 
      AND DATE(fecha_completada) = CURRENT_DATE;
      
    RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Contador Tareas Completadas en el Mes Actual
CREATE OR REPLACE FUNCTION public.obtener_tareas_mes_usuario(p_id_usuario UUID)
RETURNS INT AS $$
DECLARE
    v_total INT := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM public.tareas
    WHERE id_usuario = p_id_usuario 
      AND estado = 'COMPLETADA' 
      AND DATE_TRUNC('month', fecha_completada) = DATE_TRUNC('month', CURRENT_DATE);
      
    RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Evolución Histórica de Actividad
CREATE OR REPLACE FUNCTION public.obtener_evolucion_actividad_usuario(p_id_usuario UUID)
RETURNS TABLE(fecha TEXT, completadas INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE(fecha_completada), 'YYYY-MM-DD') AS fecha,
        COUNT(*)::INT AS completadas
    FROM public.tareas
    WHERE id_usuario = p_id_usuario AND estado = 'COMPLETADA'
    GROUP BY DATE(fecha_completada)
    ORDER BY DATE(fecha_completada) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Búsqueda de Usuarios por Tag o Nombre (Red de Amigos)
CREATE OR REPLACE FUNCTION public.buscar_estudiantes(p_query TEXT, p_id_usuario UUID)
RETURNS TABLE(id_usuario UUID, nombre_completo VARCHAR, user_tag VARCHAR, xp_acumulado INT, nombre_rango VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id_usuario,
        u.nombre_completo,
        u.user_tag,
        u.xp_acumulado,
        r.nombre_rango
    FROM public.usuarios u
    JOIN public.rangos r ON u.id_rango = r.id_rango
    WHERE u.id_usuario != p_id_usuario
      AND (u.nombre_completo ILIKE '%' || p_query || '%' OR u.user_tag ILIKE '%' || p_query || '%')
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. TRIGGERS Y FUNCIONES AUTOMÁTICAS (GAMIFICACIÓN Y RANGOS)
-- ============================================================================

-- A. Función Trigger: Otorgar XP al completar tarea
CREATE OR REPLACE FUNCTION public.fn_otorgar_xp_tarea()
RETURNS TRIGGER AS $$
DECLARE
    v_xp_ganado INT := 10;
BEGIN
    -- Solo actuar cuando la tarea cambia de estado a COMPLETADA
    IF (OLD.estado != 'COMPLETADA' AND NEW.estado = 'COMPLETADA') THEN
        -- Asignación de XP según la prioridad de la misión
        CASE NEW.prioridad
            WHEN 'ALTA' THEN v_xp_ganado := 40;
            WHEN 'MEDIA' THEN v_xp_ganado := 25;
            WHEN 'BAJA' THEN v_xp_ganado := 10;
            ELSE v_xp_ganado := 10;
        END CASE;

        -- Actualizar fecha de completado
        NEW.fecha_completada := NOW();

        -- Sumar el XP en la ficha pública del usuario
        UPDATE public.usuarios
        SET xp_acumulado = xp_acumulado + v_xp_ganado
        WHERE id_usuario = NEW.id_usuario;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador en Tabla Tareas Individuales
CREATE TRIGGER trg_actualizar_xp_tarea
BEFORE UPDATE ON public.tareas
FOR EACH ROW
EXECUTE FUNCTION public.fn_otorgar_xp_tarea();

-- B. Función Trigger: Actualizar Rango automáticamente según el XP
CREATE OR REPLACE FUNCTION public.fn_actualizar_rango_usuario()
RETURNS TRIGGER AS $$
DECLARE
    v_nuevo_rango_id INT;
BEGIN
    -- Buscar el rango correspondiente al nuevo XP acumulado
    SELECT id_rango INTO v_nuevo_rango_id
    FROM public.rangos
    WHERE NEW.xp_acumulado >= xp_minimo AND NEW.xp_acumulado <= xp_maximo
    ORDER BY xp_minimo DESC
    LIMIT 1;

    -- Si se determinó un nuevo rango válido, actualizar id_rango
    IF v_nuevo_rango_id IS NOT NULL THEN
        NEW.id_rango := v_nuevo_rango_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador en Tabla Usuarios
CREATE TRIGGER trg_verificar_rango_usuario
BEFORE UPDATE OF xp_acumulado ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_rango_usuario();
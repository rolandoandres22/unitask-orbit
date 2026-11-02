import { supabase, supabaseAdmin } from '../config/db';

export const registerUser = async (email: string, password: string, nombre_completo: string) => {
  // 1. Crear el usuario en Supabase Auth
  const authResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre_completo }
    }
  });

  if (authResponse.error || !authResponse.data.user) {
    return authResponse;
  }

  // 2. Usar UPSERT para evitar el error 23505 (clave duplicada)
  // e incluir password_hash para evitar el error 23502 (NOT NULL)
  const { error: dbError } = await supabaseAdmin
    .from('usuarios')
    .upsert([
      {
        id_usuario: authResponse.data.user.id,
        nombre_completo,
        email,
        password_hash: 'MANAGED_BY_SUPABASE_AUTH',
        id_rango: 1,
        xp_acumulado: 0
      }
    ], { onConflict: 'id_usuario' });

  if (dbError) {
    console.error('Error al sincronizar con public.usuarios:', dbError);
    return { data: { user: null, session: null }, error: dbError };
  }

  return authResponse;
};

export const loginUser = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};
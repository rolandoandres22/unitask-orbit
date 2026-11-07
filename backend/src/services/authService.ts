import { supabase, supabaseAdmin } from '../config/db.js';
//Registra a un estudiante en la plataforma UniTask.
export const registerUser = async (email: string, password: string, nombre_completo: string) => {
  // 1. Crear el usuario en Supabase Auth
  const authResponse = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre_completo }
    }
  });
  // Si ocurre un error en la creación del usuario en Auth o no devuelve datos, detiene el flujo
  if (authResponse.error || !authResponse.data.user) {
    return authResponse;
  }

  // 2. Sincronizar el nuevo usuario con la tabla pública 'usuarios'
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

  if (dbError) {// Si falla la inserción retorna el fallo
    console.error('Error al sincronizar con public.usuarios:', dbError);
    return { data: { user: null, session: null }, error: dbError };
  }

  return authResponse;
};
//Autentica a un estudiante mediante su correo y contraseña
export const loginUser = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};
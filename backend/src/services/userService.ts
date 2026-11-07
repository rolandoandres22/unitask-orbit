import { supabaseAdmin } from '../config/db.js';//privi de admin
//consulta la BD para obtener los datos del perfil y rango
export const getUserProfile = async (userId: string) => {
  return await supabaseAdmin
    .from('usuarios')
    .select('*, rangos(nombre_rango, xp_minimo, xp_maximo)')//selecciona todos los campor y ademas trae el rango
    .eq('id_usuario', userId)
    .single();
};
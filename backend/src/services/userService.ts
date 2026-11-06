import { supabaseAdmin } from '../config/db.js';

export const getUserProfile = async (userId: string) => {
  return await supabaseAdmin
    .from('usuarios')
    .select('*, rangos(nombre_rango, xp_minimo, xp_maximo)')
    .eq('id_usuario', userId)
    .single();
};
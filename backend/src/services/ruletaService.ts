import { supabaseAdmin } from '../config/db.js';

export const getRandomConsejo = async () => {
  // Traemos los IDs disponibles en la tabla
  const { data: idList, error: idError } = await supabaseAdmin
    .from('consejos')
    .select('id_consejo');

  if (idError || !idList || idList.length === 0) {
    console.error('Error o tabla vacía en Supabase:', idError?.message);
    return null;
  }

  // Elegir un ID al azar de la lista real de la BD
  const randomId = idList[Math.floor(Math.random() * idList.length)].id_consejo;

  // Consultar el consejo completo por ese ID seleccionado
  const { data: consejo, error } = await supabaseAdmin
    .from('consejos')
    .select('id_consejo, titulo, contenido_consejo, categoria')
    .eq('id_consejo', randomId)
    .single();

  if (error) throw error;

  return consejo;
};
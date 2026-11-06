import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Carga las variables de entorno desde el archivo .env
dotenv.config();
// Obtención de las credenciales de Supabase desde las variables de entorno
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente público estándar (para auth pública) para consultas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente de administración exclusivo del servidor (salta RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.js';
//Interfaz personalizada que inyecta los datos del usuario autenticado en la petición
export interface AuthenticatedRequest extends Request {
  user?: any;
}
//Middleware para la protección de rutas de la API mediante verificación de Token JWT.
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];//Extraer el encabezado de autorización HTTP de la petición
  const token = authHeader && authHeader.split(' ')[1];//extraer el valor del token eliminando el prefijo 'Bearer '

  if (!token) {// Si no se incluyó ningún token en la cabecera, deniega el acceso
    return res.status(401).json({ error: 'Token de acceso no proporcionado' });
  }
  // Validar el token JWT contra el servicio de Autenticación de Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  // Si el token falló en la verificación, expiró o no devolvió un usuario válido devuelve error
  if (error || !user) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
  // Inyectar la información del usuario validado dentro del objeto req
  req.user = user;
  next();//Continuar hacia el controlador o la siguiente función
};
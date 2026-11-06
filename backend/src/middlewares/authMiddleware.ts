import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }

  req.user = user;
  next();
};
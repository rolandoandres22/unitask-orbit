import { Request, Response } from 'express';
// Importación del servicio con la lógica de registro e inicio de sesión
import * as authService from '../services/authService.js';
import { supabaseAdmin } from '../config/db.js';

//Registra un nuevo estudiante en UniTask
export const register = async (req: Request, res: Response) => {
  const { email, password, nombre_completo } = req.body;

  // 1. Verificación de campos obligatorios
  if (!email || !password || !nombre_completo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // 2. Validación de complejidad de contraseña
  //mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.'
    });
  }

  // 3. Envío al servicio de autenticación
  const { data, error } = await authService.registerUser(email, password, nombre_completo);

  if (error) {
    console.error('Error de Supabase Auth:', error);
    return res.status(400).json({ error: error.message });
  }
  // Retorna respuesta de éxito HTTP 201 Created con los datos
  return res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: data.user,
    session: data.session
  });
};
//Autentica un usuario existente en la plataforma
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {// Validación previa de presencia de credenciales
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  // 1. Autenticar credenciales con Supabase Auth
  const { data, error } = await authService.loginUser(email, password);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // 2. Consultar el perfil público usando supabaseAdmin
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuarios')
    .select('user_tag, nombre_completo, id_rango, xp_acumulado')
    .eq('id_usuario', data.user.id)
    .maybeSingle();

  if (perfilError) {
    console.error('Error al consultar perfil:', perfilError.message);
  }

  // 3. Fusionar datos de Auth y Perfil
  const userPayload = {
    ...data.user,
    user_tag: perfil?.user_tag || '000000',
    nombre_completo: perfil?.nombre_completo || data.user.user_metadata?.nombre_completo
  };

  return res.status(200).json({// Retorna respuesta de éxito HTTP 200 OK
    message: 'Inicio de sesión exitoso',
    user: userPayload,
    token: data.session?.access_token
  });
};
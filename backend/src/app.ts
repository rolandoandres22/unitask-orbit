import express from 'express';
import cors from 'cors';
// Importación de las rutas de cada módulo del sistema UniTask
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import ruletaRoutes from './routes/ruletaRoutes.js';
import estadisticasRoutes from './routes/estadisticasRoutes.js';
// Importación de controlador y middleware para la búsqueda global de usuarios
import { searchUsers } from './controllers/friendController.js';
import { authenticateToken } from './middlewares/authMiddleware.js';
// Inicialización de la aplicación Express
const app = express();
// Habilita CORS para permitir peticiones desde el frontend en desarrollo local y Vercel
app.use(cors());
// Parser para transformar el cuerpo de las peticiones entrantes a JSON
app.use(express.json());

// Registro de Rutas
app.use('/api/auth', authRoutes);// Autenticación y registro de usuarios (/api/auth)
app.use('/api/usuario', userRoutes);// Gestión del expediente de usuario y perfil (/api/usuario)
app.use('/api/tareas', taskRoutes);// Gestión de misiones / tareas (/api/tareas)
app.use('/api/amigos', friendRoutes);// Sistema de vínculos y solicitudes de amistad (/api/amigos)
app.use('/api/grupos', groupRoutes);// Administración de grupos de estudio y escuadrones (/api/grupos)
app.use('/api', ruletaRoutes);// Endpoints del widget de la ruleta de consejos (/api/ruleta)
app.use('/api', estadisticasRoutes);// Métricas, reportes y gráficos de rendimiento (/api/estadisticas)

// Búsqueda global de estudiantes por nombre o #tag
app.get('/api/usuarios/buscar', authenticateToken, searchUsers);
// Endpoint de verificación de salud del servidor (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor UniTask funcionando en capas' });
});
// Exporta la instancia
export default app;
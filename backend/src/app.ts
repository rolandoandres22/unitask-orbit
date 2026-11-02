import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import friendRoutes from './routes/friendRoutes';
import groupRoutes from './routes/groupRoutes';
import { searchUsers } from './controllers/friendController';
import { authenticateToken } from './middlewares/authMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// Registro de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuario', userRoutes);
app.use('/api/tareas', taskRoutes);
app.use('/api/amigos', friendRoutes);
app.use('/api/grupos', groupRoutes);

// Búsqueda global de estudiantes por nombre o #tag
app.get('/api/usuarios/buscar', authenticateToken, searchUsers);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor UniTask funcionando en capas' });
});

export default app;
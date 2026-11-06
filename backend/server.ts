import app from './src/app.js';
import dotenv from 'dotenv';

// Carga las variables de entorno desde el archivo .env en desarrollo local
dotenv.config();

// 1. EXPORTACIÓN PARA VERCEL
// Vercel requiere que se exporte la instancia de Express/App por defecto para manejar las peticiones HTTP
export default app;

// 2. EJECUCIÓN EN ENTORNO LOCAL / SERVIDOR DEDICADO
// Si la variable de entorno VERCEL no existe, significa que el servidor se ejecuta localmente
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`Servidor UniTask iniciado correctamente`);
    console.log(`URL local: http://localhost:${PORT}/api`);
  });
}